import os
import time
import json
import tempfile
import uuid
import numpy as np
import trimesh

from app.services.storage import storage_service
from app.services.geometry import HAS_OCC, extract_mesh_from_shape
from app.services.tree_builder import build_assembly_tree
from app.services.mock_processor import run_mock_processing
from app.services.callback import send_callback

if HAS_OCC:
    from OCC.Core.STEPCAFControl import STEPCAFControl_Reader
    from OCC.Core.TDocStd import TDocStd_Document
    from OCC.Core.XCAFDoc import XCAFDoc_DocumentTool
    from OCC.Core.XCAFApp import XCAFApp_Application
    from OCC.Core.TDF import TDF_LabelSequence
    from OCC.Core.IFSelect import IFSelect_RetDone


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
            payload = run_mock_processing(modelId, correlationId, start_time, logs)
            send_callback(payload)
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
        lod_profiles = [("LOD0", 0.05), ("LOD1", 0.5), ("LOD2", 5.0)]
        unique_geometries = {}
        
        for shape_hash, shape in unique_shapes.items():
            unique_geometries[shape_hash] = {}
            color = np.random.randint(100, 200, size=4)
            color[3] = 255
            
            for lod_name, deflection in lod_profiles:
                mesh = extract_mesh_from_shape(shape, deflection)
                if mesh:
                    mesh.visual.vertex_colors = np.tile(color, (len(mesh.vertices), 1))
                    unique_geometries[shape_hash][lod_name] = mesh
        
        logs.append("Spatial Partitioning (Chunking)...")
        instances.sort(key=lambda x: x["center"][0])
        
        CHUNK_SIZE = 200
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
        
        payload = {
            "modelId": modelId,
            "status": "COMPLETED",
            "durationMs": int((time.time() - start_time) * 1000),
            "processedStorageKey": manifest_key,
            "metadata": {"chunks": len(chunks_metadata), "totalInstances": len(instances), "lodLevels": 3},
            "assemblyTree": assembly_tree,
            "processingLogs": logs
        }
        send_callback(payload)
        
    except Exception as e:
        payload = {
            "modelId": modelId,
            "status": "FAILED",
            "durationMs": int((time.time() - start_time) * 1000),
            "errorMessage": str(e),
            "processingLogs": logs + [f"FAILED: {str(e)}"]
        }
        send_callback(payload)
    finally:
        if temp_step_path and os.path.exists(temp_step_path):
            os.remove(temp_step_path)
