export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
export const API_TIMEOUT = 60000;

export const ENDPOINTS = {
  CAD_MODELS: '/cad-models',
  UPLOAD: '/cad-models/upload',
} as const;
