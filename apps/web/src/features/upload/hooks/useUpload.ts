import { useState } from 'react';
import { uploadModel } from '@/features/upload/services/uploadService';
import { ACCEPTED_FILE_FORMATS } from '@/constants/app';

export function useUpload(onSuccess?: () => void) {
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
    
    const isValidFormat = ACCEPTED_FILE_FORMATS.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValidFormat) {
      setError(`Only ${ACCEPTED_FILE_FORMATS.join(' and ')} files are allowed.`);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      await uploadModel(file, (percent: number) => {
        setProgress(percent);
      });

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

  return {
    file,
    uploading,
    progress,
    error,
    success,
    handleFileChange,
    handleUpload,
  };
}
