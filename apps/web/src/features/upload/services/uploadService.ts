import { apiClient } from '@/lib/apiClient';
import { ENDPOINTS } from '@/constants/api';

export async function uploadModel(file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(ENDPOINTS.UPLOAD, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
