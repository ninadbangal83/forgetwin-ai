'use client';
import React, { useState, useEffect, useRef } from 'react';
import { AIChatTurn } from './AIContextStore';
import { AIChatMessage } from './AIChatMessage';
import { ToolExecutionRenderer } from './ToolExecutionRenderer';
import { apiClient } from '@/lib/apiClient';

interface EngineeringCopilotPanelProps {
  modelId: string;
}

export function EngineeringCopilotPanel({ modelId }: EngineeringCopilotPanelProps) {
  const [messages, setMessages] = useState<AIChatTurn[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: "Hello! I am your Engineering Copilot assistant. I'm grounded in this specific CAD assembly, model metadata, review comments, and engineering documents. Ask me to search components, isolate assemblies, summarize notes, or analyze CAD properties.",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [summarizing, setSummarizing] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userTurn: AIChatTurn = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userTurn]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await apiClient.post<{ data: { message: string; toolCalls: any[] } }>('/ai/chat', {
        modelId,
        message: userTurn.content,
        history: messages.map((m) => ({ role: m.sender, content: m.content })),
      });

      const assistantTurn: AIChatTurn = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: res.data.data.message,
        timestamp: new Date(),
        toolCalls: res.data.data.toolCalls,
      };

      setMessages((prev) => [...prev, assistantTurn]);

      // Automatically execute any visual tool actions in the CAD viewer!
      if (res.data.data.toolCalls && res.data.data.toolCalls.length > 0) {
        res.data.data.toolCalls.forEach((toolCall) => {
          if (toolCall.tool === 'isolate_components' && toolCall.args?.nodeIds) {
            window.dispatchEvent(
              new CustomEvent('viewer-isolate-nodes', { detail: { nodeIds: toolCall.args.nodeIds } })
            );
          }
          if (toolCall.tool === 'hide_components' && toolCall.args?.nodeIds) {
            window.dispatchEvent(
              new CustomEvent('viewer-hide-nodes', { detail: { nodeIds: toolCall.args.nodeIds } })
            );
          }
        });
      }
    } catch (err) {
      console.error('AI Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          content: 'I encountered an issue processing your query or fetching context from the server.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (summarizing) return;
    try {
      setSummarizing(true);
      const res = await apiClient.get<{ summary: string }>(`/ai/summarize/${modelId}`);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          content: res.data.summary,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error('Failed to generate revision summary', err);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden font-sans select-none pointer-events-auto select-none">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>

      {/* Header */}
      <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 flex justify-between items-center select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
          <h2 className="font-extrabold text-indigo-400 tracking-wider uppercase text-xs">AI Engineering Copilot</h2>
        </div>
        <button
          onClick={handleGenerateSummary}
          disabled={summarizing}
          className="bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/50 hover:border-indigo-500 text-indigo-300 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl uppercase tracking-widest transition-all disabled:opacity-50 select-none"
        >
          {summarizing ? 'Generating Report...' : 'Get Revision Report'}
        </button>
      </div>

      {/* Messages Scroll Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar select-none">
        {messages.map((m) => (
          <React.Fragment key={m.id}>
            <AIChatMessage sender={m.sender} content={m.content} timestamp={m.timestamp} />
            {m.toolCalls?.map((t, idx) => (
              <ToolExecutionRenderer key={idx} tool={t.tool} args={t.args} result={t.result} />
            ))}
          </React.Fragment>
        ))}
        {loading && (
          <div className="self-start flex flex-col gap-1.5 w-[80%]">
            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-400">
              <span className="animate-pulse">Copilot Assistant is typing...</span>
            </div>
            <div className="p-3 bg-slate-900/40 border border-slate-800/60 text-slate-400 text-xs rounded-2xl rounded-bl-none flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" />
              Processing CAD RAG context and checking active tool rules...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Inputs Form footer */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800/60 bg-slate-950/40 shrink-0 select-none">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type engineering question or visual commands..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors select-none font-sans"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold px-4 py-2 rounded-xl border border-indigo-500 transition-all duration-300 uppercase tracking-widest text-[10px] select-none hover:scale-[1.02] active:scale-[0.98]"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
