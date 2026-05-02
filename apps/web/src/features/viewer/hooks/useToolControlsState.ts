import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setActiveTool, setIsolatedNodes } from '@/store/viewerToolsSlice';

export function useToolControlsState() {
  const dispatch = useDispatch();
  const activeTool = useSelector((state: RootState) => state.viewerTools.activeTool);
  const selectedNodeId = useSelector((state: RootState) => state.viewer.selectedNodeId);
  const isolatedNodes = useSelector((state: RootState) => state.viewerTools.isolatedNodeIds);

  const handleIsolate = () => {
    if (isolatedNodes.length > 0) {
      dispatch(setIsolatedNodes([]));
    } else if (selectedNodeId) {
      dispatch(setIsolatedNodes([selectedNodeId]));
    }
  };

  const handleSetActiveTool = (toolId: string) => {
    dispatch(setActiveTool(toolId as 'select' | 'measure' | 'clip' | 'explode'));
  };

  return {
    activeTool,
    selectedNodeId,
    isolatedNodes,
    handleIsolate,
    handleSetActiveTool,
  };
}
