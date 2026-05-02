'use client';
import React from 'react';
import { List } from 'react-window';
import { FlattenedNode } from '@/types/viewer';
import { HierarchyRow } from '@/features/viewer/components/HierarchyRow';
import { useHierarchyState } from '@/features/viewer/hooks/useHierarchyState';

export function HierarchyPanel() {
  const {
    tree,
    selectedNodeId,
    flattenedData,
    toggleExpand,
  } = useHierarchyState();

  if (!tree) {
    return <div className="text-slate-500 text-xs p-4 select-none">No assembly structure extracted.</div>;
  }

  const RowWrapper = ({ index, style, data }: { index: number; style: React.CSSProperties; data: FlattenedNode[] }) => (
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



