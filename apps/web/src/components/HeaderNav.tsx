'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

export function HeaderNav() {
  const pathname = usePathname();

  // Hide the "View Models" button if the user is already on the models/designs page
  if (pathname === ROUTES.MODELS) {
    return null;
  }

  return (
    <nav className="flex items-center gap-6 select-none">
      <a 
        href={ROUTES.MODELS} 
        className="text-xs font-black tracking-wider text-white uppercase transition-all duration-300 flex items-center gap-2.5 bg-gradient-to-r from-indigo-600/20 via-indigo-500/10 to-teal-500/20 hover:from-indigo-600 hover:to-teal-500 hover:text-white px-4 py-2.5 rounded-xl border border-indigo-500/30 hover:border-indigo-500/50 shadow-md hover:shadow-indigo-500/20 active:scale-[0.98]"
      >
        <span>📁</span> <span>View Models</span>
      </a>
    </nav>
  );
}
