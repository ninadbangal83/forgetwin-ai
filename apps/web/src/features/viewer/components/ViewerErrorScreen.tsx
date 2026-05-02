import React from 'react';

export const ViewerErrorScreen: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 font-mono text-slate-400 select-none p-6 text-center">
      <div className="w-16 h-16 flex items-center justify-center bg-red-950/40 text-red-500 border border-red-800/60 rounded-full font-black text-2xl mb-5 shadow-lg shadow-red-500/10">✕</div>
      <div className="text-white font-black text-xl tracking-wider uppercase mb-2">CAD Extraction Failed</div>
      <div className="text-sm text-slate-400 font-medium max-w-md mb-6 leading-relaxed">We encountered an unexpected math/geometry parsing exception while processing the STEP file. Please check the logs in your server or try another model.</div>
      <a href="/models" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 font-bold text-white text-xs tracking-wide uppercase transition-all duration-300 rounded-xl hover:scale-105 active:scale-95 outline-none select-none">Back to Models</a>
    </div>
  );
};
