export type EmotionType = 'neutral' | 'happy' | 'sad' | 'surprise' | 'fear' | 'disgust' | 'anger' | 'contempt';

export interface EmotionData {
  timestamp: string;
  emotion: EmotionType;
  confidence: number;
  bbox?: [number, number, number, number]; // [x, y, width, height]
  landmarks?: Array<[number, number]>;
}

export type ChartType = 'line' | 'bar';

export interface WebSocketMessage {
  type: 'emotion' | 'error' | 'info' | 'status' | 'connected' | 'disconnected';
  data: any;
  timestamp: string;
  sessionId?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  tension?: number;
  fill?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptions extends Record<string, any> {
  responsive: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      position?: 'top' | 'bottom' | 'left' | 'right' | 'chartArea' | { [scaleId: string]: number } | undefined;
      display?: boolean;
      labels?: {
        color?: string;
        font?: {
          size?: number;
          family?: string;
        };
        padding?: number;
        boxWidth?: number;
        usePointStyle?: boolean;
      };
    };
    tooltip?: {
      enabled?: boolean;
      mode?: 'index' | 'point' | 'nearest' | 'dataset' | 'x' | 'y' | undefined;
      intersect?: boolean;
      backgroundColor?: string;
      titleColor?: string;
      bodyColor?: string;
      borderColor?: string;
      borderWidth?: number;
      padding?: number;
      cornerRadius?: number;
      displayColors?: boolean;
      callbacks?: {
        label?: (context: any) => string | string[];
        title?: (context: any) => string | string[];
      };
    };
    title?: {
      display?: boolean;
      text?: string;
      color?: string;
      font?: {
        size?: number;
        family?: string;
        weight?: string | number;
      };
      padding?: number | { top: number; bottom: number };
    };
  };
  scales?: {
    x?: {
      grid?: {
        display?: boolean;
        color?: string;
        drawBorder?: boolean;
      };
      ticks?: {
        color?: string;
        maxRotation?: number;
        minRotation?: number;
      };
    };
    y?: {
      min?: number;
      max?: number;
      grid?: {
        display?: boolean;
        color?: string;
        drawBorder?: boolean;
      };
      ticks?: {
        color?: string;
        stepSize?: number;
        callback?: (value: number | string) => string;
      };
    };
  };
  animation?: {
    duration?: number;
    easing?: string;
  };
  onClick?: (event: any, elements: any, chart: any) => void;
  onHover?: (event: any, elements: any, chart: any) => void;
}
