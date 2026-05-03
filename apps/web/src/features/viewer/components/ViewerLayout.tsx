'use client';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

import { ViewerShell } from '@/features/viewer/components/ViewerShell';
import { HierarchyPanel } from '@/features/viewer/components/HierarchyPanel';
import { MetadataPanel } from '@/features/viewer/components/MetadataPanel';
import { ViewerLoadingScreen } from '@/features/viewer/components/ViewerLoadingScreen';
import { ViewerProcessingScreen } from '@/features/viewer/components/ViewerProcessingScreen';
import { ViewerErrorScreen } from '@/features/viewer/components/ViewerErrorScreen';

import { EngineeringToolbar } from '@/features/viewer/tools/EngineeringToolbar';
import { SectionControls } from '@/features/viewer/tools/SectionControls';
import { MeasurementPanel } from '@/features/viewer/tools/MeasurementPanel';
import { ExplodeSlider } from '@/features/viewer/tools/ExplodeSlider';

import { useViewerLayout } from '@/features/viewer/hooks/useViewerLayout';
import { EngineeringReviewManager } from '@/features/viewer/components/EngineeringReviewManager';
import { EngineeringCopilotPanel } from '@/features/ai/EngineeringCopilotPanel';

interface ViewerLayoutProps {
  modelId: string;
}

export function ViewerLayout({ modelId }: ViewerLayoutProps) {
  const {
    modelData,
    showHierarchy,
    setShowHierarchy,
    showMetadata,
    setShowMetadata,
  } = useViewerLayout(modelId);

  const [showReviews, setShowReviews] = React.useState(false);
  const [showAI, setShowAI] = React.useState(false);
  const activeTool = useSelector((state: RootState) => state.viewerTools.activeTool);

  if (!modelData) {
    return <ViewerLoadingScreen />;
  }

  if (modelData.status === 'PROCESSING' || modelData.status === 'PENDING') {
    return <ViewerProcessingScreen />;
  }

  if (modelData.status === 'FAILED') {
    return <ViewerErrorScreen />;
  }

  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden select-none">
      <ViewerShell modelId={modelId} downloadUrl={modelData.downloadUrl || ''} />

      <div className="absolute top-4 left-24 z-50 flex gap-2">
        <div className="relative group select-none">
          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-black text-white text-xs font-extrabold px-3.5 py-2 rounded-xl border border-slate-800 shadow-2xl transition-all duration-200 pointer-events-none select-none whitespace-nowrap z-50">
            Assembly Hierarchy
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-black" />
          </div>
          <button
            onClick={() => setShowHierarchy(!showHierarchy)}
            className={`p-3 text-sm font-black rounded-xl border flex items-center justify-center backdrop-blur-md transition-all duration-300 outline-none hover:scale-105 active:scale-95 select-none ${showHierarchy ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/20' : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-indigo-500/40 hover:text-white'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <path d="M6.5 10v4h7.5" />
            </svg>
          </button>
        </div>

        <div className="relative group select-none">
          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-black text-white text-xs font-extrabold px-3.5 py-2 rounded-xl border border-slate-800 shadow-2xl transition-all duration-200 pointer-events-none select-none whitespace-nowrap z-50">
            Version Reviews
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-black" />
          </div>
          <button
            onClick={() => setShowReviews(!showReviews)}
            className={`p-3 text-sm font-black rounded-xl border flex items-center justify-center backdrop-blur-md transition-all duration-300 outline-none hover:scale-105 active:scale-95 select-none ${showReviews ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/20' : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-indigo-500/40 hover:text-white'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </button>
        </div>

        <div className="relative group select-none">
          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-black text-white text-xs font-extrabold px-3.5 py-2 rounded-xl border border-slate-800 shadow-2xl transition-all duration-200 pointer-events-none select-none whitespace-nowrap z-50">
            Engineering Copilot
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-black" />
          </div>
          <button
            onClick={() => setShowAI(!showAI)}
            className={`p-3 text-sm font-black rounded-xl border flex items-center justify-center backdrop-blur-md transition-all duration-300 outline-none hover:scale-105 active:scale-95 select-none ${showAI ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20' : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-emerald-500/40 hover:text-white'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <div className="relative group select-none">
          <div className="absolute top-full mt-3 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-black text-white text-xs font-extrabold px-3.5 py-2 rounded-xl border border-slate-800 shadow-2xl transition-all duration-200 pointer-events-none select-none whitespace-nowrap z-50">
            Engineering Properties
            <div className="absolute bottom-full right-4 border-[6px] border-transparent border-b-black" />
          </div>
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className={`p-3 text-sm font-black rounded-xl border flex items-center justify-center backdrop-blur-md transition-all duration-300 outline-none hover:scale-105 active:scale-95 select-none ${showMetadata ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/20' : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-indigo-500/40 hover:text-white'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </button>
        </div>
      </div>

      <EngineeringToolbar />

      {activeTool === 'clip' && <SectionControls />}
      {activeTool === 'measure' && <MeasurementPanel />}
      {activeTool === 'explode' && <ExplodeSlider />}

      {showHierarchy && (
        <div className="absolute top-16 left-4 z-[60] w-[320px] bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 h-[calc(100%-6rem)] max-h-[820px] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
          <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 flex justify-between items-center select-none">
            <h2 className="font-extrabold text-indigo-400 tracking-wider uppercase text-xs">Assembly Structure</h2>
            <button onClick={() => setShowHierarchy(false)} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <HierarchyPanel />
          </div>
        </div>
      )}

      {showReviews && (
        <div className="absolute top-16 left-[340px] z-[60] w-[360px] bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 h-[calc(100%-6rem)] max-h-[820px] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
          <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 flex justify-between items-center select-none">
            <h2 className="font-extrabold text-indigo-400 tracking-wider uppercase text-xs">Collaborative Reviews</h2>
            <button onClick={() => setShowReviews(false)} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <EngineeringReviewManager
              modelId={modelId}
              onRestoreSnapshot={(snap) => window.dispatchEvent(new CustomEvent('viewer-restore-snapshot', { detail: snap }))}
              onHighlightDiff={(diff) => window.dispatchEvent(new CustomEvent('viewer-highlight-diff', { detail: diff }))}
              onAddAnnotationMarker={(id, position, note) => window.dispatchEvent(new CustomEvent('viewer-add-annotation', { detail: { id, position, note } }))}
              onClearAnnotationMarkers={() => window.dispatchEvent(new CustomEvent('viewer-clear-annotations'))}
            />
          </div>
        </div>
      )}

      {showAI && (
        <div className="absolute top-16 left-[710px] z-[60] w-[380px] bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 h-[calc(100%-6rem)] max-h-[820px] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
          <div className="flex-1 overflow-y-auto">
            <EngineeringCopilotPanel modelId={modelId} />
          </div>
        </div>
      )}

      {showMetadata && (
        <div className="absolute top-16 right-4 z-[60] w-[320px] bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 h-[calc(100%-6rem)] max-h-[820px] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
          <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 flex justify-between items-center select-none">
            <h2 className="font-extrabold text-indigo-400 tracking-wider uppercase text-xs">Engineering Properties</h2>
            <button onClick={() => setShowMetadata(false)} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <MetadataPanel globalMetadata={modelData.metadata || null} />
          </div>
        </div>
      )}
    </div>
  );
}

