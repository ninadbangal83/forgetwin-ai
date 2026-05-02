import React from 'react';
import { ToolbarButton } from '@/features/viewer/tools/ToolbarButton';
import { navControls } from '@/features/viewer/tools/toolbarConstants';
import { NavigationControlsProps } from '@/types/viewer';

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  cameraMode,
  onTriggerAction
}) => {
  return (
    <>
      {navControls.map(t => (
        <ToolbarButton
          id={t.id}
          key={t.id}
          label={t.label}
          icon={t.icon}
          isActive={(t.id === 'orbit' || t.id === 'pan' || t.id === 'walk' || t.id === 'zoom') && cameraMode === t.id}
          onClick={() => onTriggerAction(t.id)}
        />
      ))}
    </>
  );
};
