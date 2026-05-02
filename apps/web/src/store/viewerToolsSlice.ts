import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToolType = 'select' | 'measure' | 'clip' | 'explode';

interface Measurement {
  id: string;
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  distance: number;
}

interface ViewerToolsState {
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

const initialState: ViewerToolsState = {
  activeTool: 'select',
  explodeFactor: 0,
  clipping: {
    enabled: false,
    planes: { x: 0, y: 0, z: 0 },
    invert: false,
  },
  measurements: [],
  isolatedNodeIds: [],
};

export const viewerToolsSlice = createSlice({
  name: 'viewerTools',
  initialState,
  reducers: {
    setActiveTool: (state, action: PayloadAction<ToolType>) => {
      state.activeTool = action.payload;
    },
    setExplodeFactor: (state, action: PayloadAction<number>) => {
      state.explodeFactor = action.payload;
    },
    toggleClipping: (state) => {
      state.clipping.enabled = !state.clipping.enabled;
    },
    setClippingPlanes: (state, action: PayloadAction<{ x: number; y: number; z: number }>) => {
      state.clipping.planes = action.payload;
    },
    toggleClippingInvert: (state) => {
      state.clipping.invert = !state.clipping.invert;
    },
    addMeasurement: (state, action: PayloadAction<Measurement>) => {
      state.measurements.push(action.payload);
    },
    clearMeasurements: (state) => {
      state.measurements = [];
    },
    setIsolatedNodes: (state, action: PayloadAction<string[]>) => {
      state.isolatedNodeIds = action.payload;
    },
    clearIsolation: (state) => {
      state.isolatedNodeIds = [];
    }
  },
});

export const {
  setActiveTool,
  setExplodeFactor,
  toggleClipping,
  setClippingPlanes,
  toggleClippingInvert,
  addMeasurement,
  clearMeasurements,
  setIsolatedNodes,
  clearIsolation
} = viewerToolsSlice.actions;

export default viewerToolsSlice.reducer;
