import React from 'react';
import { NavigationControls } from '@/features/viewer/tools/NavigationControls';
import { ToolControls } from '@/features/viewer/tools/ToolControls';
import { useEngineeringToolbar } from '@/features/viewer/hooks/useEngineeringToolbar';

export function EngineeringToolbar() {
    const { cameraMode, triggerAction } = useEngineeringToolbar();

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

