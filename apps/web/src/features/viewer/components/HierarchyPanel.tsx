'use client';
import { _any } from '@/types/viewer';
import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { List } from 'react-window';
import { RootState } from '@/store/store';
import { setSelectedNodeId, toggleNodeVisibility } from '@/store/viewerSlice';

// Flatten the tree for react-window virtualization
const flattenTree = (node: _any, level = 0, hiddenIds: string[], expandedIds: Set<string>, result: _any[] = []) => {
  if (!node) return result;
  
  const isHidden = hiddenIds.includes(node.id);
  const isExpanded = expandedIds.has(node.id) || level === 0;
  const hasChildren = node.children && node.children.length > 0;
  
  result.push({
    ...node,
    level,
    isHidden,
    isExpanded,
    hasChildren
  });
  
  if (isExpanded && hasChildren) {
    node.children.forEach((child: _any) => flattenTree(child, level + 1, hiddenIds, expandedIds, result));
  }
  
  return result;
};

export function HierarchyPanel() {
  const dispatch = useDispatch();
  const tree = useSelector((state: RootState) => state.viewer.assemblyTree);
  const selectedNodeId = useSelector((state: RootState) => state.viewer.selectedNodeId);
  const hiddenNodeIds = useSelector((state: RootState) => state.viewer.hiddenNodeIds);
  
  // Track expanded nodes locally to prevent massive Redux dispatch overhead
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
    return flattenTree(tree, 0, hiddenNodeIds, expandedIds);
  }, [tree, hiddenNodeIds, expandedIds]);

  if (!tree) {
    return <div className="text-slate-500 text-xs p-4 select-none">No assembly structure extracted.</div>;
  }

  // The virtualized row renderer
  const Row = ({ index, style, data }: { index: number, style: React.CSSProperties, data: _any[] }) => {
    const node = data[index];
    const isSelected = selectedNodeId === node.id;
    const icon = node.type === 'Assembly' ? '📦' : '⚙️';

    return (
      <div 
        style={style}
        className={`flex items-center px-2 cursor-pointer transition-colors text-xs font-sans select-none border-b border-slate-800/20 h-[36px] ${isSelected ? 'bg-indigo-950/60 text-indigo-300 border-l-4 border-indigo-500 font-bold' : 'text-slate-300 hover:bg-slate-900/60 border-l-4 border-transparent'}`}
        onClick={() => dispatch(setSelectedNodeId(node.id))}
      >
        <div style={{ paddingLeft: `${node.level * 16}px` }} className="flex items-center w-full h-full">
          <span 
            className="w-5 h-5 flex items-center justify-center text-slate-500 mr-1 opacity-60 hover:opacity-100"
            onClick={(e) => toggleExpand(node.id, e)}
          >
            {node.hasChildren ? (node.isExpanded ? '▾' : '▸') : '•'}
          </span>
          
          <span className="mr-2 text-xs">{icon}</span>
          
          <span className="flex-1 truncate">
            {node.name || 'Unnamed Part'}
          </span>
          
          <button 
            className={`ml-2 px-1.5 py-0.5 rounded-lg text-[10px] font-black ${node.isHidden ? 'bg-red-950/40 border border-red-800/40 text-red-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            onClick={(e) => {
              e.stopPropagation();
              dispatch(toggleNodeVisibility(node.id));
            }}
          >
            {node.isHidden ? 'HIDDEN' : '👁'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950/10">
      <div className="p-2 text-[10px] font-mono text-slate-500 border-b border-slate-800/40 bg-slate-950/30 flex justify-between select-none">
        <span>Nodes: {flattenedData.length}</span>
        <span className="text-teal-400 font-bold">Virtualized</span>
      </div>
      <div className="flex-1 min-h-0 w-full overflow-hidden relative">
        <List<{ data: _any[] }>
          rowCount={flattenedData.length}
          rowHeight={36}
          rowProps={{ data: flattenedData }}
          rowComponent={Row as _any}
          style={{ height: '800px', width: '100%' }}
          className="absolute inset-0 h-full"
        />
      </div>
    </div>
  );
}
