'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLoader, FiAlertCircle } from 'react-icons/fi';
import FileUpload from '@/components/FileUpload/FileUpload';
import AppLayout from '@/components/layout/AppLayout';
import { API_ENDPOINTS } from '@/config';

interface AnalysisResult {
  emotion: string;
  confidence: number;
  timestamp: string;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [progress, setProgress] = useState(0);
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const videoDurationRef = useRef(0);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setAnalysisResults([]);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setAnalysisResults([]);
    setProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const analyzeMedia = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults([]);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Add model_path and landmark_path as query parameters with relative paths
      const url = new URL(API_ENDPOINTS.ANALYZE);
      // Use relative paths to the model and landmark files from the backend directory
      const modelPath = 'models/torchscript_model_0_66_49_wo_gl.pth';
      const landmarkPath = 'models/shape_predictor_68_face_landmarks.dat';
      url.searchParams.append('model_path', modelPath);
      url.searchParams.append('landmark_path', landmarkPath);
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze media');
      }

      // Handle streaming response for video
      if (selectedFile.type.startsWith('video/')) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to read response stream');

        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = new TextDecoder().decode(value);
              const results = chunk.split('\n')
                .filter(Boolean)
                .map(line => {
                  try {
                    return JSON.parse(line);
                  } catch (e) {
                    console.error('Error parsing chunk:', e);
                    return null;
                  }
                })
                .filter(Boolean);
              
              if (results.length > 0) {
                setAnalysisResults(prev => [...prev, ...results]);
                
                // Update progress based on timestamp for video
                const lastResult = results[results.length - 1];
                if (lastResult.timestamp && videoDurationRef.current > 0) {
                  const currentTime = parseFloat(lastResult.timestamp);
                  setProgress(Math.min((currentTime / videoDurationRef.current) * 100, 100));
                }
              }
            }
          } catch (err) {
            console.error('Error processing stream:', err);
            setError('Error processing video stream');
          } finally {
            setIsAnalyzing(false);
          }
        };

        processStream();
      } else {
        // Handle single image response
        const result = await response.json();
        setAnalysisResults([result]);
        setProgress(100);
        setIsAnalyzing(false);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze media');
      setIsAnalyzing(false);
    }
  };

  // Setup media element when file is selected
  useEffect(() => {
    if (!selectedFile || !mediaRef.current) return;

    const url = URL.createObjectURL(selectedFile);
    
    if (selectedFile.type.startsWith('video/')) {
      const video = mediaRef.current as HTMLVideoElement;
      video.src = url;
      video.onloadedmetadata = () => {
        videoDurationRef.current = video.duration;
      };
    } else {
      const img = mediaRef.current as HTMLImageElement;
      img.src = url;
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  // Draw analysis results on canvas
  useEffect(() => {
    if (!canvasRef.current || !mediaRef.current || analysisResults.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the current frame from media
      if (selectedFile?.type.startsWith('video/')) {
        const video = mediaRef.current as HTMLVideoElement;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        const img = mediaRef.current as HTMLImageElement;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      // Draw analysis results (bounding boxes & labels)
      analysisResults.forEach((res) => {
        // Preferred structure: res.faces -> array of detected faces
        const faceArray = (res as any).faces ?? (res as any).all_faces;
        if (Array.isArray(faceArray) && faceArray.length) {
          faceArray.forEach((face: any) => {
            let x:number, y:number, width:number, height:number;
            if (face.boundingBox) {
              ({ x, y, width, height } = face.boundingBox);
            } else if (face.bounding_box) {
              // backend absolute pixel coords
              const b = face.bounding_box;
              x = b.left;
              y = b.top;
              width = b.right - b.left;
              height = b.bottom - b.top;
            } else {
              return;
            }
            // Draw bounding box
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Determine label
            let label = '';
            if (face.emotions && face.emotions.length) {
              const top = [...face.emotions].sort((a: any, b: any) => b.score - a.score)[0];
              label = `${top.label} ${(top.score * 100).toFixed(0)}%`;
            }
            if (label) {
              const textWidth = ctx.measureText(label).width;
              ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
              ctx.fillRect(x, y - 22, textWidth + 10, 20);

              ctx.fillStyle = 'white';
              ctx.font = '13px Arial';
              ctx.fillText(label, x + 5, y - 7);
            }
          });
        } else if (Array.isArray((res as any).bbox)) {
          // Fallback to old structure [x,y,w,h]
          const [x, y, width, height] = (res as any).bbox;
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
        }
      });

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analysisResults, selectedFile]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <FiArrowLeft className="mr-1" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Analyze Your Mental Health</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload an image or video to analyze emotions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Upload and controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Media</h2>
              
              <FileUpload
                onFileSelect={handleFileSelect}
                onClear={handleClear}
                selectedFile={selectedFile}
                isAnalyzing={isAnalyzing}
              />

              {selectedFile && (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Type</span>
                    <span className="font-medium">
                      {selectedFile.type.split('/')[0].charAt(0).toUpperCase() + selectedFile.type.split('/')[0].slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Size</span>
                    <span className="font-medium">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <button
                  type="button"
                  onClick={analyzeMedia}
                  disabled={!selectedFile || isAnalyzing}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    !selectedFile || isAnalyzing
                      ? 'bg-indigo-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Analyzing...
                    </>
                  ) : (
                    'Get Checked..?'
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start">
                  <FiAlertCircle className="flex-shrink-0 h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              )}

              {isAnalyzing && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {analysisResults.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Analysis Results</h2>
                <div className="space-y-3">
                  {analysisResults.map((result, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{result.emotion}</span>
                        <span className="text-sm text-gray-600">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      {result.timestamp && (
                        <div className="mt-1 text-xs text-gray-500">
                          {new Date(parseFloat(result.timestamp) * 1000).toISOString().substr(11, 8)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Media preview */}
          <div className="lg:col-span-2">
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="relative pt-[56.25%] bg-black">
                {selectedFile ? (
                  <>
                    {selectedFile.type.startsWith('video/') ? (
                      <video
                        ref={el => {
                          if (el) mediaRef.current = el;
                        }}
                        className="absolute inset-0 w-full h-full object-contain"
                        controls={!isAnalyzing}
                        muted
                      />
                    ) : (
                      <img
                        ref={el => {
                          if (el) mediaRef.current = el;
                        }}
                        src=""
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-contain"
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (canvasRef.current) {
                            canvasRef.current.width = img.naturalWidth;
                            canvasRef.current.height = img.naturalHeight;
                          }
                        }}
                      />
                    )}
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      style={{ display: 'block' }}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
