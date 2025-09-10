'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, Database, Zap, Globe, Lock, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

interface EnhancedAuthLoaderProps {
  message?: string;
  stage?: 'authenticating' | 'loading' | 'redirecting' | 'complete';
  duration?: number;
  showFeatures?: boolean;
}

interface LoadingStage {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  duration: number;
  color: string;
  features: string[];
}

const loadingStages: LoadingStage[] = [
  {
    id: 'authenticating',
    title: 'Authenticating',
    description: 'Verifying your credentials securely',
    icon: Lock,
    duration: 1200,
    color: 'from-blue-500 to-blue-600',
    features: ['Multi-factor authentication', 'Session encryption', 'Secure token validation']
  },
  {
    id: 'loading',
    title: 'Loading Dashboard',
    description: 'Preparing your security intelligence',
    icon: Database,
    duration: 1800,
    color: 'from-blue-600 to-purple-500',
    features: ['Vulnerability database', 'Threat intelligence feeds', 'Real-time monitoring']
  },
  {
    id: 'redirecting',
    title: 'Almost Ready',
    description: 'Setting up your personalized workspace',
    icon: Zap,
    duration: 1200,
    color: 'from-purple-500 to-purple-600',
    features: ['Custom dashboards', 'Alert configurations', 'User preferences']
  },
  {
    id: 'complete',
    title: 'Welcome Back!',
    description: 'Your security command center is ready',
    icon: CheckCircle,
    duration: 800,
    color: 'from-green-500 to-green-600',
    features: ['Dashboard loaded', 'All systems operational', 'Ready for analysis']
  }
];

export default function EnhancedAuthLoader({ 
  message = "Redirecting to dashboard...", 
  stage = 'authenticating',
  duration = 4000,
  showFeatures = true
}: EnhancedAuthLoaderProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number; speed: number }>>([]);
  const [pulseScale, setPulseScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate enhanced floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.5
    }));
    setParticles(newParticles);
  }, []);

  // Pulse animation for main logo
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.05 : 1);
    }, 2000);

    return () => clearInterval(pulseInterval);
  }, []);

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 0.5;
      });
    }, duration / 200);

    return () => clearInterval(interval);
  }, [duration]);

  // Stage progression
  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStageIndex(prev => {
        if (prev >= loadingStages.length - 1) {
          clearInterval(stageInterval);
          return prev;
        }
        return prev + 1;
      });
    }, duration / loadingStages.length);

    return () => clearInterval(stageInterval);
  }, [duration]);

  const currentStage = loadingStages[currentStageIndex];
  const CurrentIcon = currentStage.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background with Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />

      {/* Enhanced Floating Particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-gradient-to-r from-blue-400/40 to-purple-400/40 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${3 / particle.speed}s`
            }}
          />
        ))}
      </div>

      {/* Enhanced Floating Orbs with Movement */}
      <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-to-r from-blue-400/25 to-purple-400/25 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-purple-400/25 to-pink-400/25 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-gradient-to-r from-blue-400/25 to-cyan-400/25 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '3s' }} />
      <div className="absolute top-3/4 left-1/3 w-24 h-24 bg-gradient-to-r from-green-400/25 to-blue-400/25 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2.5s' }} />

      <div className="relative z-10 text-center max-w-lg mx-auto px-6">
        {/* Enhanced Main Logo with Multiple Animation Layers */}
        <div className="mb-10">
          <div className="relative">
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 w-28 h-28 mx-auto">
              <div className="w-full h-full border-2 border-blue-400/30 rounded-full animate-ping" />
            </div>
            
            {/* Main Logo with Pulse */}
            <div 
              className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-4 relative"
              style={{ transform: `scale(${pulseScale})` }}
            >
              <Shield className="w-12 h-12 text-white" />
              
              {/* Inner Rotating Elements */}
              <div className="absolute inset-2">
                <div className="w-full h-full border-2 border-transparent border-t-white/30 border-r-white/20 rounded-2xl animate-spin" />
              </div>
            </div>
            
            {/* Rotating Ring */}
            <div className="absolute inset-0 w-24 h-24 mx-auto">
              <div className="w-full h-full border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-3xl animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 animate-fade-in">
            VulnScope
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Advanced Security Intelligence Platform
          </p>
        </div>

        {/* Enhanced Loading Stage Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl p-10 shadow-2xl border border-white/30 dark:border-gray-700/40">
          {/* Current Stage Icon with Enhanced Animation */}
          <div className="mb-8">
            <div className="relative">
              <div className={`w-20 h-20 bg-gradient-to-r ${currentStage.color} rounded-3xl flex items-center justify-center mx-auto shadow-xl animate-scale-in relative overflow-hidden`}>
                <CurrentIcon className="w-10 h-10 text-white relative z-10" />
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              
              {/* Icon Glow */}
              <div className={`absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r ${currentStage.color} rounded-3xl blur-lg opacity-50 animate-pulse`} />
            </div>
          </div>

          {/* Stage Title and Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 animate-fade-in">
              {currentStage.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base animate-fade-in">
              {currentStage.description}
            </p>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Progress Bar Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-3">
              <span>Loading Progress</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Enhanced Stage Indicators */}
          <div className="flex justify-center space-x-3 mb-8">
            {loadingStages.map((stage, index) => (
              <div key={stage.id} className="relative">
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    index <= currentStageIndex 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                {index === currentStageIndex && (
                  <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping" />
                )}
              </div>
            ))}
          </div>

          {/* Feature Highlights */}
          {showFeatures && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Loading Features:
              </h3>
              {currentStage.features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Security Features Preview */}
        <div className="mt-10 grid grid-cols-3 gap-6 text-center">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/40 hover:scale-105 transition-transform duration-300">
            <Globe className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Threat Intel</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Global monitoring</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/40 hover:scale-105 transition-transform duration-300">
            <Database className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vulnerabilities</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Real-time database</p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/40 hover:scale-105 transition-transform duration-300">
            <Activity className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Analytics</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Advanced insights</p>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="mt-10 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enterprise Security</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure • Reliable • Professional • Trusted by Security Teams Worldwide
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
