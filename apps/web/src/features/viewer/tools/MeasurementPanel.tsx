import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { clearMeasurements } from '@/store/viewerToolsSlice';

export function MeasurementPanel() {
    const dispatch = useDispatch();
    const measurements = useSelector((state: any) => state.viewerTools.measurements);

    return (
        <div className="absolute bottom-24 left-4 bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-slate-800/80 rounded-2xl p-5 w-72 z-50 text-sm select-none">
            <div className="flex justify-between items-center mb-3 border-b border-slate-800/60 pb-2">
                <h3 className="font-extrabold text-indigo-400 uppercase tracking-wide text-xs">Distance Log</h3>
                <button onClick={() => dispatch(clearMeasurements())} className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-transparent hover:border-red-800/40 px-2 py-1 rounded-xl transition-all">Clear</button>
            </div>
            
            {measurements.length === 0 ? (
                <div className="text-slate-500 italic text-xs py-4 text-center">Use the raycaster to pick two points on the solid body.</div>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {measurements.map((m: any, i: number) => (
                        <div key={m.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="text-indigo-300 font-bold text-xs uppercase">Measure #{i+1}</span>
                                <span className="font-mono font-bold text-teal-400 text-base">{m.distance.toFixed(3)} mm</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                <span>[{m.startPoint[0].toFixed(1)}, {m.startPoint[1].toFixed(1)}]</span>
                                <span>→</span>
                                <span>[{m.endPoint[0].toFixed(1)}, {m.endPoint[1].toFixed(1)}]</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
