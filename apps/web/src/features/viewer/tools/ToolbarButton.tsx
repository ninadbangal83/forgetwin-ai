import React from 'react';

export interface ToolbarButtonProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  activeClassName?: string;
  className?: string;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  id,
  label,
  icon,
  isActive,
  onClick,
  disabled,
  activeClassName,
  className
}) => {
  return (
    <div className="relative group select-none" key={id}>
      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-black text-white text-xs font-extrabold px-3.5 py-2 rounded-xl border border-slate-800 shadow-2xl transition-all duration-200 pointer-events-none select-none whitespace-nowrap z-[100]">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black" />
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={className || `px-3.5 py-2.5 rounded-xl border flex items-center justify-center transition-all duration-300 outline-none hover:scale-105 active:scale-95 ${
          isActive
            ? activeClassName || 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/20'
            : 'bg-slate-950/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/60 hover:border-indigo-500/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-800/60 disabled:hover:text-slate-300'
        }`}
      >
        {icon}
      </button>
    </div>
  );
};
