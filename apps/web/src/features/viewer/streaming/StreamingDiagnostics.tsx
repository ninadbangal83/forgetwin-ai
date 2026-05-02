import React from 'react';
import { StreamingMetrics } from '@/types/viewer';

export function StreamingDiagnostics({ metrics }: { metrics: StreamingMetrics }) {
    if (!metrics) return null;

    return (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur text-green-400 font-mono text-[10px] p-3 rounded-lg border border-green-900/50 z-50 pointer-events-none w-56 shadow-2xl">
            <div className="flex justify-between border-b border-green-800 pb-1 mb-2">
                <span className="font-bold text-white tracking-widest uppercase">Streaming Engine</span>
                <span className="animate-pulse text-red-500">LIVE</span>
            </div>
            
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="text-gray-400">Memory Budget:</span>
                    <span className="font-bold text-yellow-400">{metrics.loaded} / 50 Chunks</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Frustum Culling:</span>
                    <span className="font-bold">{metrics.visible} Visible</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Network Queue:</span>
                    <span className="font-bold text-cyan-400">{metrics.loading} Fetching</span>
                </div>
                
                <div className="pt-2 mt-2 border-t border-green-800">
                    <span className="text-gray-400 mb-1 block">LOD Resolution Split:</span>
                    <div className="flex gap-1 h-3 w-full bg-gray-800 rounded overflow-hidden">
                        <div style={{width: `${(metrics.lod0 / metrics.loaded) * 100}%`}} className="bg-red-500 h-full transition-all"></div>
                        <div style={{width: `${(metrics.lod1 / metrics.loaded) * 100}%`}} className="bg-yellow-500 h-full transition-all"></div>
                        <div style={{width: `${(metrics.lod2 / metrics.loaded) * 100}%`}} className="bg-green-500 h-full transition-all"></div>
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-500 mt-1">
                        <span>LOD0 (High)</span>
                        <span>LOD1 (Med)</span>
                        <span>LOD2 (Low)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
