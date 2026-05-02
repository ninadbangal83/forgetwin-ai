export const VIEWER_COLORS = {
  BACKGROUND: 0x090d16,
  GRID_MAJOR: 0x312e81,
  GRID_MINOR: 0x1e1b4b,
  HIGHLIGHT: 0xffaa00,
  HIGHLIGHT_EMISSIVE: 0x332200,
  ISOLATE: 0xcccccc,
  LIGHT_DEFAULT: 0xffffff,
} as const;

export const VIEWER_CAMERA = {
  FOV: 45,
  NEAR: 0.1,
  FAR: 100000,
  DEFAULT_POS: { x: 50, y: 50, z: 50 },
} as const;

export const VIEWER_CONTROLS = {
  DAMPING_FACTOR: 0.08,
  ROTATE_SPEED: 1.0,
  PAN_SPEED: 1.2,
  ZOOM_SPEED: 1.5,
  MIN_DISTANCE: 1,
  MAX_DISTANCE: 1000,
} as const;

export const VIEWER_LIGHTING = {
  AMBIENT_INTENSITY: 0.7,
  DIRECTIONAL_INTENSITY: 1.0,
} as const;

export const LOD_THRESHOLDS = {
  DEFAULT_MAX_DIM: 1000,
  NEAR_MULTIPLIER: 0.8,
  FAR_MULTIPLIER: 2.5,
} as const;

export const CAMERA_FITTING = {
  MIN_PAN_SPEED: 1.2,
  MIN_ZOOM_SPEED: 1.5,
  PAN_SPEED_DIVISOR: 100,
  ZOOM_SPEED_DIVISOR: 50,
  CAMERA_Z_MULTIPLIER: 1.5,
  CAMERA_POS_OFFSET: 0.7,
} as const;

export const STREAMING = {
  FRAME_DIVISOR: 10,
  MAX_CHUNKS: 50,
} as const;

export const CLIPPING = {
  SIZE: 120,
  OPACITY: 0.2,
  COLORS: {
    X: 0x6366f1, // Indigo
    Y: 0x14b8a6, // Teal
    Z: 0xec4899, // Rose
  }
} as const;

export const EXPLODE = {
  MULTIPLIER: 0.2,
} as const;

export const MEASUREMENT = {
  SPHERE_RADIUS: 0.5,
  SPHERE_SEGMENTS: 16,
  COLOR: 0xff0000,
  LINE_WIDTH: 3,
} as const;





