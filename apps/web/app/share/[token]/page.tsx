'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ViewerLayout } from '@/features/viewer/components/ViewerLayout';
import { StoreProvider } from '@/store/StoreProvider';
import { apiClient } from '@/lib/apiClient';

interface SharedVersion {
  versionId: string;
  modelId: string;
  versionNumber: number;
  reviewStatus: string;
  snapshotData: any;
}

export default function SharedReviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<SharedVersion | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchSharedData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<{ data: SharedVersion }>(`/share/${token}`);
        setSharedData(res.data.data);
        setLoading(false);

        // Apply snapshot data to viewer engine after delay to let visualizer initialize
        setTimeout(() => {
          if (res.data.data && res.data.data.snapshotData) {
            window.dispatchEvent(
              new CustomEvent('viewer-restore-snapshot', {
                detail: res.data.data.snapshotData,
              })
            );
          }
        }, 3000);
      } catch (err: any) {
        console.error('Failed to load shared review session', err);
        setError(err.response?.data?.message || 'Invalid or expired share token');
        setLoading(false);
      }
    };
    fetchSharedData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-slate-950 font-sans text-slate-200 select-none">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-slate-800 animate-spin" />
          <span className="font-extrabold text-xs text-indigo-400 uppercase tracking-widest">
            Loading shared inspection session...
          </span>
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-slate-950 font-sans text-slate-200 p-6 select-none">
        <div className="max-w-md bg-slate-900/60 p-6 rounded-2xl border border-rose-900/40 text-center flex flex-col gap-3 shadow-2xl">
          <h2 className="text-xl font-black text-rose-400 uppercase tracking-wide">
            Access Denied
          </h2>
          <p className="text-sm text-slate-400">{error || 'This shared review link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <StoreProvider>
      <div className="flex-1 min-h-0 flex flex-col bg-slate-950 relative h-screen overflow-hidden select-none">
        <div className="flex-1 min-h-0 bg-slate-900/20 backdrop-blur-md relative z-10 overflow-hidden flex flex-col">
          <div className="absolute top-4 left-4 z-50 bg-indigo-950/60 backdrop-blur-md border border-indigo-800/40 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-2xl select-none">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
            <span className="font-extrabold text-[10px] text-indigo-300 uppercase tracking-wider">
              Viewing Version {sharedData.versionNumber} ({sharedData.reviewStatus})
            </span>
          </div>
          <ViewerLayout modelId={sharedData.modelId} />
        </div>
      </div>
    </StoreProvider>
  );
}
