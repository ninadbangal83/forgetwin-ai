'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('forgetwin_token');
      setIsAuth(!!token);
    }
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forgetwin_token');
      localStorage.removeItem('forgetwin_user');
      setIsAuth(false);
      router.push('/login');
    }
  };

  return (
    <nav className="flex items-center gap-6 select-none">
      {isAuth ? (
        <>
          <a 
            href={ROUTES.MODELS} 
            className="text-xs font-black tracking-wider text-white uppercase transition-all duration-300 flex items-center gap-2.5 bg-gradient-to-r from-indigo-600/20 via-indigo-500/10 to-teal-500/20 hover:from-indigo-600 hover:to-teal-500 hover:text-white px-4 py-2.5 rounded-xl border border-indigo-500/30 hover:border-indigo-500/50 shadow-md hover:shadow-indigo-500/20 active:scale-[0.98]"
          >
            <span>📁</span> <span>View Models</span>
          </a>
          <button 
            onClick={handleLogout}
            className="text-xs font-black tracking-wider text-red-400 uppercase transition-all duration-300 flex items-center gap-2.5 bg-slate-900 border border-slate-800 hover:bg-red-950 hover:text-red-300 px-4 py-2.5 rounded-xl"
          >
            <span>🚪</span> <span>Log Out</span>
          </button>
        </>
      ) : (
        <>
          <a 
            href="/login" 
            className="text-xs font-black tracking-wider text-white uppercase transition-all duration-300 flex items-center gap-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2.5 rounded-xl"
          >
            Log In
          </a>
          <a 
            href="/register" 
            className="text-xs font-black tracking-wider text-white uppercase transition-all duration-300 flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl"
          >
            Register
          </a>
        </>
      )}
    </nav>
  );
}
