'use client';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { List } from 'react-window';
import { RootState } from '@/store/store';
import { TreeNode } from '@/types/viewer';
import { flattenTree, FlattenedNode } from './hierarchyUtils';
import { HierarchyRow } from './HierarchyRow';

export function HierarchyPanel() {
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

  if (!tree) {
    return <div className="text-slate-500 text-xs p-4 select-none">No assembly structure extracted.</div>;
  }

  const RowWrapper = ({ index, style, data }: { index: number, style: React.CSSProperties, data: FlattenedNode[] }) => (
    <HierarchyRow
      index={index}
      style={style}
      data={data}
      selectedNodeId={selectedNodeId}
      onToggleExpand={toggleExpand}
    />
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-950/10">
      <div className="p-2 text-[10px] font-mono text-slate-500 border-b border-slate-800/40 bg-slate-950/30 flex justify-between select-none">
        <span>Nodes: {flattenedData.length}</span>
        <span className="text-teal-400 font-bold">Virtualized</span>
      </div>
      <div className="flex-1 min-h-0 w-full overflow-hidden relative">
        <List<{ data: FlattenedNode[] }>
          rowCount={flattenedData.length}
          rowHeight={36}
          rowProps={{ data: flattenedData }}
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          rowComponent={RowWrapper as any}
          style={{ height: '800px', width: '100%' }}
          className="absolute inset-0 h-full"
        />
      </div>
    </div>
  );
}
