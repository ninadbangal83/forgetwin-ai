import numpy as np

def calculate_bounds_and_chunk(instances: list, unique_geometries: dict, logs: list) -> tuple:
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
            "instances": chunk_instances
        })

    return root_min, root_max, chunks_metadata
