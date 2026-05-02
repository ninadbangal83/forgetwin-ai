export const POLLING_INTERVAL = 3000;
export const STUCK_TIMEOUT_THRESHOLD = 5 * 60 * 1000; // 5 minutes in ms

export const MODEL_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  UPLOADED: 'UPLOADED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export const ACCEPTED_FILE_FORMATS = ['.step', '.stp'] as const;
