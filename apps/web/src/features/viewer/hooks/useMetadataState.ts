import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { findNode } from '@/features/viewer/utils/hierarchyUtils';
import { TreeNode } from '@/types/viewer';


export function useMetadataState() {
  const tree = useSelector((state: RootState) => state.viewer.assemblyTree);
  const selectedNodeId = useSelector((state: RootState) => state.viewer.selectedNodeId);

  const selectedNode = selectedNodeId ? findNode(tree as TreeNode | null, selectedNodeId) : null;

  return {
    selectedNode,
  };
}
