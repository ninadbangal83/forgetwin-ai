import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ToolType, Measurement, ViewerToolsState } from '@/types/viewer';

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
    setMeasurements: (state, action: PayloadAction<Measurement[]>) => {
      state.measurements = action.payload || [];
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
  setMeasurements,
  setIsolatedNodes,
  clearIsolation
} = viewerToolsSlice.actions;

export default viewerToolsSlice.reducer;
