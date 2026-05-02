import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setExplodeFactor } from '@/store/viewerToolsSlice';

export function ExplodeSlider() {
    const dispatch = useDispatch();
    const factor = useSelector((state: RootState) => state.viewerTools.explodeFactor);

    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-slate-800 rounded-full px-6 py-3 w-[400px] z-50 text-sm flex items-center gap-4 select-none">
            <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-xs whitespace-nowrap">Explode</span>
            <input 
                type="range" min="0" max="100" value={factor} 
                onChange={(e) => dispatch(setExplodeFactor(parseFloat(e.target.value)))} 
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
            />
            <span className="font-mono font-bold text-teal-400 w-10 text-right">{factor}%</span>
        </div>
    );
}
