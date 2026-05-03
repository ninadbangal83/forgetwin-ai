'use client';
import React from 'react';

interface AIChatMessageProps {
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChatMessage({ sender, content, timestamp }: AIChatMessageProps) {
  const isUser = sender === 'user';

  return (
    <div className={`flex flex-col gap-1 w-full max-w-[88%] select-text leading-relaxed text-xs transition-all duration-300 ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
      {/* Sender Header */}
      <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isUser ? 'text-indigo-400' : 'text-emerald-400'}`}>
        <span>{isUser ? 'Engineer (User)' : 'AI Copilot Assistant'}</span>
        <span className="text-slate-500 font-normal">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Message Bubble */}
      <div className={`p-3 rounded-2xl border transition-all duration-300 ${isUser ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-100 rounded-br-none' : 'bg-slate-900/60 border-slate-800/80 text-slate-200 rounded-bl-none'}`}>
        <p className="whitespace-pre-wrap select-text">{content}</p>
      </div>
    </div>
  );
}
