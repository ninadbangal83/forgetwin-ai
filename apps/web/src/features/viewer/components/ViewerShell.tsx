'use client';
import React from 'react';
import { StreamingDiagnostics } from '@/features/viewer/streaming/StreamingDiagnostics';
import { useViewerShell } from '@/features/viewer/hooks/useViewerShell';

interface ViewerShellProps {
  modelId: string;
  downloadUrl: string;
}

export function ViewerShell({ modelId, downloadUrl }: ViewerShellProps) {
  const { containerRef, loading, metrics } = useViewerShell(modelId, downloadUrl);

  return (
    <div className="absolute inset-0 outline-none bg-slate-950 rounded shadow-inner">
      {metrics && <StreamingDiagnostics metrics={metrics} />}

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <span className="text-white font-black tracking-wide">Initializing Streaming Subsystem...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full outline-none" />
    </div>
  );
}

