import { configureStore } from '@reduxjs/toolkit';
import viewerReducer from '@/store/viewerSlice';
import viewerToolsReducer from '@/store/viewerToolsSlice';

export const store = configureStore({
  reducer: {
    viewer: viewerReducer,
    viewerTools: viewerToolsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
