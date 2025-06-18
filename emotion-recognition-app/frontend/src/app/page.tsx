'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCamera, FiVideo, FiBarChart2, FiClock, FiArrowRight, FiZap, FiTrendingUp, FiUsers, FiAward } from 'react-icons/fi';
import AppLayout from '@/components/layout/AppLayout';

const features = [
  {
    name: 'Real-time Analysis',
    description: 'Get instant emotion recognition from your webcam feed with low latency processing.',
    icon: FiCamera,
    href: '/live',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBg: 'hover:bg-blue-100',
  },
  {
    name: 'Video Processing',
    description: 'Upload and analyze recorded videos to detect emotions at different timestamps.',
    icon: FiVideo,
    href: '/recordings',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    hoverBg: 'hover:bg-purple-100',
  },
  {
    name: 'Detailed Analytics',
    description: 'View comprehensive reports and insights about detected emotions over time.',
    icon: FiBarChart2,
    href: '/analytics',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    hoverBg: 'hover:bg-emerald-100',
  },
  {
    name: 'Emotion History',
    description: 'Track and review historical emotion data with interactive visualizations.',
    icon: FiClock,
    href: '/history',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    hoverBg: 'hover:bg-amber-100',
  },
];

const stats = [
  { name: 'Emotions Detected', value: '8+', icon: FiZap },
  { name: 'Processing Speed', value: 'Real-time', icon: FiTrendingUp },
  { name: 'Accuracy', value: '98%', icon: FiAward },
  { name: 'Active Users', value: '1K+', icon: FiUsers },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <FiCamera className="h-10 w-10 text-white" />
            </motion.div>
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-6 text-gray-600"
            >
              Loading your experience...
            </motion.div>
          </div>
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.div 
                variants={fadeIn}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-blue-100 backdrop-blur-sm mb-6"
              >
                <span className="h-2 w-2 rounded-full bg-blue-400 mr-2"></span>
                Emotion Recognition AI Platform
              </motion.div>
              
              <motion.h1 
                variants={fadeIn}
                className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100"
              >
                Understand Emotions <br />
                <span className="text-blue-300">Through AI</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeIn}
                className="mt-6 max-w-2xl mx-auto text-xl text-blue-100"
              >
                Real-time facial emotion recognition for mental health insights, customer experience, and human-computer interaction.
              </motion.p>
              
              <motion.div 
                variants={fadeIn}
                className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
              >
                <button
                  onClick={() => router.push('/live')}
                  className="group relative inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FiCamera className="-ml-1 mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Start Live Analysis
                </button>
                <button
                  onClick={() => router.push('/recordings')}
                  className="group relative inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg text-white bg-transparent border-2 border-white/20 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30 transition-all duration-200"
                >
                  <FiVideo className="-ml-1 mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Analyze Recording
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="flex flex-col">
                <dt className="order-2 mt-2 text-lg font-medium text-gray-500">{stat.name}</dt>
                <dd className="order-1 text-3xl font-extrabold text-indigo-600">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              A better way to understand emotions
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our platform provides powerful tools for emotion recognition and analysis.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <motion.div 
                  key={feature.name}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative"
                >
                  <div 
                    onClick={() => router.push(feature.href)}
                    className="h-full bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className={`rounded-md p-3 inline-flex items-center justify-center ${feature.bgColor} ${feature.color} mb-4`}>
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.name}</h3>
                    <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                    <div className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Learn more <FiArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block">Start your free trial today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            No credit card required. Cancel anytime.
          </p>
          <button
            onClick={() => router.push('/live')}
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
          >
            Get started
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
