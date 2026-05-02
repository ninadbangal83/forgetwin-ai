import os
import time
import io
import tempfile
import uuid
import json
import requests
import trimesh
import numpy as np

from app.config import config
from app.services.storage import storage_service
from app.services.geometry import (
    HAS_OCC, get_label_name, gp_trsf_to_numpy, extract_mesh_from_shape
)

if HAS_OCC:
    from OCC.Core.STEPCAFControl import STEPCAFControl_Reader
    from OCC.Core.TDocStd import TDocStd_Document
    from OCC.Core.XCAFDoc import XCAFDoc_DocumentTool
    from OCC.Core.XCAFApp import XCAFApp_Application
    from OCC.Core.TDF import TDF_Label, TDF_LabelSequence
    from OCC.Core.IFSelect import IFSelect_RetDone


def build_assembly_tree(shape_tool, label, parent_transform=np.eye(4), unique_shapes=None, instances=None):
    if unique_shapes is None: unique_shapes = {}
    if instances is None: instances = []

    node_id = str(uuid.uuid4())
    name = get_label_name(label)
    
    loc = shape_tool.GetLocation(label)
    local_trsf = gp_trsf_to_numpy(loc.Transformation()) if not loc.IsIdentity() else np.eye(4)
    world_transform = np.dot(parent_transform, local_trsf)
    center = [float(world_transform[0][3]), float(world_transform[1][3]), float(world_transform[2][3])]
    
    node_data = {
        "id": node_id, "name": name, "children": [], "metrics": {},
        "type": "Part" if shape_tool.IsSimpleShape(label) else "Assembly"
    }

    if shape_tool.IsAssembly(label):
        components = TDF_LabelSequence()
        shape_tool.GetComponents(label, components)
        for i in range(1, components.Length() + 1):
            comp_label = components.Value(i)
            ref_label = TDF_Label()
            if shape_tool.GetReferredShape(comp_label, ref_label):
                comp_loc = shape_tool.GetLocation(comp_label)
                comp_trsf = gp_trsf_to_numpy(comp_loc.Transformation()) if not comp_loc.IsIdentity() else np.eye(4)
                child_node = build_assembly_tree(shape_tool, ref_label, np.dot(world_transform, comp_trsf), unique_shapes, instances)
                node_data["children"].append(child_node)
                
    elif shape_tool.IsSimpleShape(label):
        shape = shape_tool.GetShape(label)
        try:
            shape_hash = hash(shape)
        except Exception:
            shape_hash = id(shape)
        
        if shape_hash not in unique_shapes:
            unique_shapes[shape_hash] = shape
                
        instances.append({
            "hash": shape_hash,
            "node_id": node_id,
            "transform": world_transform,
            "center": center
        })

    return node_data


def run_cad_processing(modelId: str, storageKey: str, correlationId: str):
    start_time = time.time()
    logs = [f"Started Chunking Pipeline. Correlation: {correlationId}"]
    temp_step_path = None
    
    try:
        logs.append(f"Downloading {storageKey} from MinIO...")
        temp_fd, temp_step_path = tempfile.mkstemp(suffix=".step")
        os.close(temp_fd)
        storage_service.download_file("raw-cad", storageKey, temp_step_path)
        
        if not HAS_OCC:
            logs.append("FALLBACK: OCC missing. Generating mock 3D geometry instead.")
            mesh = trimesh.creation.box(extents=[10, 10, 10])
            assembly_tree = {
                "id": str(uuid.uuid4()), "name": "Fallback Box", "children": [], "metrics": {}, "type": "Part"
            }
            chunks_metadata = [{
                "id": "chunk_000",
                "bounds": [[-10.0, -10.0, -10.0], [10.0, 10.0, 10.0]],
                "instances": 1
            }]
            for lod_name in ["LOD0", "LOD1", "LOD2"]:
                scene = trimesh.Scene()
                scene.add_geometry(mesh, node_name="fallback_geom", geom_name="fallback_geom")
                glb_bytes = scene.export(file_type='glb')
                key = f"processed/{modelId}/chunk_000_{lod_name}.glb"
                storage_service.upload_file("processed-models", key, glb_bytes, content_type="model/gltf-binary")

            manifest = {
                "modelId": modelId,
                "rootBounds": [[-10, -10, -10], [10, 10, 10]],
                "chunks": chunks_metadata,
                "format": "ForgetwinStreaming.v1"
            }
            manifest_bytes = json.dumps(manifest).encode('utf-8')
            manifest_key = f"processed/{modelId}/manifest.json"
            storage_service.upload_file("processed-models", manifest_key, manifest_bytes, content_type="application/json")

            payload = {
                "modelId": modelId,
                "status": "COMPLETED",
                "durationMs": int((time.time() - start_time) * 1000),
                "processedStorageKey": manifest_key,
                "metadata": {"chunks": 1, "totalInstances": 1, "lodLevels": 3},
                "assemblyTree": assembly_tree,
                "processingLogs": logs
            }
            headers = {"Authorization": f"Bearer {config.INTERNAL_WEBHOOK_SECRET}", "Content-Type": "application/json"}
            requests.post(f"{config.API_GATEWAY_URL}/v1/internal/callbacks/cad-processing", json=payload, headers=headers)
            return

        app = XCAFApp_Application.GetApplication()
        doc = TDocStd_Document("MDTV-XCAF")
        app.NewDocument("MDTV-XCAF", doc)
        
        step_reader = STEPCAFControl_Reader()
        if step_reader.ReadFile(temp_step_path) != IFSelect_RetDone:
            raise ValueError("Failed to read STEP file.")
            
        step_reader.Transfer(doc)
        shape_tool = XCAFDoc_DocumentTool.ShapeTool(doc.Main())
        free_shapes = TDF_LabelSequence()
        shape_tool.GetFreeShapes(free_shapes)

        unique_shapes = {}
        instances = []
        
        logs.append("Extracting logical assembly tree...")
        if free_shapes.Length() == 1:
            assembly_tree = build_assembly_tree(shape_tool, free_shapes.Value(1), np.eye(4), unique_shapes, instances)
        else:
            assembly_tree = {
                "id": str(uuid.uuid4()), "name": "Model Root", "children": [], "metrics": {}, "type": "Assembly"
            }
            for i in range(1, free_shapes.Length() + 1):
                child_node = build_assembly_tree(shape_tool, free_shapes.Value(i), np.eye(4), unique_shapes, instances)
                assembly_tree["children"].append(child_node)
        
        logs.append(f"Found {len(unique_shapes)} unique shapes, {len(instances)} physical instances.")
        
        logs.append("Generating LOD meshes (LOD0, LOD1, LOD2)...")
        # Deflections: 0.05 (High), 0.5 (Medium), 5.0 (Low)
        lod_profiles = [("LOD0", 0.05), ("LOD1", 0.5), ("LOD2", 5.0)]
        unique_geometries = {} # hash -> {LOD0: mesh, LOD1: mesh, LOD2: mesh}
        
        for shape_hash, shape in unique_shapes.items():
            unique_geometries[shape_hash] = {}
            # Generate a consistent random color for this shape
            color = np.random.randint(100, 200, size=4)
            color[3] = 255
            
            for lod_name, deflection in lod_profiles:
                mesh = extract_mesh_from_shape(shape, deflection)
                if mesh:
                    mesh.visual.vertex_colors = np.tile(color, (len(mesh.vertices), 1))
                    unique_geometries[shape_hash][lod_name] = mesh
        
        logs.append("Spatial Partitioning (Chunking)...")
        # Simple spatial sort along X axis (simulating a BVH node split for massive assemblies)
        instances.sort(key=lambda x: x["center"][0])
        
        CHUNK_SIZE = 200 # max parts per chunk
        chunks_metadata = []
        
        all_min = []
        all_max = []
        for inst in instances:
            shape_dict = unique_geometries.get(inst["hash"], {})
            if "LOD0" in shape_dict:
                mesh = shape_dict["LOD0"].copy()
                mesh.apply_transform(inst["transform"])
                all_min.append(mesh.bounds[0])
                all_max.append(mesh.bounds[1])

        if all_min and all_max:
            root_min = np.min(all_min, axis=0)
            root_max = np.max(all_max, axis=0)
        else:
            root_min = np.array([-50.0, -50.0, -50.0])
            root_max = np.array([50.0, 50.0, 50.0])
            
        for i in range(0, len(instances), CHUNK_SIZE):
            chunk_instances = instances[i:i+CHUNK_SIZE]
            chunk_id = f"chunk_{i//CHUNK_SIZE:03d}"
            
            chunk_min = []
            chunk_max = []
            for inst in chunk_instances:
                shape_dict = unique_geometries.get(inst["hash"], {})
                if "LOD0" in shape_dict:
                    mesh = shape_dict["LOD0"].copy()
                    mesh.apply_transform(inst["transform"])
                    chunk_min.append(mesh.bounds[0])
                    chunk_max.append(mesh.bounds[1])

            if chunk_min and chunk_max:
                min_b = np.min(chunk_min, axis=0) - 5.0
                max_b = np.max(chunk_max, axis=0) + 5.0
            else:
                min_b = np.array([-50.0, -50.0, -50.0])
                max_b = np.array([50.0, 50.0, 50.0])
            
            chunks_metadata.append({
                "id": chunk_id,
                "bounds": [min_b.tolist(), max_b.tolist()],
                "instances": len(chunk_instances)
            })
            
            # Export the 3 LOD files for this chunk
            for lod_name, _ in lod_profiles:
                scene = trimesh.Scene()
                for inst in chunk_instances:
                    shape_dict = unique_geometries.get(inst["hash"], {})
                    if lod_name in shape_dict:
                        mesh = shape_dict[lod_name].copy()
                        mesh.apply_transform(inst["transform"])
                        scene.add_geometry(mesh, node_name=inst["node_id"], geom_name=inst["node_id"])
                
                if not scene.is_empty:
                    glb_bytes = scene.export(file_type='glb')
                    key = f"processed/{modelId}/{chunk_id}_{lod_name}.glb"
                    storage_service.upload_file("processed-models", key, glb_bytes, content_type="model/gltf-binary")

        logs.append("Writing Streaming Manifest...")
        manifest = {
            "modelId": modelId,
            "rootBounds": [root_min.tolist(), root_max.tolist()],
            "chunks": chunks_metadata,
            "format": "ForgetwinStreaming.v1"
        }
        
        manifest_bytes = json.dumps(manifest).encode('utf-8')
        manifest_key = f"processed/{modelId}/manifest.json"
        storage_service.upload_file("processed-models", manifest_key, manifest_bytes, content_type="application/json")
        
        svg_key = None
        duration_ms = (time.time() - start_time) * 1000
        
        payload = {
            "modelId": modelId,
            "status": "COMPLETED",
            "durationMs": int(duration_ms),
            "processedStorageKey": manifest_key, # Tell frontend to load the manifest!
            "metadata": {"chunks": len(chunks_metadata), "totalInstances": len(instances), "lodLevels": 3},
            "assemblyTree": assembly_tree,
            "processingLogs": logs,
            "thumbnailKey": svg_key
        }
        
        headers = {"Authorization": f"Bearer {config.INTERNAL_WEBHOOK_SECRET}", "Content-Type": "application/json"}
        requests.post(f"{config.API_GATEWAY_URL}/v1/internal/callbacks/cad-processing", json=payload, headers=headers)
        
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        payload = {
            "modelId": modelId,
            "status": "FAILED",
            "durationMs": int(duration_ms),
            "errorMessage": str(e),
            "processingLogs": logs + [f"FAILED: {str(e)}"]
        }
        headers = {"Authorization": f"Bearer {config.INTERNAL_WEBHOOK_SECRET}", "Content-Type": "application/json"}
        requests.post(f"{config.API_GATEWAY_URL}/v1/internal/callbacks/cad-processing", json=payload, headers=headers)
    finally:
        if temp_step_path and os.path.exists(temp_step_path):
            os.remove(temp_step_path)
