'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RootPage() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('forgetwin_token');
      setIsAuth(!!token);
    }
  }, []);

  return (
    <div className="flex-1 min-h-0 bg-slate-950 text-slate-100 font-sans antialiased relative overflow-hidden flex flex-col justify-center pb-12">
      {/* Background Neon Glowing Accents */}
      <div className="absolute top-[-100px] left-[-120px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none select-none z-0" />
      <div className="absolute top-[200px] right-[-150px] w-[600px] h-[600px] bg-teal-500/5 rounded-full filter blur-[140px] pointer-events-none select-none z-0" />

      {/* Grid Overlay for Industrial Look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0 opacity-40" />

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-20 pb-12 text-center select-none relative z-10">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-indigo-400 text-xs font-bold tracking-wide uppercase mb-8 shadow-inner">
          <span className="flex w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          Cloud Native 3D Rendering Platform
        </span>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none mb-6">
          Visual Artificial <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-300">
            CAD Streaming
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Process, view, and interact with complex manufacturing CAD models and assemblies directly inside the browser with AI-driven LOD streaming and WebGL rendering.
        </p>

        {/* Large Premium CTA Button */}
        {isAuth ? (
          <Link 
            href="/models" 
            className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 hover:from-indigo-500 hover:via-purple-500 hover:to-teal-400 text-white font-extrabold px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-sm select-none"
          >
            <span>Go to 3D Designs</span>
            <span className="text-lg">→</span>
          </Link>
        ) : (
          <div className="flex justify-center items-center gap-4 select-none">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-sm"
            >
              Log In
            </Link>
            <Link 
              href="/register" 
              className="inline-flex items-center gap-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-extrabold px-8 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-sm"
            >
              Register
            </Link>
          </div>
        )}
      </header>

      {/* Main Feature Layout */}
      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 select-none">
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 flex flex-col gap-4 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 select-none h-full">
          <div className="w-12 h-12 shrink-0 bg-indigo-950/60 border border-indigo-800/50 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-xl select-none shadow-lg">
            🔮
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight mb-1 text-base">Predictive LOD Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Seamless progressive rendering with multiple automated Levels of Detail (LOD0-2) optimized dynamically for your active viewport.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 flex flex-col gap-4 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 select-none h-full">
          <div className="w-12 h-12 shrink-0 bg-indigo-950/60 border border-indigo-800/50 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-xl select-none shadow-lg">
            🛰️
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight mb-1 text-base">Out-Of-Core Spatial Streaming</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Processes huge multi-gigabyte models into streaming spatial chunks, preventing browser crashes and memory overloads.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 flex flex-col gap-4 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 select-none h-full">
          <div className="w-12 h-12 shrink-0 bg-indigo-950/60 border border-indigo-800/50 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-xl select-none shadow-lg">
            🛡️
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight mb-1 text-base">Industrial-Grade Security</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Isolated object storage for raw CAD assemblies, combined with WebGL optimizations for maximum in-browser efficiency.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
