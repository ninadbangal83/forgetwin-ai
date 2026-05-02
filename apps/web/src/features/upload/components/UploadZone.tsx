'use client';
import React, { useState } from 'react';

export function UploadZone({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.step') && !file.name.toLowerCase().endsWith('.stp')) {
      setError('Only .step and .stp files are allowed.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(20);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/v1/cad-models/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Upload failed');
      }

      setProgress(100);
      setSuccess(true);
      setFile(null);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

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
        {uploading ? `Uploading... ${progress}%` : 'Upload STEP File'}
      </button>
    </div>
  );
}
