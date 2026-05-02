import React from 'react';
import { useDispatch } from 'react-redux';
import { setActiveTool } from '@/store/viewerToolsSlice';

export function useEngineeringToolbar() {
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

    return {
        cameraMode,
        triggerAction,
    };
}
