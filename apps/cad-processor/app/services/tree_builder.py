import uuid
import numpy as np
from app.services.geometry import HAS_OCC, get_label_name, gp_trsf_to_numpy

if HAS_OCC:
    from OCC.Core.TDF import TDF_Label, TDF_LabelSequence


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

        vol = 0.0
        center_of_mass = center
        xmin, ymin, zmin, xmax, ymax, zmax = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
        try:
            from OCC.Core.Bnd import Bnd_Box
            from OCC.Core.BRepBndLib import brepbndlib_Add
            bbox = Bnd_Box()
            brepbndlib_Add(shape, bbox)
            xmin, ymin, zmin, xmax, ymax, zmax = bbox.Get()
            dx = xmax - xmin
            dy = ymax - ymin
            dz = zmax - zmin
        except Exception:
            pass

        try:
            from OCC.Core.GProp import GProp_GProps
            from OCC.Core.BRepGProp import brepgprop
            props = GProp_GProps()
            brepgprop.Volume(shape, props)
            vol = float(props.Mass())
            cm = props.CentreOfMass()
            center_of_mass = [float(cm.X()), float(cm.Y()), float(cm.Z())]
        except Exception:
            pass

        if vol <= 0.001:
            # Fallback to oriented bounding box volume
            vol = dx * dy * dz

        node_data["metrics"] = {
            "volume": round(vol, 2),
            "centerOfMass": [round(c, 2) for c in center_of_mass],
            "boundingBox": {
                "min": [round(xmin, 2), round(ymin, 2), round(zmin, 2)],
                "max": [round(xmax, 2), round(ymax, 2), round(zmax, 2)]
            },
            "dimensions": {
                "length": round(dx, 2),
                "width": round(dy, 2),
                "height": round(dz, 2)
            },
            "density": 7.85
        }

    return node_data
