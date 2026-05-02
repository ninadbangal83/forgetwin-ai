import React from 'react';
import { FlattenedNode } from '@/types/model';

export interface HierarchyRowProps {
  index: number;
  style: React.CSSProperties;
  data: FlattenedNode[];
  selectedNodeId: string | null;
  onToggleExpand: (id: string, e: React.MouseEvent) => void;
}

export interface MetadataPanelProps {
  globalMetadata: Record<string, unknown> | null;
}

export interface NavigationControlsProps {
  cameraMode: 'orbit' | 'pan' | 'walk' | 'zoom';
  onTriggerAction: (action: string) => void;
}

export interface ToolbarButtonProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  activeClassName?: string;
  className?: string;
}
