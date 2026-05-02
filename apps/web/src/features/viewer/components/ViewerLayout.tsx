'use client';
import React, { useEffect, useState } from 'react';
import { ViewerShell } from './ViewerShell';
import { HierarchyPanel } from './HierarchyPanel';
import { MetadataPanel } from './MetadataPanel';
import { useDispatch, useSelector } from 'react-redux';
import { setAssemblyTree } from '@/store/viewerSlice';
import { RootState } from '@/store/store';

import { EngineeringToolbar } from '../tools/EngineeringToolbar';
import { SectionControls } from '../tools/SectionControls';
import { MeasurementPanel } from '../tools/MeasurementPanel';
import { ExplodeSlider } from '../tools/ExplodeSlider';

interface ViewerLayoutProps {
  modelId: string;
}

export function ViewerLayout({ modelId }: ViewerLayoutProps) {
  const dispatch = useDispatch();
  const [modelData, setModelData] = useState<any>(null);
  const [showHierarchy, setShowHierarchy] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  
  const activeTool = useSelector((state: RootState) => state.viewerTools.activeTool);

  useEffect(() => {
    let intervalId: any;

    const fetchMetadata = async () => {
      try {
        console.log(`[ViewerLayout] Fetching metadata for model: ${modelId}`);
        const res = await fetch(`http://localhost:3001/v1/cad-models/${modelId}`, { cache: 'no-store' });
        const raw = await res.json();
        const data = raw.data || raw;
        console.log(`[ViewerLayout] Loaded metadata payload:`, data);
        setModelData(data);
        if (data.assemblyTree) {
          console.log(`[ViewerLayout] Setting assembly tree:`, data.assemblyTree);
          dispatch(setAssemblyTree(data.assemblyTree));
        }

        // If it's completed or failed, we can stop polling
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error("[ViewerLayout] Failed to fetch model metadata", err);
      }
    };

    fetchMetadata();

    // Start a 2 second polling timer while model is in transient state
    intervalId = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/v1/cad-models/${modelId}`, { cache: 'no-store' });
        const raw = await res.json();
        const data = raw.data || raw;
        setModelData(data);
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          clearInterval(intervalId);
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

  if (!modelData) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 font-mono text-slate-400 select-none">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <div className="text-white font-black text-sm tracking-wider uppercase mb-2 animate-pulse">Initializing Subsystems</div>
        <div className="text-xs text-slate-500 font-medium">Downloading engineering payload...</div>
      </div>
    );
  }

  if (modelData.status === 'PROCESSING' || modelData.status === 'PENDING') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 font-mono text-slate-400 select-none">
        <div className="w-16 h-16 border-4 border-slate-800 border-t-indigo-400 rounded-full animate-spin mb-6"></div>
        <div className="text-white font-black text-lg tracking-wider uppercase mb-2">CAD Model Processing</div>
        <div className="text-sm text-slate-500 font-medium max-w-sm text-center">We are currently meshing and chunking the 3D model. This page will automatically update as soon as the processing completes.</div>
      </div>
    );
  }

  if (modelData.status === 'FAILED') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 font-mono text-slate-400 select-none p-6 text-center">
        <div className="w-16 h-16 flex items-center justify-center bg-red-950/40 text-red-500 border border-red-800/60 rounded-full font-black text-2xl mb-5 shadow-lg shadow-red-500/10">✕</div>
        <div className="text-white font-black text-xl tracking-wider uppercase mb-2">CAD Extraction Failed</div>
        <div className="text-sm text-slate-400 font-medium max-w-md mb-6 leading-relaxed">We encountered an unexpected math/geometry parsing exception while processing the STEP file. Please check the logs in your server or try another model.</div>
        <a href="/models" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 font-bold text-white text-xs tracking-wide uppercase transition-all duration-300 rounded-xl hover:scale-105 active:scale-95 outline-none select-none">Back to Models</a>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden select-none">
      {/* 100% Width Canvas Center Panel as the base layer */}
      <ViewerShell modelId={modelId} downloadUrl={modelData.downloadUrl} />

      {/* Floating Controls rendered on top */}
      <div className="absolute top-4 left-24 z-50 flex gap-2">
        <div className="relative group select-none">
          {/* Tooltip below button */}
          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-black text-white text-xs font-extrabold px-3.5 py-2 rounded-xl border border-slate-800 shadow-2xl transition-all duration-200 pointer-events-none select-none whitespace-nowrap z-50">
            Assembly Hierarchy
            {/* Tooltip arrow */}
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
      </div>

      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <div className="relative group select-none">
          {/* Tooltip below button */}
          <div className="absolute top-full mt-3 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-black text-white text-xs font-extrabold px-3.5 py-2 rounded-xl border border-slate-800 shadow-2xl transition-all duration-200 pointer-events-none select-none whitespace-nowrap z-50">
            Engineering Properties
            {/* Tooltip arrow */}
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

      {/* Floating Left Panel: Assembly Structure */}
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

      {/* Floating Right Panel: Engineering Properties */}
      {showMetadata && (
        <div className="absolute top-16 right-4 z-[60] w-[320px] bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 h-[calc(100%-6rem)] max-h-[820px] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
          <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 flex justify-between items-center select-none">
            <h2 className="font-extrabold text-indigo-400 tracking-wider uppercase text-xs">Engineering Properties</h2>
            <button onClick={() => setShowMetadata(false)} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <MetadataPanel globalMetadata={modelData.metadata} />
          </div>
        </div>
      )}
    </div>
  );
}
