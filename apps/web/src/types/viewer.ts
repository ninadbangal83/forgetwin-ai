export type _any = unknown & { [key: string]: unknown };

export interface ModelData {
  id: string;
  name: string;
  status: string;
  fileSize: number;
  createdAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  assemblyTree?: unknown;
  metadata?: Record<string, unknown>;
}

export interface StreamingMetrics {
  loaded: number;
  visible: number;
  loading: number;
  lod0: number;
  lod1: number;
  lod2: number;
}

export interface TreeNode {
  id: string;
  name?: string;
  type?: string;
  children?: TreeNode[];
  metrics?: {
    vertices?: number;
    faces?: number;
    isInstanced?: boolean;
  };
}
