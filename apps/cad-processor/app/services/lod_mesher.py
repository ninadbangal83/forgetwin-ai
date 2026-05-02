import numpy as np
from app.services.geometry import extract_mesh_from_shape

def generate_lod_meshes(unique_shapes: dict, logs: list) -> dict:
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
                
    return unique_geometries
