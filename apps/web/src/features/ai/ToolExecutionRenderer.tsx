'use client';
import React from 'react';

interface ToolExecutionRendererProps {
  tool: string;
  args: any;
  result: string;
}

export function ToolExecutionRenderer({ tool, args, result }: ToolExecutionRendererProps) {
  return (
    <div className="w-full bg-slate-950/60 p-3 rounded-xl border border-emerald-500/20 flex flex-col gap-1.5 transition-all duration-300 backdrop-blur-md select-text">
      {/* Tool Header */}
      <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-widest text-emerald-400 select-none">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tool Executed: {tool}
        </span>
        <span className="bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 px-1.5 py-0.5 rounded">Success</span>
      </div>

      {/* Inputs / Args */}
      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 font-mono text-[10px] text-slate-300 select-text overflow-x-auto custom-scrollbar">
        <span className="text-slate-500">Args: </span>
        {JSON.stringify(args)}
      </div>

      {/* Tool Output Result */}
      <div className="text-[10px] text-emerald-200/90 font-medium">
        {result}
      </div>
    </div>
  );
}
