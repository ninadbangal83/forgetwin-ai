import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setActiveTool, setIsolatedNodes } from '@/store/viewerToolsSlice';
import { ToolbarButton } from './ToolbarButton';
import { tools } from './toolbarConstants';

export const ToolControls: React.FC = () => {
    const dispatch = useDispatch();
    const activeTool = useSelector((state: RootState) => state.viewerTools.activeTool);
    const selectedNodeId = useSelector((state: RootState) => state.viewer.selectedNodeId);
    const isolatedNodes = useSelector((state: RootState) => state.viewerTools.isolatedNodeIds);

    const handleIsolate = () => {
        if (isolatedNodes.length > 0) {
            dispatch(setIsolatedNodes([])); 
        } else if (selectedNodeId) {
            dispatch(setIsolatedNodes([selectedNodeId]));
        }
    };

    return (
        <>
            {tools.filter(t => t.id === 'select').map(t => (
                <ToolbarButton
                  id={t.id}
                  key={t.id}
                  label={t.label}
                  icon={t.icon}
                  isActive={activeTool === t.id}
                  onClick={() => dispatch(setActiveTool(t.id as 'select' | 'measure' | 'clip' | 'explode'))}
                />
            ))}

            <ToolbarButton
              id="isolate"
              label="Isolate Selected Part"
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
              isActive={isolatedNodes.length > 0}
              activeClassName="bg-teal-500/20 border-teal-500 text-teal-300 shadow-lg shadow-teal-500/20"
              onClick={handleIsolate}
              disabled={!selectedNodeId && isolatedNodes.length === 0}
            />

            <div className="w-px h-8 bg-slate-800/60 self-center mx-1" />

            {tools.filter(t => t.id !== 'select').map(t => (
                <ToolbarButton
                  id={t.id}
                  key={t.id}
                  label={t.label}
                  icon={t.icon}
                  isActive={activeTool === t.id}
                  onClick={() => dispatch(setActiveTool(t.id as 'select' | 'measure' | 'clip' | 'explode'))}
                />
            ))}
        </>
    );
};
