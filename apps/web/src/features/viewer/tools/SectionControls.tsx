import React from 'react';
import { useClippingState } from '@/features/viewer/hooks/useClippingState';

export function SectionControls() {
    const {
        enabled,
        planes,
        invert,
        handleToggleEnabled,
        handlePlanesChange,
        handleToggleInvert,
    } = useClippingState();

    return (
        <div className="absolute bottom-24 left-4 bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-slate-800/80 rounded-2xl p-5 w-72 z-50 text-sm select-none">
            <h3 className="font-extrabold text-indigo-400 mb-4 border-b border-slate-800/60 pb-2 uppercase tracking-wide text-xs">Section Analysis</h3>
            
            <label className="flex items-center gap-3 mb-5 cursor-pointer hover:bg-slate-800/40 p-2 rounded-xl -mx-2 transition-colors">
                <input type="checkbox" checked={enabled} onChange={handleToggleEnabled} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
                <span className="font-bold text-slate-200">Enable Local Clipping</span>
            </label>

            <div className={`space-y-4 transition-all duration-300 ${!enabled ? 'opacity-40 pointer-events-none filter grayscale' : ''}`}>
                <div>
                    <div className="flex justify-between mb-1 text-[10px]"><span className="text-red-400 font-bold uppercase tracking-widest">X Axis</span><span className="font-mono text-slate-400">{planes.x.toFixed(1)}</span></div>
                    <input type="range" min="-100" max="100" step="0.5" value={planes.x} onChange={(e) => handlePlanesChange('x', e.target.value)} className="w-full accent-red-500 bg-slate-800" />
                </div>
                <div>
                    <div className="flex justify-between mb-1 text-[10px]"><span className="text-teal-400 font-bold uppercase tracking-widest">Y Axis</span><span className="font-mono text-slate-400">{planes.y.toFixed(1)}</span></div>
                    <input type="range" min="-100" max="100" step="0.5" value={planes.y} onChange={(e) => handlePlanesChange('y', e.target.value)} className="w-full accent-teal-400 bg-slate-800" />
                </div>
                <div>
                    <div className="flex justify-between mb-1 text-[10px]"><span className="text-indigo-400 font-bold uppercase tracking-widest">Z Axis</span><span className="font-mono text-slate-400">{planes.z.toFixed(1)}</span></div>
                    <input type="range" min="-100" max="100" step="0.5" value={planes.z} onChange={(e) => handlePlanesChange('z', e.target.value)} className="w-full accent-indigo-500 bg-slate-800" />
                </div>

                <label className="flex items-center gap-3 mt-5 cursor-pointer pt-3 border-t border-slate-800/60 hover:bg-slate-800/40 p-2 rounded-xl -mx-2 transition-colors">
                    <input type="checkbox" checked={invert} onChange={handleToggleInvert} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
                    <span className="font-bold text-slate-200">Invert Half-Space</span>
                </label>
            </div>
        </div>
    );
}

