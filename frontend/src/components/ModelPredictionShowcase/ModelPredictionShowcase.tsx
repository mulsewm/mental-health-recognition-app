'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FiDownload, FiInfo } from 'react-icons/fi';

type Prediction = {
  emotion: string;
  confidence: number;
  image: string;
  description: string;
};

const samplePredictions: Prediction[] = [
  {
    emotion: 'Happiness',
    confidence: 0.92,
    image: '/images/screenshots/happy-webcam.png',
    description: 'The model detected a clear smile with raised cheeks and crow\'s feet around the eyes, indicating genuine happiness.'
  },
  {
    emotion: 'Neutral',
    confidence: 0.85,
    image: '/images/screenshots/live-webcam.png',
    description: 'The model detected a neutral expression with relaxed facial muscles and no strong emotional indicators.'
  },
  {
    emotion: 'Surprise',
    confidence: 0.78,
    image: '/images/screenshots/analyze-page.png',
    description: 'The model detected raised eyebrows and widened eyes, indicating a surprised expression.'
  },
  {
    emotion: 'Sadness',
    confidence: 0.82,
    image: '/images/screenshots/analyze-page.png',
    description: 'The model detected a slight frown and drooping eyelids, indicating a sad expression.'
  }
];

export function ModelPredictionShowcase() {
  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happiness: 'from-green-400 to-emerald-600',
      neutral: 'from-blue-400 to-indigo-600',
      sadness: 'from-blue-400 to-indigo-600',
      surprise: 'from-yellow-400 to-amber-600',
      fear: 'from-purple-400 to-violet-600',
      disgust: 'from-lime-400 to-green-600',
      anger: 'from-red-400 to-rose-600',
    };
    return colors[emotion.toLowerCase()] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <motion.h2 
          className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Model Predictions Showcase
        </motion.h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explore how our emotion detection model analyzes different facial expressions with high accuracy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {samplePredictions.map((prediction, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="h-full"
          >
            <Card className="h-full overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <div className="relative h-72 w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent z-10" />
                <div className="absolute inset-0 flex items-end p-6 z-20">
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-white drop-shadow-lg">
                        {prediction.emotion}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-white bg-black/40 backdrop-blur-sm border border-white/10">
                        {(prediction.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getEmotionColor(prediction.emotion)}`}
                        style={{ width: `${prediction.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 z-20">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full w-8 h-8 bg-black/40 backdrop-blur-sm border-white/20 hover:bg-white/20"
                    title="View details"
                  >
                    <FiInfo className="w-4 h-4 text-white" />
                  </Button>
                </div>
                <Image
                  src={prediction.image}
                  alt={`${prediction.emotion} expression`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority={index < 2}
                />
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {prediction.emotion} Expression Analysis
                    </h3>
                    <p className="text-muted-foreground">
                      {prediction.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confidence Level</span>
                      <span className="font-medium">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getEmotionColor(prediction.emotion)}`}
                        style={{ width: `${prediction.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <FiDownload className="mr-2 h-4 w-4" />
                      Download Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-muted-foreground text-sm">
          These are sample predictions. Actual results may vary based on lighting, image quality, and facial orientation.
        </p>
      </div>
    </div>
  );
}
