import { apiClient } from '@/lib/apiClient';
import { ENDPOINTS } from '@/constants/api';
import { AxiosProgressEvent } from 'axios';

export async function uploadModel(file: File, onProgress?: (percent: number) => void): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(ENDPOINTS.UPLOAD, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });

  return response.data;
}
