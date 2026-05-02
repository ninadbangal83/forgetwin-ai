import React from 'react';

export const ViewerProcessingScreen: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 font-mono text-slate-400 select-none">
      <div className="w-16 h-16 border-4 border-slate-800 border-t-indigo-400 rounded-full animate-spin mb-6"></div>
      <div className="text-white font-black text-lg tracking-wider uppercase mb-2">CAD Model Processing</div>
      <div className="text-sm text-slate-500 font-medium max-w-sm text-center">We are currently meshing and chunking the 3D model. This page will automatically update as soon as the processing completes.</div>
    </div>
  );
};
