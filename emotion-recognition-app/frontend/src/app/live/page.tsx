'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiPause, FiPlay, FiDownload } from 'react-icons/fi';
import AppLayout from '@/components/layout/AppLayout';
import { EmotionType } from '@/types';
import EmotionChart from '@/components/EmotionChart/EmotionChart';

// The base URL for your analysis API (without trailing slash for consistency)
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Interface for the emotion data points
interface EmotionData {
  timestamp: string;
  emotion: EmotionType;
  confidence: number;
  bbox?: [number, number, number, number];
}

// Color mapping for different emotions for UI elements
const EMOTION_COLORS: Record<EmotionType, string> = {
  neutral: 'bg-gray-100 text-gray-800',
  happy: 'bg-yellow-100 text-yellow-800',
  sad: 'bg-blue-100 text-blue-800',
  surprise: 'bg-purple-100 text-purple-800',
  fear: 'bg-indigo-100 text-indigo-800',
  disgust: 'bg-green-100 text-green-800',
  anger: 'bg-red-100 text-red-800',
  contempt: 'bg-pink-100 text-pink-800'
};

/**
 * LiveAnalysis component for real-time facial emotion detection.
 */
export default function LiveAnalysis() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType | ''>('');
  const [confidence, setConfidence] = useState<number>(0);

  /**
   * Captures a frame from the video, sends it to the API for analysis,
   * and updates the state with the results.
   */
  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isPaused) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    try {
      // Match canvas dimensions to the video feed
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame onto the hidden canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert the canvas image to a Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
      });

      if (!blob) return;

      // Send the image data to the analysis API
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');

      let responseData;
      try {
        // Add required query parameters
        const queryParams = new URLSearchParams({
          model_path: 'models/torchscript_model_0_66_37_wo_gl.pth',
          landmark_path: 'models/shape_predictor_68_face_landmarks.dat'
        });
        
        const response = await fetch(`${API_BASE_URL}/analyze?${queryParams}`, {
          method: 'POST',
          body: formData,
          // Let the browser set the Content-Type header with the correct boundary
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server responded with:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        responseData = await response.json();
      } catch (error) {
        console.error('Error during API call:', error);
        // Reset current emotion on error
        setCurrentEmotion('');
        setConfidence(0);
        return;
      }
      
      // Process the API response
      if (responseData?.emotion) {
        if (responseData.emotion === 'no_face') {
          setCurrentEmotion('neutral'); // Reset to neutral when no face is detected
          setConfidence(0);
          return;
        }
        
        const emotion = responseData.emotion as EmotionType;
        const newConfidence = responseData.confidence || 0;
        
        setCurrentEmotion(emotion);
        setConfidence(newConfidence);
        
        // Add new data point to the emotion history
        const newData: EmotionData = {
          timestamp: new Date().toISOString(),
          emotion,
          confidence: newConfidence,
          bbox: responseData.all_faces?.[0]?.bounding_box
        };
        
        // Keep the history limited to the last 30 data points
        setEmotionData(prev => [...prev.slice(-29), newData]);
      } else {
        // Reset current emotion if no face is detected
        setCurrentEmotion('');
        setConfidence(0);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error analyzing frame:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
    }
  }, [isPaused]);

  // Effect to manage the analysis interval
  useEffect(() => {
    if (isAnalyzing && !isPaused) {
      // Start analysis interval, running every second
      analysisInterval.current = setInterval(analyzeFrame, 1000);
    } else {
      // Clear interval if analysis is stopped or paused
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
      }
    }
    
    // Cleanup function to clear the interval
    return () => {
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
      }
    };
  }, [isAnalyzing, isPaused, analyzeFrame]);

  // Effect to initialize and clean up the camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          mediaStreamRef.current = stream;
          setIsLoading(false);
          setIsAnalyzing(true);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access the camera. Please grant permission and refresh the page.');
        setIsLoading(false);
      }
    };
    
    startCamera();
    
    // Cleanup function to stop camera tracks
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
      }
    };
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  /**
   * Downloads the collected emotion data as a CSV file.
   */
  const downloadData = () => {
    if (emotionData.length === 0) return;
    
    const csvHeader = 'Timestamp,Emotion,Confidence\n';
    const csvRows = emotionData.map(d => 
        `${d.timestamp},${d.emotion},${d.confidence}`
    ).join('\n');
    
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emotion_analysis_data_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const getEmotionColor = (emotion: EmotionType | ''): string => {
    return emotion ? EMOTION_COLORS[emotion] : 'bg-gray-100 text-gray-800';
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Live Mental Analysis</h1>
          <p className="mt-2 text-sm text-gray-600">
            Real-time facial emotion detection using your webcam. Please ensure your face is clearly visible in the frame.
          </p>
          {currentEmotion === 'neutral' && confidence === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No face detected. Please ensure your face is clearly visible in the frame.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Feed and Controls */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="relative bg-black">
              {isLoading && (
                <div className="flex items-center justify-center h-96 bg-gray-900 text-white">
                  <div className="animate-pulse">Loading Camera...</div>
                </div>
              )}
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-auto max-h-[600px] ${isLoading ? 'hidden' : ''}`}
              />
              {/* This canvas is used for capturing frames and is not displayed */}
              <canvas ref={canvasRef} className="hidden" />
              
              {!isLoading && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={togglePause}
                      className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                        isPaused 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-white/90 text-gray-800 hover:bg-white'
                      }`}
                      disabled={isLoading}
                    >
                      {isPaused ? <FiPlay className="mr-2" /> : <FiPause className="mr-2" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    
                    <button
                      onClick={downloadData}
                      className="flex items-center px-4 py-2 bg-white/90 rounded-md text-gray-800 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={emotionData.length === 0}
                    >
                      <FiDownload className="mr-2" />
                      Export Data
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}
          </div>

          {/* Data Display Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Current Status</h2>
              {currentEmotion ? (
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-md font-medium ${getEmotionColor(currentEmotion)}`}>
                    {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
                  </span>
                  <span className="text-gray-600 font-semibold">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              ) : (
                <p className="text-gray-500">{isAnalyzing ? 'Searching for face...' : 'Analysis paused.'}</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Emotion Timeline</h2>
              <div className="h-64">
                <EmotionChart data={emotionData} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Detections</h2>
              {emotionData.length > 0 ? (
                <div className="space-y-2">
                  {[...emotionData].reverse().slice(0, 5).map((data, index) => (
                    <motion.div 
                      key={data.timestamp}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-sm text-gray-600">
                        {new Date(data.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getEmotionColor(data.emotion)}`}>
                        {data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {Math.round(data.confidence * 100)}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No emotion data recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}