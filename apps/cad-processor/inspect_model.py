import sys
import uuid
import json
import numpy as np
from app.services.geometry import HAS_OCC
if HAS_OCC:
    from OCC.Core.STEPCAFControl import STEPCAFControl_Reader
    from OCC.Core.TDocStd import TDocStd_Document
    from OCC.Core.XCAFDoc import XCAFDoc_DocumentTool
    from OCC.Core.XCAFApp import XCAFApp_Application
    from OCC.Core.TDF import TDF_LabelSequence
    from OCC.Core.IFSelect import IFSelect_RetDone
    from app.services.tree_builder import build_assembly_tree

    app = XCAFApp_Application.GetApplication()
    doc = TDocStd_Document("MDTV-XCAF")
    app.NewDocument("MDTV-XCAF", doc)
    
    step_reader = STEPCAFControl_Reader()
    if step_reader.ReadFile("/tmp/Assem1.STEP") != IFSelect_RetDone:
        raise ValueError("Failed to read STEP file.")
        
    step_reader.Transfer(doc)
    shape_tool = XCAFDoc_DocumentTool.ShapeTool(doc.Main())
    free_shapes = TDF_LabelSequence()
    shape_tool.GetFreeShapes(free_shapes)
    
    unique_shapes = {}
    instances = []
    
    if free_shapes.Length() == 1:
        assembly_tree = build_assembly_tree(shape_tool, free_shapes.Value(1), np.eye(4), unique_shapes, instances)
    else:
        assembly_tree = {
            "id": str(uuid.uuid4()), "name": "Model Root", "children": [], "metrics": {}, "type": "Assembly"
        }
        for i in range(1, free_shapes.Length() + 1):
            child_node = build_assembly_tree(shape_tool, free_shapes.Value(i), np.eye(4), unique_shapes, instances)
            assembly_tree["children"].append(child_node)
            
    summary = {
        "fileName": "Assem1.STEP",
        "assemblyName": assembly_tree["name"],
        "totalChildren": len(assembly_tree["children"]),
        "uniqueShapes": len(unique_shapes),
        "physicalInstances": len(instances),
        "instances": [
            {
                "hash": inst["hash"],
                "node_id": inst["node_id"],
                "center": [float(c) for c in inst["center"]]
            }
            for inst in instances
        ],
        "assemblyTree": assembly_tree
    }
    
    print(json.dumps(summary, indent=2))
else:
    print("OCC is not available.")
