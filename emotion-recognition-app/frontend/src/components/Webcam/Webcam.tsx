'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function Webcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Start webcam stream
  const startWebcam = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam access is not supported in your browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Could not access webcam. Please check permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop webcam stream
  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      setEmotion(null);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  // Function to capture and analyze frame
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !isStreaming) return;

    try {
      setIsLoading(true);
      
      // Create a canvas to capture the current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Draw the current video frame to the canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob and send to API
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
      });

      if (!blob) {
        throw new Error('Failed to capture frame');
      }

      // Create FormData and append the image
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');

      // Send to the emotion recognition API
      const response = await fetch('http://localhost:8000/api/v1/analyze', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it with the correct boundary
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      
      // Handle different response formats
      if (data.emotion === 'no_face') {
        setEmotion('No face detected');
      } else if (data.emotion) {
        const emotionText = data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1);
        setEmotion(`${emotionText} (${(data.confidence * 100).toFixed(1)}% confidence)`);
      } else {
        setEmotion('No emotion detected');
      }
      
    } catch (err) {
      console.error('Error analyzing frame:', err);
      setError('Failed to analyze frame. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start analysis when streaming starts
  useEffect(() => {
    if (!isStreaming) return;
    
    // Set up interval for capturing and analyzing frames
    const analysisInterval = setInterval(() => {
      if (!isLoading) {
        captureAndAnalyze();
      }
    }, 1000); // Analyze every second
    
    return () => clearInterval(analysisInterval);
  }, [isStreaming, isLoading]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center p-6 bg-white bg-opacity-90 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Webcam Preview
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {error || 'Click start to begin emotion detection'}
                </p>
                <button
                  onClick={startWebcam}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Starting...' : 'Start Webcam'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {isStreaming && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Detected Emotion:
                </h4>
                <p className="text-lg font-semibold text-indigo-600">
                  {emotion || 'Analyzing...'}
                </p>
              </div>
              <button
                onClick={stopWebcam}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Stop Webcam
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
