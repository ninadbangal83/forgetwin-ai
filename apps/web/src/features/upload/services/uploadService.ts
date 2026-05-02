import { apiClient } from '@/lib/apiClient';

export async function uploadModel(file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/cad-models/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
