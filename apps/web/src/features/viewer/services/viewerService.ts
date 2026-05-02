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
  const res = await fetch(`http://localhost:3001/v1/cad-models/${modelId}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch metadata: ${res.statusText}`);
  }
  const raw = await res.json();
  return raw.data || raw;
}
