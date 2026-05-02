import time
import uuid
import json
import trimesh
from app.services.storage import storage_service

def run_mock_processing(modelId: str, correlationId: str, start_time: float, logs: list) -> dict:
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

    return {
        "modelId": modelId,
        "status": "COMPLETED",
        "durationMs": int((time.time() - start_time) * 1000),
        "processedStorageKey": manifest_key,
        "metadata": {"chunks": 1, "totalInstances": 1, "lodLevels": 3},
        "assemblyTree": assembly_tree,
        "processingLogs": logs
    }
