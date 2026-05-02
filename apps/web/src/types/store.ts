export interface ViewerState {
  assemblyTree: unknown | null;
  selectedNodeId: string | null;
  hiddenNodeIds: string[];
}

export type ToolType = 'select' | 'measure' | 'clip' | 'explode';

export interface Measurement {
  id: string;
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  distance: number;
}

export interface ViewerToolsState {
  activeTool: ToolType;
  explodeFactor: number;
  clipping: {
    enabled: boolean;
    planes: { x: number; y: number; z: number };
    invert: boolean;
  };
  measurements: Measurement[];
  isolatedNodeIds: string[];
}
