'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, CheckCircle, Database, Zap, Globe, Lock, Activity, TrendingUp, AlertTriangle, Star } from 'lucide-react';

interface ParticleAuthLoaderProps {
  message?: string;
  stage?: 'authenticating' | 'loading' | 'redirecting' | 'complete';
  duration?: number;
  showParticles?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

interface LoadingStage {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  duration: number;
  color: string;
  features: string[];
  particleColor: string;
}

const loadingStages: LoadingStage[] = [
  {
    id: 'authenticating',
    title: 'Authenticating',
    description: 'Verifying your credentials with advanced security protocols',
    icon: Lock,
    duration: 1200,
    color: 'from-blue-500 to-blue-600',
    features: ['Multi-factor authentication', 'Session encryption', 'Secure token validation'],
    particleColor: '#3B82F6'
  },
  {
    id: 'loading',
    title: 'Loading Dashboard',
    description: 'Preparing your comprehensive security intelligence suite',
    icon: Database,
    duration: 1800,
    color: 'from-blue-600 to-purple-500',
    features: ['Vulnerability database', 'Threat intelligence feeds', 'Real-time monitoring'],
    particleColor: '#8B5CF6'
  },
  {
    id: 'redirecting',
    title: 'Almost Ready',
    description: 'Configuring your personalized security workspace',
    icon: Zap,
    duration: 1200,
    color: 'from-purple-500 to-purple-600',
    features: ['Custom dashboards', 'Alert configurations', 'User preferences'],
    particleColor: '#A855F7'
  },
  {
    id: 'complete',
    title: 'Welcome Back!',
    description: 'Your security command center is fully operational',
    icon: CheckCircle,
    duration: 800,
    color: 'from-green-500 to-green-600',
    features: ['Dashboard loaded', 'All systems operational', 'Ready for analysis'],
    particleColor: '#10B981'
  }
];

export default function ParticleAuthLoader({ 
  message = "Redirecting to dashboard...", 
  stage = 'authenticating',
  duration = 4000,
  showParticles = true
}: ParticleAuthLoaderProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [pulseScale, setPulseScale] = useState(1);
  const [logoRotation, setLogoRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  // Create particle
  const createParticle = useCallback((x: number, y: number, color: string): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    return {
      id: Math.random(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.8 + 0.2,
      color,
      life: 0,
      maxLife: Math.random() * 100 + 50
    };
  }, []);

  // Initialize particles
  useEffect(() => {
    if (!showParticles) return;
    
    const initialParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const colors = ['#3B82F6', '#8B5CF6', '#A855F7', '#10B981'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      initialParticles.push(createParticle(x, y, color));
    }
    setParticles(initialParticles);
  }, [showParticles, createParticle]);

  // Particle animation loop
  useEffect(() => {
    if (!showParticles) return;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      setParticles(prevParticles => {
        return prevParticles.map(particle => {
          let newParticle = { ...particle };
          
          // Update position
          newParticle.x += newParticle.vx * (deltaTime / 16);
          newParticle.y += newParticle.vy * (deltaTime / 16);
          
          // Update life
          newParticle.life += deltaTime / 16;
          
          // Fade out over time
          newParticle.opacity = Math.max(0, 1 - (newParticle.life / newParticle.maxLife));
          
          // Bounce off edges
          if (newParticle.x < 0 || newParticle.x > window.innerWidth) {
            newParticle.vx *= -1;
          }
          if (newParticle.y < 0 || newParticle.y > window.innerHeight) {
            newParticle.vy *= -1;
          }
          
          // Keep particles in bounds
          newParticle.x = Math.max(0, Math.min(window.innerWidth, newParticle.x));
          newParticle.y = Math.max(0, Math.min(window.innerHeight, newParticle.y));
          
          return newParticle;
        }).filter(particle => particle.opacity > 0);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showParticles]);

  // Add new particles based on current stage
  useEffect(() => {
    if (!showParticles) return;
    
    const currentStage = loadingStages[currentStageIndex];
    const interval = setInterval(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const newParticle = createParticle(x, y, currentStage.particleColor);
      
      setParticles(prev => [...prev, newParticle]);
    }, 100);

    return () => clearInterval(interval);
  }, [currentStageIndex, showParticles, createParticle]);

  // Pulse animation for main logo
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.08 : 1);
    }, 2500);

    return () => clearInterval(pulseInterval);
  }, []);

  // Logo rotation animation
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setLogoRotation(prev => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(rotationInterval);
  }, []);

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 0.3;
      });
    }, duration / 300);

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
      {/* Particle Canvas */}
      {showParticles && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ background: 'transparent' }}
        />
      )}

      {/* Render particles */}
      {showParticles && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: `scale(${particle.opacity})`,
            transition: 'opacity 0.1s ease-out'
          }}
        />
      ))}

      {/* Enhanced Floating Orbs with Complex Movement */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-36 h-36 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      <div className="absolute top-3/4 left-1/3 w-32 h-32 bg-gradient-to-r from-green-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/6 right-1/6 w-20 h-20 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
        {/* Ultra-Enhanced Main Logo */}
        <div className="mb-12">
          <div className="relative">
            {/* Multiple Glow Rings */}
            <div className="absolute inset-0 w-32 h-32 mx-auto">
              <div className="w-full h-full border-2 border-blue-400/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            </div>
            <div className="absolute inset-0 w-28 h-28 mx-auto">
              <div className="w-full h-full border-2 border-purple-400/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            </div>
            
            {/* Main Logo with Advanced Animations */}
            <div 
              className="w-28 h-28 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6 relative overflow-hidden"
              style={{ 
                transform: `scale(${pulseScale}) rotate(${logoRotation * 0.1}deg)`,
                transition: 'transform 0.3s ease-out'
              }}
            >
              <Shield className="w-14 h-14 text-white relative z-10" />
              
              {/* Multiple Rotating Elements */}
              <div className="absolute inset-3">
                <div className="w-full h-full border-2 border-transparent border-t-white/40 border-r-white/30 rounded-2xl animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div className="absolute inset-1">
                <div className="w-full h-full border-2 border-transparent border-b-white/20 border-l-white/10 rounded-2xl animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
              </div>
              
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
            
            {/* Outer Rotating Ring */}
            <div className="absolute inset-0 w-28 h-28 mx-auto">
              <div className="w-full h-full border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-3xl animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 animate-fade-in">
            VulnScope
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Next-Generation Security Intelligence Platform
          </p>
        </div>

        {/* Ultra-Enhanced Loading Stage Card */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/40 dark:border-gray-700/50">
          {/* Current Stage Icon with Ultra-Enhanced Animation */}
          <div className="mb-10">
            <div className="relative">
              <div className={`w-24 h-24 bg-gradient-to-r ${currentStage.color} rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-scale-in relative overflow-hidden`}>
                <CurrentIcon className="w-12 h-12 text-white relative z-10" />
                
                {/* Multiple Shimmer Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-shimmer" style={{ animationDelay: '1s' }} />
              </div>
              
              {/* Icon Glow with Multiple Layers */}
              <div className={`absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-r ${currentStage.color} rounded-3xl blur-xl opacity-60 animate-pulse`} />
              <div className={`absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-r ${currentStage.color} rounded-3xl blur-2xl opacity-30 animate-pulse`} style={{ animationDelay: '0.5s' }} />
            </div>
          </div>

          {/* Stage Title and Description */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 animate-fade-in">
              {currentStage.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg animate-fade-in">
              {currentStage.description}
            </p>
          </div>

          {/* Ultra-Enhanced Progress Bar */}
          <div className="mb-10">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Multiple Progress Bar Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-shimmer" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
            <div className="flex justify-between text-base text-gray-500 dark:text-gray-400 mt-4">
              <span className="font-medium">Loading Progress</span>
              <span className="font-bold text-lg">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Ultra-Enhanced Stage Indicators */}
          <div className="flex justify-center space-x-4 mb-10">
            {loadingStages.map((stage, index) => (
              <div key={stage.id} className="relative">
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-700 ${
                    index <= currentStageIndex 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg scale-110' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                {index === currentStageIndex && (
                  <div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping" />
                )}
                {index < currentStageIndex && (
                  <div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>

          {/* Enhanced Feature Highlights */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-6">
              Loading Advanced Features:
            </h3>
            {currentStage.features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center space-x-4 text-base text-gray-600 dark:text-gray-400 animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ultra-Enhanced Security Features Preview */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-white/40 dark:border-gray-700/50 hover:scale-110 transition-all duration-500 hover:shadow-xl">
            <Globe className="w-10 h-10 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Threat Intel</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Global monitoring</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-white/40 dark:border-gray-700/50 hover:scale-110 transition-all duration-500 hover:shadow-xl">
            <Database className="w-10 h-10 text-purple-500 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Vulnerabilities</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Real-time database</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-white/40 dark:border-gray-700/50 hover:scale-110 transition-all duration-500 hover:shadow-xl">
            <Activity className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Analytics</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Advanced insights</p>
          </div>
        </div>

        {/* Ultra-Enhanced Footer */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Enterprise Security</span>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
