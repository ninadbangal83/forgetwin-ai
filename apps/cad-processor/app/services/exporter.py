import json
import trimesh
from app.services.storage import storage_service

def export_chunks_and_manifest(modelId: str, root_min: list, root_max: list, chunks_metadata: list, unique_geometries: dict, logs: list) -> str:
    logs.append("Writing Streaming Manifest and Chunk GLBs...")
    lod_profiles = [("LOD0", 0.05), ("LOD1", 0.5), ("LOD2", 5.0)]
    
    final_chunks_list = []

    for chunk in chunks_metadata:
        chunk_id = chunk["id"]
        for lod_name, _ in lod_profiles:
            scene = trimesh.Scene()
            for inst in chunk["instances"]:
                shape_dict = unique_geometries.get(inst["hash"], {})
                if lod_name in shape_dict:
                    mesh = shape_dict[lod_name].copy()
                    mesh.apply_transform(inst["transform"])
                    scene.add_geometry(mesh, node_name=inst["node_id"], geom_name=inst["node_id"])
            
            if not scene.is_empty:
                glb_bytes = scene.export(file_type='glb')
                key = f"processed/{modelId}/{chunk_id}_{lod_name}.glb"
                storage_service.upload_file("processed-models", key, glb_bytes, content_type="model/gltf-binary")

        final_chunks_list.append({
            "id": chunk_id,
            "bounds": chunk["bounds"],
            "instances": len(chunk["instances"])
        })

    manifest = {
        "modelId": modelId,
        "rootBounds": [root_min, root_max],
        "chunks": final_chunks_list,
        "format": "ForgetwinStreaming.v1"
    }
    
    manifest_bytes = json.dumps(manifest).encode('utf-8')
    manifest_key = f"processed/{modelId}/manifest.json"
    storage_service.upload_file("processed-models", manifest_key, manifest_bytes, content_type="application/json")
    return manifest_key
