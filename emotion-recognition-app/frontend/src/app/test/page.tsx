'use client';

import { useEffect, useState } from 'react';
import EmotionChart from '@/components/EmotionChart';
import { EmotionData } from '@/types';

// Generate mock data for testing
const generateMockData = (count: number): EmotionData[] => {
  const emotions: Array<EmotionData['emotion']> = [
    'neutral', 'happy', 'sad', 'surprise', 'fear', 'disgust', 'anger', 'contempt'
  ];
  
  const now = Date.now();
  const data: EmotionData[] = [];
  
  for (let i = 0; i < count; i++) {
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    data.push({
      timestamp: new Date(now - (count - i) * 1000).toISOString(),
      emotion,
      confidence: Math.random(),
    });
  }
  
  return data;
};

export default function TestPage() {
  const [data, setData] = useState<EmotionData[]>([]);
  
  useEffect(() => {
    // Initial data
    setData(generateMockData(50));
    
    // Update data every 2 seconds
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev];
        // Remove first item if we have too many points
        if (newData.length >= 100) {
          newData.shift();
        }
        // Add new data point
        return [...newData, ...generateMockData(1)];
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Emotion Chart Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Real-time Emotion Analysis</h2>
        <div className="h-96">
          <EmotionChart 
            data={data} 
            title="Emotion Confidence Over Time"
            showEmojis={true}
            maxDataPoints={50}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Data Points</h2>
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emotion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...data].reverse().slice(0, 10).map((item, index) => (
                  <tr key={`${item.timestamp}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.emotion.charAt(0).toUpperCase() + item.emotion.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round(item.confidence * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Emotion Distribution</h2>
          <div className="h-96">
            <EmotionChart 
              data={data} 
              title="Current Emotion Distribution"
              showEmojis={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
