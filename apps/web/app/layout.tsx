import React from 'react';
import { HeaderNav } from '@/components/HeaderNav';

export const metadata = {
  title: 'ForgeTwin AI - Enterprise CAD Visualizer',
  description: 'High performance 3D streaming and engineering platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-950 min-h-screen text-slate-100 font-sans antialiased flex flex-col">
        {/* Universal ForgeTwin Premium Header */}
        <header className="w-full border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50 select-none shrink-0">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group transition-all duration-300">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 via-purple-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <span className="text-white text-base font-black tracking-wider">FT</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-wider text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-teal-300 transition-all duration-300">
                  ForgeTwin <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-300">AI</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Cloud 3D Engine</span>
              </div>
            </a>
            
            {/* Global Quick Navigation Links */}
            <HeaderNav />
          </div>
        </header>

        <main className="flex-1 min-h-0 relative flex flex-col h-[calc(100vh-4rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}
