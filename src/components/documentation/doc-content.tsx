'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Copy, 
  Check, 
  Play, 
  Code, 
  FileText,
  BookOpen, 
  Zap, 
  Video,
  ExternalLink,
  Star,
  Clock,
  User,
  Target,
  ArrowRight
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  level: 'beginner' | 'intermediate' | 'advanced';
  timeEstimate: string;
  content: DocContent[];
  tags: string[];
}

interface DocContent {
  id: string;
  type: 'text' | 'code' | 'video' | 'interactive' | 'api' | 'tutorial';
  title: string;
  content: string;
  code?: string;
  language?: string;
  videoUrl?: string;
  apiEndpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  steps?: string[];
}

interface DocContentProps {
  sections: DocSection[];
  activeSection: string;
  userProgress: Record<string, number>;
  onProgressUpdate: (sectionId: string, progress: number) => void;
  onContentComplete: (sectionId: string, contentId: string) => void;
}

export default function DocContent({
  sections,
  activeSection,
  userProgress,
  onProgressUpdate,
  onContentComplete
}: DocContentProps) {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [completedContent, setCompletedContent] = useState<Set<string>>(new Set());

  const copyToClipboard = useCallback(async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      toast({
        title: 'Code Copied',
        description: 'Code has been copied to your clipboard.',
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy code to clipboard.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleContentComplete = useCallback((sectionId: string, contentId: string, contentIndex: number, totalContent: number) => {
    setCompletedContent(prev => new Set([...prev, contentId]));
    onContentComplete(sectionId, contentId);
    
    // Update progress
    const newProgress = Math.min(100, ((contentIndex + 1) / totalContent) * 100);
    onProgressUpdate(sectionId, newProgress);
    
    toast({
      title: 'Content Completed',
      description: 'Great job! You\'re making progress.',
    });
  }, [onContentComplete, onProgressUpdate, toast]);

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'tutorial': return Play;
      case 'api': return Code;
      case 'video': return Video;
      case 'interactive': return Zap;
      default: return FileText;
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-300';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const activeSectionData = sections.find(section => section.id === activeSection);

  if (!activeSectionData) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Select a Documentation Section
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a section from the sidebar to view its content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <activeSectionData.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{activeSectionData.title}</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {activeSectionData.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getLevelBadgeColor(activeSectionData.level)}>
                {activeSectionData.level}
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{activeSectionData.timeEstimate}</span>
              </Badge>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Section Progress</span>
              <span>{userProgress[activeSectionData.id] || 0}%</span>
            </div>
            <Progress value={userProgress[activeSectionData.id] || 0} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {activeSectionData.content.map((content, index) => (
            <div
              key={content.id}
              className={`border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-all duration-300 ${
                completedContent.has(content.id) ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    {React.createElement(getContentTypeIcon(content.type), {
                      className: "w-4 h-4 text-blue-600 dark:text-blue-400"
                    })}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {content.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {content.type}
                      </Badge>
                      {completedContent.has(content.id) && (
                        <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {index + 1} of {activeSectionData.content.length}
                  </span>
                </div>
              </div>
              
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {content.content}
                </p>
                
                {/* Tutorial Steps */}
                {content.steps && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Steps:</span>
                    </h4>
                    <ol className="space-y-3">
                      {content.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start space-x-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-medium flex-shrink-0">
                            {stepIndex + 1}
                          </div>
                          <span className="text-gray-600 dark:text-gray-400">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {/* Code Examples */}
                {content.code && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <Code className="w-4 h-4" />
                        <span>Code Example</span>
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(content.code!, content.id)}
                        className="flex items-center space-x-2"
                      >
                        {copiedCode === content.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span>Copy</span>
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code className={`language-${content.language || 'javascript'}`}>
                        {content.code}
                      </code>
                    </pre>
                  </div>
                )}
                
                {/* API Endpoint Info */}
                {content.apiEndpoint && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Code className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        API Endpoint
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getMethodBadgeColor(content.method || 'GET')}>
                        {content.method || 'GET'}
                      </Badge>
                      <code className="text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                        {content.apiEndpoint}
                      </code>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Button
                    size="sm"
                    onClick={() => handleContentComplete(
                      activeSectionData.id, 
                      content.id, 
                      index, 
                      activeSectionData.content.length
                    )}
                    className="flex items-center space-x-2"
                    disabled={completedContent.has(content.id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {completedContent.has(content.id) ? 'Completed' : 'Mark as Complete'}
                    </span>
                  </Button>
                  
                  {content.videoUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Watch Video</span>
                    </Button>
                  )}
                  
                  {content.apiEndpoint && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Try API</span>
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Star className="w-4 h-4" />
                  <span>Rate this content</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
