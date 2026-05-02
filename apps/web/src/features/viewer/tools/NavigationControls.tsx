import React from 'react';
import { ToolbarButton } from './ToolbarButton';
import { navControls } from './toolbarConstants';

interface NavigationControlsProps {
  cameraMode: 'orbit' | 'pan' | 'walk' | 'zoom';
  onTriggerAction: (action: string) => void;
}

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
