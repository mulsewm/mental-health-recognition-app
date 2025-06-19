export type EmotionType = 'neutral' | 'happy' | 'sad' | 'surprise' | 'fear' | 'disgust' | 'anger' | 'contempt';

export interface EmotionData {
  timestamp: string;
  emotion: EmotionType;
  confidence: number;
}

export interface EmotionStats {
  totalFrames: number;
  distribution: Record<string, { count: number; avg_confidence: number }>;
}

export interface EmotionSummaryItem {
  timestamp: string;
  emotion: string;
  confidence: number;
}

export interface EmotionChartProps {
  data: EmotionData[];
  chartType?: 'line' | 'bar';
  height?: number;
  width?: number | string;
}
