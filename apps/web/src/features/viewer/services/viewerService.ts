import { apiClient } from '@/lib/apiClient';
import { ENDPOINTS } from '@/constants/api';
import { ModelData } from '@/types/viewer';


export async function fetchModelMetadata(modelId: string): Promise<ModelData> {
  const response = await apiClient.get(`${ENDPOINTS.CAD_MODELS}/${modelId}`);
  const raw = response.data;
  return raw.data || raw;
}

export async function fetchModels(): Promise<ModelData[]> {
  const response = await apiClient.get(ENDPOINTS.CAD_MODELS);
  const raw = response.data;
  return Array.isArray(raw) ? raw : (raw.data || []);
}

