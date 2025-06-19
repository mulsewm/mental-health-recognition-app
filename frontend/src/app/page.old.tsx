'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCamera, FiVideo, FiUpload, FiBarChart2, FiUsers, FiClock } from 'react-icons/fi';
import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';

const features = [
  {
    name: 'Real-time Analysis',
    description: 'Get instant emotion recognition from your webcam feed with low latency processing.',
    icon: FiCamera,
    href: '/live',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  {
    name: 'Video Processing',
    description: 'Upload and analyze recorded videos to detect emotions at different timestamps.',
    icon: FiVideo,
    href: '/analyze',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    name: 'Detailed Analytics',
    description: 'View comprehensive reports and insights about detected emotions over time.',
    icon: FiBarChart2,
    href: '/analytics',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
  {
    name: 'Emotion History',
    description: 'Track and review historical emotion data with interactive visualizations.',
    icon: FiClock,
    href: '/history',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  }
];

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-16 w-16 bg-indigo-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </AppLayout>
    );
  }
    
    ws.onclose = () => {
      console.log('WebSocket Disconnected');
    };
    
    wsRef.current = ws;
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
        
        // Start processing frames
        processVideo();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  // Process video frames
  const processVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const processFrame = () => {
      if (video.paused || video.ended) return;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data and send to WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        wsRef.current.send(JSON.stringify({ image: imageData }));
      }
      
      // Continue processing
      requestAnimationFrame(processFrame);
    };
    
    // Start processing
    video.play().then(() => {
      processFrame();
    });
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const video = videoRef.current;
    if (!video) return;
    
    const videoURL = URL.createObjectURL(file);
    video.src = videoURL;
    video.play();
  };

  // Toggle between camera and upload mode
  const toggleMode = (newMode: 'upload' | 'camera') => {
    // Stop any existing streams
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    setMode(newMode);
    
    if (newMode === 'camera') {
      startCamera();
    } else {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Start camera when component mounts
  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    }
    
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode]);

  // Export emotion data as CSV
  const exportToCSV = () => {
    if (emotionData.length === 0) return;
    
    const headers = ['Timestamp', 'Emotion', 'Confidence'];
    const csvRows = [
      headers.join(','),
      ...emotionData.map(d => 
        `${d.timestamp},${d.emotion},${d.confidence}`
      )
    ];
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotion_data_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="bg-indigo-700 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Understand Emotions Through AI
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-indigo-100">
              Real-time facial emotion recognition for mental health insights, customer experience, and human-computer interaction.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <button
                onClick={() => router.push('/live')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiCamera className="-ml-1 mr-2 h-5 w-5" />
                Start Live Analysis
              </button>
              <button
                onClick={() => router.push('/analyze')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 bg-opacity-80 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiVideo className="-ml-1 mr-2 h-5 w-5" />
                Analyze Recording
              </button>
            </div>
              
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full max-w-2xl mx-auto border rounded-lg"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full max-w-2xl h-full"
                  style={{ display: 'none' }}
                />
              </div>
              
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="text-white text-lg font-semibold">
                    Processing...
                  </div>
                </div>
              )}
            </div>

            {/* Current Emotion Display */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Current Emotion
              </h3>
              {currentEmotion ? (
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-blue-600 mr-4">
                    {currentEmotion}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full"
                      style={{ width: `${confidence * 100}%` }}
                    ></div>
                  </div>
                  <div className="ml-4 text-gray-600">
                    {Math.round(confidence * 100)}%
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No emotion detected yet</p>
              )}
            </div>

            {/* Emotion Chart */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Emotion Timeline
                </h3>
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiDownload className="mr-1.5 h-4 w-4" />
                  Export CSV
                </button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <EmotionChart data={emotionData} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
