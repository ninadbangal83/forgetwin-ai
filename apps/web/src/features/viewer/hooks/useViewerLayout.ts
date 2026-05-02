import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAssemblyTree } from '@/store/viewerSlice';
import { fetchModelMetadata } from '@/features/viewer/services/viewerService';
import { ModelData } from '@/types/viewer';


export function useViewerLayout(modelId: string) {
  const dispatch = useDispatch();
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [showHierarchy, setShowHierarchy] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchMetadata = async () => {
      try {
        console.log(`[ViewerLayout] Fetching metadata for model: ${modelId}`);
        const data = await fetchModelMetadata(modelId);
        console.log(`[ViewerLayout] Loaded metadata payload:`, data);
        setModelData(data);
        if (data.assemblyTree) {
          console.log(`[ViewerLayout] Setting assembly tree:`, data.assemblyTree);
          dispatch(setAssemblyTree(data.assemblyTree));
        }

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error("[ViewerLayout] Failed to fetch model metadata", err);
      }
    };

    fetchMetadata();

    intervalId = setInterval(async () => {
      try {
        const data = await fetchModelMetadata(modelId);
        setModelData(data);
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          if (intervalId) clearInterval(intervalId);
          if (data.assemblyTree) {
            dispatch(setAssemblyTree(data.assemblyTree));
          }
        }
      } catch (err) {
        console.error("[ViewerLayout] Polling failed", err);
      }
    }, 2000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [modelId, dispatch]);

  return {
    modelData,
    showHierarchy,
    setShowHierarchy,
    showMetadata,
    setShowMetadata,
  };
}
