'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Shield, Mail, ArrowRight } from 'lucide-react';

interface VerificationSuccessLoaderProps {
  email: string;
  duration?: number;
}

export default function VerificationSuccessLoader({ 
  email,
  duration = 3000 
}: VerificationSuccessLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Email Verified',
      description: 'Your email address has been confirmed',
      icon: Mail,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Account Activated',
      description: 'Your account is now fully activated',
      icon: Shield,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Redirecting',
      description: 'Taking you to your dashboard',
      icon: ArrowRight,
      color: 'from-purple-500 to-purple-600'
    }
  ];

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

  // Step progression
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, duration / steps.length);

    return () => clearInterval(stepInterval);
  }, [duration]);

  const currentStepData = steps[currentStep];
  const CurrentIcon = currentStepData.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Success-themed Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-green-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center max-w-lg mx-auto px-6">
        {/* Success Logo */}
        <div className="mb-10">
          <div className="relative">
            {/* Success Glow Ring */}
            <div className="absolute inset-0 w-28 h-28 mx-auto">
              <div className="w-full h-full border-2 border-green-400/30 rounded-full animate-ping" />
            </div>
            
            {/* Main Success Icon */}
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6 relative overflow-hidden">
              <CheckCircle className="w-14 h-14 text-white" />
              
              {/* Success Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
            
            {/* Rotating Success Ring */}
            <div className="absolute inset-0 w-24 h-24 mx-auto">
              <div className="w-full h-full border-4 border-transparent border-t-green-500 border-r-blue-500 rounded-3xl animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Welcome to VulnScope!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Your account has been successfully verified
          </p>
        </div>

        {/* Success Stage Card */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl p-10 shadow-2xl border border-white/40 dark:border-gray-700/50">
          {/* Current Step Icon */}
          <div className="mb-8">
            <div className="relative">
              <div className={`w-20 h-20 bg-gradient-to-r ${currentStepData.color} rounded-3xl flex items-center justify-center mx-auto shadow-xl animate-scale-in relative overflow-hidden`}>
                <CurrentIcon className="w-10 h-10 text-white relative z-10" />
                
                {/* Step Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
              
              {/* Step Glow */}
              <div className={`absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r ${currentStepData.color} rounded-3xl blur-lg opacity-50 animate-pulse`} />
            </div>
          </div>

          {/* Step Title and Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 animate-fade-in">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base animate-fade-in">
              {currentStepData.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Progress Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-3">
              <span>Setup Progress</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-3 mb-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    index <= currentStep 
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 shadow-lg' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                {index === currentStep && (
                  <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-ping" />
                )}
              </div>
            ))}
          </div>

          {/* User Email Display */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center space-x-3">
              <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Verified: {email}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Account Verified</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Secure • Verified • Ready to Go
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
