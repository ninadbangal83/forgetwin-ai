import React from 'react';

export const ViewerLoadingScreen: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 font-mono text-slate-400 select-none">
      <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
      <div className="text-white font-black text-sm tracking-wider uppercase mb-2 animate-pulse">Initializing Subsystems</div>
      <div className="text-xs text-slate-500 font-medium">Downloading engineering payload...</div>
    </div>
  );
};
