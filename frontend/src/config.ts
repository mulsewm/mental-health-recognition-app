// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export const API_ENDPOINTS = {
  ANALYZE: `${API_BASE_URL}/api/v1/analyze`,
  EMOTION_SUMMARY: `${API_BASE_URL}/api/v1/emotion-summary`,
};
