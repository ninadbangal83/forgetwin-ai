import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ViewerState {
  assemblyTree: any | null;
  selectedNodeId: string | null;
  hiddenNodeIds: string[];
}

const initialState: ViewerState = {
  assemblyTree: null,
  selectedNodeId: null,
  hiddenNodeIds: [],
};

export const viewerSlice = createSlice({
  name: 'viewer',
  initialState,
  reducers: {
    setAssemblyTree: (state, action: PayloadAction<any>) => {
      state.assemblyTree = action.payload;
    },
    setSelectedNodeId: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
    },
    toggleNodeVisibility: (state, action: PayloadAction<string>) => {
      const index = state.hiddenNodeIds.indexOf(action.payload);
      if (index >= 0) {
        state.hiddenNodeIds.splice(index, 1);
      } else {
        state.hiddenNodeIds.push(action.payload);
      }
    },
  },
});

export const { setAssemblyTree, setSelectedNodeId, toggleNodeVisibility } = viewerSlice.actions;
export default viewerSlice.reducer;
