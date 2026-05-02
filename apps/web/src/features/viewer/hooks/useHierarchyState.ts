import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { flattenTree } from '@/features/viewer/utils/hierarchyUtils';
import { TreeNode } from '@/types/viewer';


export function useHierarchyState() {
  const tree = useSelector((state: RootState) => state.viewer.assemblyTree);
  const selectedNodeId = useSelector((state: RootState) => state.viewer.selectedNodeId);
  const hiddenNodeIds = useSelector((state: RootState) => state.viewer.hiddenNodeIds);
  
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flattenedData = useMemo(() => {
    return flattenTree(tree as TreeNode, 0, hiddenNodeIds, expandedIds);
  }, [tree, hiddenNodeIds, expandedIds]);

  return {
    tree,
    selectedNodeId,
    flattenedData,
    toggleExpand,
  };
}
