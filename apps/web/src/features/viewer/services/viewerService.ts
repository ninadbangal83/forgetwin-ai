import { apiClient } from '@/lib/apiClient';

export interface ModelData {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  fileSize: number;
  downloadUrl?: string;
  thumbnailUrl?: string;
  processedStorageKey?: string;
  metadata?: Record<string, unknown>;
  assemblyTree?: Record<string, unknown>;
}

export async function fetchModelMetadata(modelId: string): Promise<ModelData> {
  const response = await apiClient.get(`/cad-models/${modelId}`);
  const raw = response.data;
  return raw.data || raw;
}
