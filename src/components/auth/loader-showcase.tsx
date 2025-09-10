'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AuthLoader from './auth-loader';
import EnhancedAuthLoader from './enhanced-auth-loader';
import ParticleAuthLoader from './particle-auth-loader';
import VerificationSuccessLoader from './verification-success-loader';
import { Play, Zap, Star, Shield } from 'lucide-react';

type LoaderType = 'basic' | 'enhanced' | 'particle' | 'verification' | null;

export default function LoaderShowcase() {
  const [activeLoader, setActiveLoader] = useState<LoaderType>(null);
  const [demoEmail] = useState('user@example.com');

  const loaders = [
    {
      id: 'basic' as const,
      title: 'Basic Enhanced Loader',
      description: 'Multi-stage progression with branded design',
      features: ['Progress bar', 'Stage indicators', 'Brand colors', 'Feature preview'],
      icon: Shield,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'enhanced' as const,
      title: 'Enhanced Loader',
      description: 'Advanced animations with shimmer effects',
      features: ['Shimmer effects', 'Multiple glow layers', 'Enhanced animations', 'Feature highlights'],
      icon: Zap,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'particle' as const,
      title: 'Particle Loader',
      description: 'Ultra-advanced with particle physics system',
      features: ['Particle physics', 'Real-time generation', 'Advanced effects', 'Performance optimized'],
      icon: Star,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'verification' as const,
      title: 'Verification Success',
      description: 'Specialized loader for email verification',
      features: ['Success theme', 'Email confirmation', 'Celebration effects', 'Multi-step progression'],
      icon: Shield,
      color: 'from-green-500 to-blue-600'
    }
  ];

  const renderLoader = () => {
    switch (activeLoader) {
      case 'basic':
        return <AuthLoader duration={4000} />;
      case 'enhanced':
        return <EnhancedAuthLoader duration={4000} showFeatures={true} />;
      case 'particle':
        return <ParticleAuthLoader duration={4000} showParticles={true} />;
      case 'verification':
        return <VerificationSuccessLoader email={demoEmail} duration={4000} />;
      default:
        return null;
    }
  };

  if (activeLoader) {
    return (
      <div className="relative">
        {renderLoader()}
        <div className="absolute top-4 right-4 z-50">
          <Button
            onClick={() => setActiveLoader(null)}
            variant="outline"
            className="bg-white/90 backdrop-blur-sm"
          >
            Back to Showcase
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            VulnScope Loader Showcase
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Experience the enhanced authentication loaders designed to create engaging transitions 
            from authentication to dashboard. Each loader offers unique features and animations.
          </p>
        </div>

        {/* Loader Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loaders.map((loader) => {
            const Icon = loader.icon;
            return (
              <Card key={loader.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${loader.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        {loader.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        {loader.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {loader.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Demo Button */}
                  <Button
                    onClick={() => setActiveLoader(loader.id)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Demo {loader.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Implementation Info */}
        <div className="mt-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/30">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Implementation Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Features:</h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Multi-stage loading progression</li>
                <li>• Branded with VulnScope colors</li>
                <li>• Smooth animations and transitions</li>
                <li>• Progress indication with percentages</li>
                <li>• Feature highlights during loading</li>
                <li>• Dark mode support</li>
                <li>• Accessibility compliant</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Performance:</h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• 60fps smooth animations</li>
                <li>• Optimized particle system</li>
                <li>• Memory efficient rendering</li>
                <li>• Reduced motion support</li>
                <li>• Mobile responsive design</li>
                <li>• Canvas-based effects</li>
                <li>• CSS transform optimizations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click on any loader above to see it in action. Each demo runs for 4 seconds to showcase the full experience.
          </p>
        </div>
      </div>
    </div>
  );
}
