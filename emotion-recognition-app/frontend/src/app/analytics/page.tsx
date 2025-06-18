'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiBarChart2, FiPieChart, FiCalendar, FiDownload } from 'react-icons/fi';
import AppLayout from '@/components/layout/AppLayout';
import { EmotionChart, ChartType } from '@/components/EmotionChart/EmotionChart';
import { EmotionData, EmotionType } from '@/types';

// Mock data - in a real app, this would come from an API
const generateMockData = (days: number = 7): EmotionData[] => {
  const emotions: EmotionType[] = ['happy', 'sad', 'anger', 'neutral', 'surprise', 'fear', 'disgust'];
  const data: EmotionData[] = [];
  const now = new Date();
  
  for (let i = 0; i < days * 24; i++) {
    const timestamp = new Date(now);
    timestamp.setHours(timestamp.getHours() - i);
    
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence
    
    data.push({
      timestamp: timestamp.toISOString(),
      emotion,
      confidence
    });
  }
  
  return data;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate loading data
    const loadData = () => {
      setIsLoading(true);
      
      // In a real app, you would fetch data from your API
      setTimeout(() => {
        const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
        const data = generateMockData(days);
        setEmotionData(data);
        setIsLoading(false);
      }, 500);
    };
    
    loadData();
  }, [timeRange]);

  const getEmotionStats = () => {
    const stats: Record<string, { count: number; totalConfidence: number }> = {};
    
    emotionData.forEach(data => {
      if (!stats[data.emotion]) {
        stats[data.emotion] = { count: 0, totalConfidence: 0 };
      }
      stats[data.emotion].count += 1;
      stats[data.emotion].totalConfidence += data.confidence;
    });
    
    return Object.entries(stats).map(([emotion, { count, totalConfidence }]) => ({
      emotion,
      count,
      avgConfidence: totalConfidence / count
    })).sort((a, b) => b.count - a.count);
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      happy: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      sad: { bg: 'bg-blue-100', text: 'text-blue-800' },
      angry: { bg: 'bg-red-100', text: 'text-red-800' },
      neutral: { bg: 'bg-gray-100', text: 'text-gray-800' },
      surprise: { bg: 'bg-purple-100', text: 'text-purple-800' },
      fear: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      disgust: { bg: 'bg-green-100', text: 'text-green-800' },
    };
    
    return colors[emotion] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const downloadReport = () => {
    // In a real app, this would generate a proper report
    alert('Exporting report...');
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track and analyze emotion detection data over time
            </p>
          </div>
          
          <div className="mt-4 flex space-x-3 md:mt-0">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FiCalendar className="h-4 w-4" />
              </div>
            </div>
            
            <button
              onClick={downloadReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiDownload className="-ml-1 mr-2 h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiBarChart2 className="inline mr-2 h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trends'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiPieChart className="inline mr-2 h-4 w-4" />
              Trends
            </button>
          </nav>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-pulse text-center">
              <div className="h-12 w-12 bg-indigo-100 rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {getEmotionStats().slice(0, 4).map((stat) => {
                const color = getEmotionColor(stat.emotion);
                return (
                  <div key={stat.emotion} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 rounded-md p-3 ${color.bg}`}>
                          <span className={`text-lg font-medium ${color.text}`}>
                            {stat.emotion.charAt(0).toUpperCase() + stat.emotion.slice(1)}
                          </span>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Detections
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-gray-900">
                                {stat.count}
                              </div>
                              <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                                {Math.round(stat.avgConfidence * 100)}%
                                <span className="sr-only"> confidence</span>
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Emotion Timeline</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      chartType === 'line' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      chartType === 'bar' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Bar
                  </button>
                </div>
              </div>
              <div className="h-96">
                <EmotionChart 
                  data={emotionData} 
                  chartType={chartType}
                  showEmojis={true}
                  height="100%"
                />
              </div>
            </div>

            {/* Emotion Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Emotion Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">By Count</h3>
                  <div className="space-y-3">
                    {getEmotionStats().map((stat) => {
                      const color = getEmotionColor(stat.emotion);
                      const percentage = (stat.count / emotionData.length) * 100;
                      
                      return (
                        <div key={`count-${stat.emotion}`} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className={`font-medium ${color.text}`}>
                              {stat.emotion.charAt(0).toUpperCase() + stat.emotion.slice(1)}
                            </span>
                            <span className="text-gray-500">
                              {stat.count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${color.bg}`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">By Average Confidence</h3>
                  <div className="space-y-3">
                    {[...getEmotionStats()]
                      .sort((a, b) => b.avgConfidence - a.avgConfidence)
                      .map((stat) => {
                        const color = getEmotionColor(stat.emotion);
                        const confidencePercentage = stat.avgConfidence * 100;
                        
                        return (
                          <div key={`confidence-${stat.emotion}`} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={`font-medium ${color.text}`}>
                                {stat.emotion.charAt(0).toUpperCase() + stat.emotion.slice(1)}
                              </span>
                              <span className="text-gray-500">
                                {confidencePercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${color.bg}`} 
                                style={{ width: `${confidencePercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {emotionData
                  .slice()
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 10)
                  .map((data, index) => {
                    const color = getEmotionColor(data.emotion);
                    const date = new Date(data.timestamp);
                    
                    return (
                      <div key={index} className="px-6 py-4 flex items-center">
                        <div className={`flex-shrink-0 rounded-full p-2 ${color.bg}`}>
                          <span className={`text-sm font-medium ${color.text}`}>
                            {data.emotion.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1)} detected
                          </p>
                          <p className="text-sm text-gray-500">
                            {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.round(data.confidence * 100)}% confidence
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
                  <span className="font-medium">{emotionData.length}</span> results
                </p>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View all
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
