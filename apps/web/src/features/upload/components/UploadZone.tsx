'use client';
import React from 'react';
import { useUpload } from '../hooks/useUpload';

export function UploadZone({ onSuccess }: { onSuccess?: () => void }) {
  const {
    file,
    uploading,
    progress,
    error,
    success,
    handleFileChange,
    handleUpload,
  } = useUpload(onSuccess);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl select-none">
      <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
        <span className="text-teal-400">📁</span> Pick a File
      </h2>
      
      <div className="mb-5">
        <input 
          type="file" 
          accept=".step,.stp"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-slate-700/80 file:text-xs file:font-bold file:bg-slate-800 file:text-indigo-300 hover:file:bg-indigo-950 hover:file:border-indigo-500/50 file:transition-all hover:file:text-white cursor-pointer"
        />
      </div>

      {error && <div className="text-red-400 text-xs mb-4 bg-red-950/40 border border-red-800/40 rounded-xl p-3">{error}</div>}
      {success && <div className="text-teal-300 text-xs mb-4 bg-teal-950/40 border border-teal-800/40 rounded-xl p-3 font-medium">Upload successful! Ready for processing.</div>}

      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        className={`w-full py-2.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 ${!file || uploading ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700/50 shadow-none' : 'bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98]'}`}
      >
        {uploading ? (progress === 100 ? 'Saving on Server...' : `Uploading... ${progress}%`) : 'Upload STEP File'}
      </button>
    </div>
  );
}

