'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (typeof window !== 'undefined') {
        const token = res.data?.data?.accessToken || res.data?.accessToken;
        const user = res.data?.data?.user || res.data?.user;
        if (token) {
          localStorage.setItem('forgetwin_token', token);
        }
        if (user) {
          localStorage.setItem('forgetwin_user', JSON.stringify(user));
        }
        router.push('/');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background neon accents */}
      <div className="absolute top-[-100px] left-[-120px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none select-none z-0" />
      <div className="absolute top-[200px] right-[-150px] w-[600px] h-[600px] bg-teal-500/5 rounded-full filter blur-[140px] pointer-events-none select-none z-0" />

      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 flex flex-col gap-6 relative z-10 shadow-2xl"
      >
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2 mb-1">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-300">Log In</span>
          </h1>
          <p className="text-xs text-slate-400">Access your 3D engineering designs</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-800/50 p-3.5 rounded-xl text-xs text-red-400 font-medium leading-relaxed">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="engineer@company.com"
            className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-100 text-sm focus:border-indigo-500/50 focus:outline-none transition-all duration-200"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-3 text-slate-100 text-sm focus:border-indigo-500/50 focus:outline-none transition-all duration-200"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold p-3.5 rounded-xl shadow-lg shadow-indigo-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 uppercase tracking-widest text-xs flex justify-center items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
          ) : (
            'Log In'
          )}
        </button>

        <p className="text-xs text-center text-slate-400 mt-2">
          Don't have an account?{' '}
          <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
            Register now
          </a>
        </p>
      </form>
    </div>
  );
}
