'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FiBarChart2, 
  FiPieChart, 
  FiCalendar, 
  FiDownload, 
  FiRefreshCw, 
  FiTrendingUp, 
  FiUsers, 
  FiActivity 
} from 'react-icons/fi';

import AppLayout from '@/components/layout/AppLayout';
import { EmotionChart, ChartType } from '@/components/EmotionChart/EmotionChart';
import { ModelPredictionShowcase } from '@/components/ModelPredictionShowcase/ModelPredictionShowcase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { EmotionData, EmotionType } from '@/types/emotion';
import { API_ENDPOINTS } from '@/config';

// Add this if not already present in your types
declare global {
  interface Window {
    __gradient_aztec_src: string;
  }
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [emotionStats, setEmotionStats] = useState<{
    totalFrames: number;
    distribution: Record<string, { count: number; avg_confidence: number }>;
  }>({ 
    totalFrames: 0, 
    distribution: {} 
  });

  const fetchEmotionSummary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.EMOTION_SUMMARY);
      
      if (!response.ok) {
        throw new Error('Failed to fetch emotion summary');
      }
      
      const data = await response.json() as {
        summary: {
          total_frames: number;
          emotion_distribution: Record<string, { count: number; avg_confidence: number }>;
          timeline: Array<{ timestamp: string } & Record<string, number>>;
        };
      };
      
      // Transform the timeline data to match the expected format
      const transformedData: EmotionData[] = [];
      
      // Process timeline data
      if (data.summary?.timeline) {
        data.summary.timeline.forEach((timeEntry) => {
          Object.entries(timeEntry).forEach(([emotion, count]) => {
            if (emotion !== 'timestamp' && typeof count === 'number') {
              transformedData.push({
                timestamp: timeEntry.timestamp,
                emotion: emotion.toLowerCase() as EmotionType,
                confidence: 0.8 // Default confidence for aggregated data
              });
            }
          });
        });
      }
      
      setEmotionData(transformedData);
      
      // Store the summary data for display
      if (data.summary) {
        setEmotionStats({
          totalFrames: data.summary.total_frames || 0,
          distribution: data.summary.emotion_distribution || {}
        });
      }
      
    } catch (error) {
      console.error('Error fetching emotion summary:', error);
      // Fallback to mock data if API fails
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const mockData = generateMockData(days);
      setEmotionData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = (days: number = 7): EmotionData[] => {
    const emotions: EmotionType[] = ['happy', 'sad', 'anger', 'neutral', 'surprise', 'fear', 'disgust'];
    const data: EmotionData[] = [];
    const now = new Date();
    
    for (let i = 0; i < days * 24; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(timestamp.getHours() - i);
      
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];
      const confidence = 0.7 + Math.random() * 0.3;
      
      data.push({
        timestamp: timestamp.toISOString(),
        emotion,
        confidence
      });
    }
    
    return data;
  };

  const handleRefresh = () => {
    fetchEmotionSummary();
  };

  useEffect(() => {
    fetchEmotionSummary();
  }, [timeRange]);

  const getEmotionStats = () => {
    if (Object.keys(emotionStats.distribution).length > 0) {
      return Object.entries(emotionStats.distribution).map(([emotion, data]) => ({
        emotion,
        count: data.count,
        avgConfidence: data.avg_confidence
      }));
    }
    
    // Fallback to calculating from emotionData if no distribution data
    const stats: Record<string, { count: number; totalConfidence: number }> = {};
    
    emotionData.forEach(({ emotion, confidence }) => {
      if (!stats[emotion]) {
        stats[emotion] = { count: 0, totalConfidence: 0 };
      }
      stats[emotion].count += 1;
      stats[emotion].totalConfidence += confidence;
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Emotion Analytics Dashboard
          </motion.h1>
          <p className="text-muted-foreground">
            Insights and analysis from your emotion detection data
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Frames</CardTitle>
              <FiActivity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emotionStats.totalFrames.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+20.1% from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Dominant Emotion</CardTitle>
              <FiTrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {Object.entries(emotionStats.distribution).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Most detected emotion</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Confidence</CardTitle>
              <FiUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  Object.values(emotionStats.distribution).reduce(
                    (acc, curr) => acc + (curr.avg_confidence || 0) * curr.count,
                    0
                  ) / Math.max(1, Object.values(emotionStats.distribution).reduce((acc, curr) => acc + curr.count, 0))
                ).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Across all emotions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Emotions Detected</CardTitle>
              <FiBarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(emotionStats.distribution).length}</div>
              <p className="text-xs text-muted-foreground">Different emotions</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="model">Model Predictions</TabsTrigger>
              <TabsTrigger value="details" disabled>Detailed Analysis</TabsTrigger>
            </TabsList>
            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <Button variant="outline" size="sm" onClick={fetchEmotionSummary} disabled={isLoading}>
                <FiRefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Emotion Distribution</CardTitle>
                <CardDescription>Overview of detected emotions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <EmotionChart data={emotionData} chartType={chartType} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="model" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Model Predictions Showcase</h2>
                <p className="text-muted-foreground">
                  See how our model analyzes different facial expressions in real-time
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <FiDownload className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </div>
            
            <ModelPredictionShowcase />
            
            <div className="mt-8 bg-muted/50 p-6 rounded-lg border">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <svg
                    className="h-5 w-5 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Need more accurate results?</h3>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>
                      For best results, ensure good lighting and position your face clearly in the frame. 
                      The model works best with frontal views and neutral expressions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
