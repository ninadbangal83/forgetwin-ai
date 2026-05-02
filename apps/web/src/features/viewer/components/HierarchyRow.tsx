import React from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedNodeId, toggleNodeVisibility } from '@/store/viewerSlice';
import { FlattenedNode, HierarchyRowProps } from '@/types/viewer';

export const HierarchyRow: React.FC<HierarchyRowProps> = ({
  index,
  style,
  data,
  selectedNodeId,
  onToggleExpand
}) => {
  const dispatch = useDispatch();
  const node = data[index];
  if (!node) return null;

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
          onClick={(e) => onToggleExpand(node.id, e)}
        >
          {node.hasChildren ? (node.isExpanded ? '▾' : '▸') : '•'}
        </span>
        
        <span className="mr-2 text-xs">{icon}</span>
        
        <span className="flex-1 truncate">
          {String(node.name || 'Unnamed Part')}
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
