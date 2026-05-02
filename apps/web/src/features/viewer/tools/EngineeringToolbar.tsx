import React from 'react';
import { useDispatch } from 'react-redux';
import { setActiveTool } from '@/store/viewerToolsSlice';
import { NavigationControls } from './NavigationControls';
import { ToolControls } from './ToolControls';

export function EngineeringToolbar() {
    const dispatch = useDispatch();
    const [cameraMode, setCameraMode] = React.useState<'orbit' | 'pan' | 'walk' | 'zoom'>('orbit');

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            if (e.key.toLowerCase() === 's') dispatch(setActiveTool('select'));
            if (e.key.toLowerCase() === 'm') dispatch(setActiveTool('measure'));
            if (e.key.toLowerCase() === 'c') dispatch(setActiveTool('clip'));
            if (e.key.toLowerCase() === 'e') dispatch(setActiveTool('explode'));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch]);

    const triggerAction = (action: string) => {
        window.dispatchEvent(new CustomEvent('viewer-camera-action', { detail: action }));
        if (action === 'orbit' || action === 'pan' || action === 'walk' || action === 'zoom') {
            setCameraMode(action as 'orbit' | 'pan' | 'walk' | 'zoom');
        }
    };

    return (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-slate-800/80 rounded-2xl p-2 flex gap-2 z-50 select-none">
            <NavigationControls
              cameraMode={cameraMode}
              onTriggerAction={triggerAction}
            />
            
            <div className="w-px h-8 bg-slate-800/60 self-center mx-1" />
            
            <ToolControls />
        </div>
    );
}
