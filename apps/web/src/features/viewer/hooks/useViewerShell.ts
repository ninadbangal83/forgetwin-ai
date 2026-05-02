import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThreeEngine } from '@/engine/ThreeEngine';
import { RootState } from '@/store/store';
import { setSelectedNodeId } from '@/store/viewerSlice';
import { addMeasurement } from '@/store/viewerToolsSlice';
import { StreamingMetrics } from '@/types/viewer';

export function useViewerShell(modelId: string, downloadUrl: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<StreamingMetrics | null>(null);

  const dispatch = useDispatch();

  const selectedNodeId = useSelector((state: RootState) => state.viewer.selectedNodeId);
  const hiddenNodeIds = useSelector((state: RootState) => state.viewer.hiddenNodeIds);

  const activeTool = useSelector((state: RootState) => state.viewerTools.activeTool);
  const explodeFactor = useSelector((state: RootState) => state.viewerTools.explodeFactor);
  const clipping = useSelector((state: RootState) => state.viewerTools.clipping);
  const isolatedNodes = useSelector((state: RootState) => state.viewerTools.isolatedNodeIds);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new ThreeEngine(containerRef.current);
    engineRef.current = engine;

    // Trigger explicit window resize to correctly calculate size of 3D canvas
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);

    engine.onNodeSelected = (nodeId) => {
      dispatch(setSelectedNodeId(nodeId));
    };

    engine.onMeasurementComplete = (distance, p1, p2) => {
      dispatch(addMeasurement({
        id: Math.random().toString(36).substr(2, 9),
        startPoint: p1 as [number, number, number],
        endPoint: p2 as [number, number, number],
        distance
      }));
    };

    // Hook into the Streaming Engine Metrics
    engine.modelLoader.onStreamingMetrics = (data) => {
      setMetrics(data as unknown as StreamingMetrics);
    };

    const loadModel = async () => {
      try {
        console.log(`[ViewerShell] Starting to load model with downloadUrl: ${downloadUrl}`);
        setLoading(true);
        if (downloadUrl) {
          // Uses loadFromManifest instead of loadFromUrl internally for streaming
          await engine.modelLoader.loadFromManifest(downloadUrl);
          console.log(`[ViewerShell] Finished loadFromManifest successfully!`);
        }
        setLoading(false);
      } catch (err: unknown) {
        console.error(`[ViewerShell] Failed to load model manifest`, err);
        setLoading(false);
      }
    };
    loadModel();

    return () => {
      clearTimeout(timer);
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [modelId, downloadUrl, dispatch]);

  useEffect(() => {
    const handleCameraAction = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (!engineRef.current) return;
      if (action === 'home') engineRef.current.home();
      else if (action === 'orbit') engineRef.current.setOrbitMode();
      else if (action === 'pan') engineRef.current.setPanMode();
      else if (action === 'walk') engineRef.current.setWalkMode();
      else if (action === 'zoom') engineRef.current.setZoomMode();
      else if (action === 'fittoview') engineRef.current.fitToView();
    };
    window.addEventListener('viewer-camera-action', handleCameraAction);
    return () => window.removeEventListener('viewer-camera-action', handleCameraAction);
  }, []);

  useEffect(() => {
    if (engineRef.current) engineRef.current.selectNode(selectedNodeId);
  }, [selectedNodeId]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.setHiddenNodes(hiddenNodeIds);
  }, [hiddenNodeIds]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.setActiveTool(activeTool);
  }, [activeTool]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.clipping.setEnabled(clipping.enabled);
  }, [clipping.enabled]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.clipping.setPlanes(clipping.planes.x, clipping.planes.y, clipping.planes.z);
  }, [clipping.planes]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.clipping.setInvert(clipping.invert);
  }, [clipping.invert]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.explode.setExplodeFactor(explodeFactor, engineRef.current.modelLoader.currentModel);
    }
  }, [explodeFactor]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.setIsolatedNodes(isolatedNodes);
  }, [isolatedNodes]);

  return {
    containerRef,
    loading,
    metrics,
  };
}
