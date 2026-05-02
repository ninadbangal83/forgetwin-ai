import trimesh
import numpy as np

HAS_OCC = False
try:
    from OCC.Core.STEPCAFControl import STEPCAFControl_Reader
    from OCC.Core.TDocStd import TDocStd_Document
    from OCC.Core.XCAFDoc import XCAFDoc_DocumentTool
    from OCC.Core.XCAFApp import XCAFApp_Application
    from OCC.Core.TDF import TDF_Label, TDF_LabelSequence
    from OCC.Core.TDataStd import TDataStd_Name
    from OCC.Core.IFSelect import IFSelect_RetDone
    from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_FACE
    from OCC.Core.TopoDS import topods
    from OCC.Core.BRep import BRep_Tool
    HAS_OCC = True
except ImportError:
    HAS_OCC = False


def get_label_name(label) -> str:
    if not HAS_OCC:
        return "Unnamed Node"
    try:
        name_attr = TDataStd_Name()
        if label.FindAttribute(TDataStd_Name.GetID(), name_attr):
            return str(name_attr.Get())
    except Exception:
        try:
            return label.GetLabelName() or "Unnamed Node"
        except Exception:
            pass
    return "Unnamed Node"


def gp_trsf_to_numpy(trsf) -> np.ndarray:
    matrix = np.eye(4)
    if not HAS_OCC:
        return matrix
    for r in range(3):
        for c in range(4):
            matrix[r, c] = trsf.Value(r + 1, c + 1)
    return matrix


def extract_mesh_from_shape(shape, deflection) -> trimesh.Trimesh:
    if not HAS_OCC:
        return None
    mesh_algo = BRepMesh_IncrementalMesh(shape, deflection)
    mesh_algo.Perform()
    
    vertices, faces = [], []
    vertex_offset = 0
    
    exp_face = TopExp_Explorer(shape, TopAbs_FACE)
    while exp_face.More():
        face = topods.Face(exp_face.Current())
        location = face.Location()
        triangulation = BRep_Tool.Triangulation(face, location)
        
        if triangulation:
            for i in range(1, triangulation.NbNodes() + 1):
                p = triangulation.Node(i)
                p.Transform(location.Transformation())
                vertices.append([p.X(), p.Y(), p.Z()])
            
            for i in range(1, triangulation.NbTriangles() + 1):
                t = triangulation.Triangle(i)
                idx1, idx2, idx3 = t.Get()
                faces.append([idx1 - 1 + vertex_offset, idx2 - 1 + vertex_offset, idx3 - 1 + vertex_offset])
                
            vertex_offset += triangulation.NbNodes()
        exp_face.Next()
        
    if not vertices or not faces: return None
    return trimesh.Trimesh(vertices=np.array(vertices), faces=np.array(faces))
