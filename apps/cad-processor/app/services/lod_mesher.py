import numpy as np
import trimesh
from app.services.geometry import extract_mesh_from_shape

def generate_lod_meshes(unique_shapes: dict, logs: list) -> dict:
    logs.append("Generating LOD meshes with memory optimizations...")
    unique_geometries = {}
    
    for shape_hash, shape in unique_shapes.items():
        unique_geometries[shape_hash] = {}
        color = np.random.randint(100, 200, size=4)
        color[3] = 255
        
        # Extract the primary high-res mesh once to save memory
        base_mesh = extract_mesh_from_shape(shape, 0.1)
        if base_mesh:
            base_mesh.visual.vertex_colors = np.tile(color, (len(base_mesh.vertices), 1))
            unique_geometries[shape_hash]["LOD0"] = base_mesh
            
            # Decimate base mesh for LOD1 and LOD2 to avoid heavy C++ allocations
            try:
                lod1_mesh = base_mesh.simplify_quadratic_decimation(len(base_mesh.faces) // 2)
                if not lod1_mesh or len(lod1_mesh.vertices) == 0:
                    lod1_mesh = base_mesh
            except Exception:
                lod1_mesh = base_mesh
                
            try:
                lod2_mesh = base_mesh.simplify_quadratic_decimation(len(base_mesh.faces) // 4)
                if not lod2_mesh or len(lod2_mesh.vertices) == 0:
                    lod2_mesh = base_mesh
            except Exception:
                lod2_mesh = base_mesh
                
            unique_geometries[shape_hash]["LOD1"] = lod1_mesh
            unique_geometries[shape_hash]["LOD2"] = lod2_mesh
            
    return unique_geometries

