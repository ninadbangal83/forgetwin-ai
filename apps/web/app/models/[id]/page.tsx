import React from 'react';
import { ViewerLayout } from '@/features/viewer/components/ViewerLayout';
import { StoreProvider } from '@/store/StoreProvider';

export default async function ModelViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  return (
    <StoreProvider>
      <div className="flex-1 min-h-0 flex flex-col bg-slate-950 relative h-full overflow-hidden">
        {/* Main 3D Canvas Visualizer - stretches perfectly to 100% height below main universal header */}
        <div className="flex-1 min-h-0 bg-slate-900/20 backdrop-blur-md relative z-10 overflow-hidden flex flex-col">
          <ViewerLayout modelId={id} />
        </div>
      </div>
    </StoreProvider>
  );
}
