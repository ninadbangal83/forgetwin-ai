'use client';
interface ModelData {
  id: string;
  name: string;
  status: string;
  fileSize: number;
  createdAt: string;
  thumbnailUrl?: string;
  assemblyTree?: unknown;
  metadata?: Record<string, unknown>;
}
type _any = unknown & { [key: string]: unknown };

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { UploadZone } from '@/features/upload/components/UploadZone';

export default function GalleryPage() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchModels = async () => {
    try {
      const res = await fetch('http://localhost:3001/v1/cad-models', { cache: 'no-store' });
      if (res.ok) {
         const raw = await res.json();
         setModels(Array.isArray(raw) ? raw : (raw.data || []));
      }
    } catch (err) {
      console.error("Failed to connect to API server", err);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const hasProcessing = models.some(m => m.status === 'PROCESSING' || m.status === 'PENDING' || m.status === 'UPLOADED');

    if (hasProcessing) {
      intervalId = setInterval(() => {
        fetchModels();
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [models]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-16 relative overflow-hidden flex-1 flex flex-col">
      {/* Background Neon Glowing Accents */}
      <div className="absolute top-[-100px] left-[-120px] w-[500px] h-[500px] bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none select-none z-0" />
      <div className="absolute top-[200px] right-[-150px] w-[600px] h-[600px] bg-teal-500/10 rounded-full filter blur-[140px] pointer-events-none select-none z-0" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0 opacity-40" />

      <div className="max-w-6xl mx-auto px-6 pt-16 relative z-10 flex-1 flex flex-col w-full">
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-800/80">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
              3D <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-300">Designs</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Click on any 3D model below to open it in the viewer</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-300 select-none uppercase tracking-wide"
          >
            <span>+ Upload Model</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {models.map((model: ModelData) => {
            const isStuck = (model.status === 'PROCESSING' || model.status === 'PENDING' || model.status === 'UPLOADED') &&
              Date.now() - new Date(model.createdAt).getTime() > 5 * 60 * 1000;

            return (
              <Link href={`/models/${model.id}`} key={model.id} className="block group">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 group hover:-translate-y-1 relative h-full select-none">
                  <div className="h-52 bg-slate-950/60 flex items-center justify-center border-b border-slate-800/60 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent)] pointer-events-none" />
                    {model.status === 'COMPLETED' ? (
                      <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url('${model.thumbnailUrl || '/cad_blueprint_mockup.png'}')` }} />
                    ) : (model.status === 'FAILED' || isStuck) ? (
                      <div className="flex flex-col items-center text-red-500">
                        <span className="text-5xl mb-2 drop-shadow-lg select-none">⚠️</span>
                        <span className="text-xs font-black tracking-widest uppercase">{isStuck ? 'Processing Timeout' : 'Processing Failed'}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-500">
                        <div className="w-10 h-10 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                        <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">Processing Asset</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-indigo-400 transition-colors truncate" title={model.name}>
                      {model.name}
                    </h3>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-xs text-slate-400 font-mono font-bold">
                        {model.fileSize ? (model.fileSize < 1048576 ? (model.fileSize / 1024).toFixed(2) + ' KB' : (model.fileSize / 1048576).toFixed(2) + ' MB') : '0 KB'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-wide uppercase border ${
                        model.status === 'COMPLETED' ? 'bg-teal-950/40 border-teal-800/40 text-teal-300' : 
                        (model.status === 'FAILED' || isStuck) ? 'bg-red-950/40 border-red-800/40 text-red-400' : 'bg-indigo-950/40 border-indigo-800/40 text-indigo-400 animate-pulse'
                      }`}>
                        {isStuck ? 'TIMED OUT' : model.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {models.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-500 bg-slate-900/20 backdrop-blur-md rounded-2xl border-2 border-dashed border-slate-800/60 select-none">
              <span className="text-5xl mb-4 select-none">📂</span>
              <p className="text-lg font-bold text-white mb-1 tracking-tight">No 3D assets found in the datastore.</p>
              <p className="text-sm text-slate-400">Click '+ Upload Model' to add a STEP file.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Model Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] select-none animate-fadeIn">
          <div className="bg-slate-900/90 border border-slate-800/80 p-6 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col gap-5 relative overflow-hidden select-none">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span className="text-indigo-400">✨</span> Upload Spatial Model
                </h3>
                <p className="text-xs text-slate-400">Add engineering assembly to the cloud engine</p>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  fetchModels();
                }} 
                className="text-slate-500 hover:text-slate-300 transition-colors bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/60 p-2.5 rounded-xl text-xs font-bold px-3"
              >
                Close
              </button>
            </div>

            <div className="flex-1 py-2">
              <UploadZone onSuccess={() => {
                // Instantly refresh model list when upload finishes successfully
                fetchModels();
              }} />
            </div>

            <p className="text-[10px] text-slate-500 mt-2 text-center leading-relaxed font-medium">
              Accepts <code className="text-indigo-300 font-bold bg-indigo-950/40 px-1 py-0.5 rounded border border-indigo-800/30">.step</code> and <code className="text-indigo-300 font-bold bg-indigo-950/40 px-1 py-0.5 rounded border border-indigo-800/30">.stp</code> file formats only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
