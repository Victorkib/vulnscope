'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, Database, Zap, Globe, Lock } from 'lucide-react';

interface AuthLoaderProps {
  message?: string;
  stage?: 'authenticating' | 'loading' | 'redirecting' | 'complete';
  duration?: number;
}

interface LoadingStage {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  duration: number;
  color: string;
}

const loadingStages: LoadingStage[] = [
  {
    id: 'authenticating',
    title: 'Authenticating',
    description: 'Verifying your credentials',
    icon: Lock,
    duration: 1000,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'loading',
    title: 'Loading Dashboard',
    description: 'Preparing your security overview',
    icon: Database,
    duration: 1500,
    color: 'from-blue-600 to-purple-500'
  },
  {
    id: 'redirecting',
    title: 'Almost Ready',
    description: 'Setting up your workspace',
    icon: Zap,
    duration: 1000,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'complete',
    title: 'Welcome Back!',
    description: 'Your dashboard is ready',
    icon: CheckCircle,
    duration: 500,
    color: 'from-green-500 to-green-600'
  }
];

export default function AuthLoader({ 
  message = "Redirecting to dashboard...", 
  stage = 'authenticating',
  duration = 3000 
}: AuthLoaderProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, duration / 100);

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
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Main Logo with Animation */}
        <div className="mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-4 animate-pulse">
              <Shield className="w-12 h-12 text-white" />
            </div>
            {/* Rotating Ring */}
            <div className="absolute inset-0 w-24 h-24 mx-auto">
              <div className="w-full h-full border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-3xl animate-spin" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            VulnScope
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Security Intelligence Platform
          </p>
        </div>

        {/* Loading Stage Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/30">
          {/* Current Stage Icon */}
          <div className="mb-6">
            <div className={`w-16 h-16 bg-gradient-to-r ${currentStage.color} rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-scale-in`}>
              <CurrentIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Stage Title and Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 animate-fade-in">
              {currentStage.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm animate-fade-in">
              {currentStage.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
          </div>

          {/* Stage Indicators */}
          <div className="flex justify-center space-x-2">
            {loadingStages.map((stage, index) => (
              <div
                key={stage.id}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStageIndex 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Security Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
            <Globe className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Threat Intel</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
            <Database className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Vulnerabilities</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/30">
            <Zap className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Analytics</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure • Reliable • Professional
          </p>
        </div>
      </div>
    </div>
  );
}
