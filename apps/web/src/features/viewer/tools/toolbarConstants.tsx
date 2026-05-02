import React from 'react';

export const tools = [
    { 
      id: 'select', 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 4 11 20 14 14 20 11 4 4" />
        </svg>
      ), 
      label: 'Select Geometry (S)' 
    },
    { 
      id: 'measure', 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="10" rx="2" />
          <line x1="6" y1="7" x2="6" y2="12" />
          <line x1="10" y1="7" x2="10" y2="10" />
          <line x1="14" y1="7" x2="14" y2="12" />
          <line x1="18" y1="7" x2="18" y2="10" />
        </svg>
      ), 
      label: 'Point Measurement (M)' 
    },
    { 
      id: 'clip', 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      ), 
      label: 'Section Clipping (C)' 
    },
    { 
      id: 'explode', 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 21l-6-6" />
          <path d="M3 3l6 6" />
          <path d="M21 3l-6 6" />
          <path d="M3 21l6-6" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ), 
      label: 'Exploded View (E)' 
    },
] as const;

export const navControls = [
    {
      id: 'home',
      label: 'Home View',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      id: 'fittoview',
      label: 'Fit to View',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      )
    },
    {
      id: 'orbit',
      label: 'Orbit Mode',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <path d="m15.5 8.5 2.5 2.5m-11 5 2.5-2.5" />
        </svg>
      )
    },
    {
      id: 'pan',
      label: 'Pan Mode',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5 9 2 12 5 15" />
          <polyline points="9 5 12 2 15 5" />
          <polyline points="15 19 12 22 9 19" />
          <polyline points="19 9 22 12 19 15" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="12" y1="2" x2="12" y2="22" />
        </svg>
      )
    },
    {
      id: 'walk',
      label: 'Walk Mode',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
          <path d="m19 9-4-1-4-2-4 3v4" />
          <path d="m7 21 3-5 2-4" />
          <path d="m11.5 12.5 1.5 2.5 3.5 1 1 5" />
        </svg>
      )
    },
    {
      id: 'zoom',
      label: 'Zoom Mode',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      )
    }
] as const;
