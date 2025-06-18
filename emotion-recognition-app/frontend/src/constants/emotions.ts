import { EmotionType } from '@/types';

// Emotion color mapping
export const EMOTION_COLORS: Record<EmotionType, string> = {
  neutral: '#94a3b8',    // slate-400
  happy: '#fbbf24',     // amber-400
  sad: '#60a5fa',       // blue-400
  surprise: '#c084fc',   // purple-400
  fear: '#f472b6',      // pink-400
  disgust: '#34d399',   // emerald-400
  anger: '#f87171',     // red-400
  contempt: '#9ca3af',  // gray-400
};

// Emotion emoji mapping
export const EMOTION_EMOJIS: Record<EmotionType, string> = {
  neutral: '😐',
  happy: '😊',
  sad: '😢',
  surprise: '😲',
  fear: '😨',
  disgust: '🤢',
  anger: '😠',
  contempt: '😏',
};

// Emotion labels
export const EMOTION_LABELS: Record<EmotionType, string> = {
  neutral: 'Neutral',
  happy: 'Happy',
  sad: 'Sad',
  surprise: 'Surprised',
  fear: 'Afraid',
  disgust: 'Disgusted',
  anger: 'Angry',
  contempt: 'Contempt',
};

// Default emotion values for initialization
export const DEFAULT_EMOTIONS = Object.entries(EMOTION_COLORS).map(([emotion]) => ({
  emotion: emotion as EmotionType,
  confidence: 0,
  timestamp: new Date().toISOString(),
}));
