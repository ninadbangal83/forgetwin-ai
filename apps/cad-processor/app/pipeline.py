import os
import time
import uuid
import tempfile
import numpy as np

from app.services.storage import storage_service
from app.services.geometry import HAS_OCC
from app.services.tree_builder import build_assembly_tree
from app.services.mock_processor import run_mock_processing
from app.services.callback import send_callback
from app.services.lod_mesher import generate_lod_meshes
from app.services.chunk_sorter import calculate_bounds_and_chunk
from app.services.exporter import export_chunks_and_manifest

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
        
        unique_geometries = generate_lod_meshes(unique_shapes, logs)
        root_min, root_max, chunks_metadata = calculate_bounds_and_chunk(instances, unique_geometries, logs)
        manifest_key = export_chunks_and_manifest(modelId, root_min.tolist(), root_max.tolist(), chunks_metadata, unique_geometries, logs)

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
