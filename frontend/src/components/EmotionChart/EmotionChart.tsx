'use client';

import { useMemo, useEffect, useRef } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  ChartType as ChartJsType,
  ChartData,
  ChartOptions,
  registerables,
  Chart
} from 'chart.js';
import { EmotionData, EmotionType } from '@/types';
import { EMOTION_COLORS, EMOTION_EMOJIS } from '@/constants/emotions';

// Register ChartJS components
ChartJS.register(...registerables);

// Use the EmotionType from our types
type ExtendedEmotionType = EmotionType;

// ChartJS components are registered above with registerables

// Re-export the ChartType for external use
export type ChartType = 'line' | 'bar';

export interface EmotionChartProps {
  data: EmotionData[];
  chartType?: ChartType;
  title?: string;
  height?: number | string;
  showEmojis?: boolean;
  maxDataPoints?: number;
  className?: string;
}

const DEFAULT_HEIGHT = 300;
const DEFAULT_MAX_POINTS = 30;

type ChartDataType = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    tension: number;
    fill: boolean;
  }>;
};

export function EmotionChart({
  data = [],
  chartType = 'line',
  title = 'Emotion Timeline',
  height = DEFAULT_HEIGHT,
  showEmojis = true,
  maxDataPoints = DEFAULT_MAX_POINTS,
  className = '',
}: EmotionChartProps) {
  // Refs for chart instance and canvas
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Process data for chart
  const { chartData, options } = useMemo(() => {
    // Get unique timestamps
    const timestamps = [...new Set(data.map(item => item.timestamp))]
      .sort()
      .slice(-maxDataPoints);

    // Get all emotion types
    const emotionTypes = Object.keys(EMOTION_COLORS) as EmotionType[];

    // Create datasets for each emotion
    const datasets = emotionTypes.map((emotion: EmotionType) => {
      const emotionData = timestamps.map(timestamp => {
        const entry = data
          .filter(d => d.emotion === emotion)
          .find(d => d.timestamp === timestamp);
        return entry ? Math.round(entry.confidence * 100) : null;
      });

      const emotionLabel = emotion.charAt(0).toUpperCase() + emotion.slice(1);
      const label = showEmojis 
        ? `${EMOTION_EMOJIS[emotion as EmotionType] || ''} ${emotionLabel}`
        : emotionLabel;

      const borderColor = EMOTION_COLORS[emotion as EmotionType];
      
      return {
        label,
        data: emotionData,
        borderColor,
        backgroundColor: `${borderColor}40`,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      };
    });

    // Chart data
    const chartData: ChartData<'line' | 'bar', (number | null)[], string> = {
      labels: timestamps.map(ts => new Date(ts).toLocaleTimeString()),
      datasets,
    };

    // Chart options
    const options: ChartOptions<ChartType> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Confidence %',
          },
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
        x: {
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            boxWidth: 12,
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context: TooltipItem<ChartJsType>) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y ?? 0;
              return `${label}: ${value}%`;
            },
          },
        },
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
          },
        },
      },
    };

    return { chartData, options };
  }, [data, title, showEmojis, maxDataPoints]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Destroy previous chart instance if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    // Create new chart instance
    chartRef.current = new Chart(ctx, {
      type: chartType,
      data: chartData,
      options: options
    });
    
    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData, options, chartType]);

  return (
    <div className={className} style={{ height, width: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default EmotionChart;
