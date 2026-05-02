import { TreeNode } from '@/types/viewer';

export interface FlattenedNode extends TreeNode {
  level: number;
  isHidden: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
}

export const flattenTree = (
  node: TreeNode | null | undefined,
  level = 0,
  hiddenIds: string[],
  expandedIds: Set<string>,
  result: FlattenedNode[] = []
): FlattenedNode[] => {
  if (!node) return result;
  
  const isHidden = hiddenIds.includes(node.id);
  const isExpanded = expandedIds.has(node.id) || level === 0;
  const hasChildren = !!(node.children && node.children.length > 0);
  
  result.push({
    ...node,
    level,
    isHidden,
    isExpanded,
    hasChildren
  });
  
  if (isExpanded && hasChildren && node.children) {
    node.children.forEach((child) => flattenTree(child, level + 1, hiddenIds, expandedIds, result));
  }
  
  return result;
};

export const findNode = (node: TreeNode | null | undefined, id: string): TreeNode | null => {
  if (!node) return null;
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
};
