/**
 * Front-end configuration values.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const FEATURE_FLAGS = {
  enableBackgroundSync: true,
  enableGpsCapture: true
};
