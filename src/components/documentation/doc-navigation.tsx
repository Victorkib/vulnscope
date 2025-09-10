'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown, 
  ChevronRight, 
  Menu, 
  Clock, 
  Star,
  Play,
  Code,
  FileText,
  Zap,
  Video,
  BookOpen
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

interface DocNavigationProps {
  sections: DocSection[];
  activeSection: string;
  expandedSections: Set<string>;
  userProgress: Record<string, number>;
  onSectionClick: (sectionId: string) => void;
  onToggleSection: (sectionId: string) => void;
  onContentClick: (sectionId: string, contentId: string) => void;
}

export default function DocNavigation({
  sections,
  activeSection,
  expandedSections,
  userProgress,
  onSectionClick,
  onToggleSection,
  onContentClick
}: DocNavigationProps) {
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

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="sticky top-8">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Menu className="w-5 h-5 text-blue-600" />
            <span>Documentation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.map((section) => (
            <Collapsible
              key={section.id}
              open={expandedSections.has(section.id)}
              onOpenChange={() => onToggleSection(section.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-between p-3 h-auto ${
                    activeSection === section.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => onSectionClick(section.id)}
                >
                  <div className="flex items-center space-x-3">
                    <section.icon className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{section.timeEstimate}</span>
                      </div>
                    </div>
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-1 ml-8">
                {/* Progress Bar */}
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{userProgress[section.id] || 0}%</span>
                  </div>
                  <Progress 
                    value={userProgress[section.id] || 0} 
                    className="h-1"
                  />
                </div>
                
                {/* Content Items */}
                {section.content.map((content, index) => (
                  <Button
                    key={content.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm h-auto p-2"
                    onClick={() => onContentClick(section.id, content.id)}
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <div className="flex items-center justify-center w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                        {index + 1}
                      </div>
                      {React.createElement(getContentTypeIcon(content.type), {
                        className: "w-4 h-4 text-gray-500 flex-shrink-0"
                      })}
                      <span className="truncate text-left">{content.title}</span>
                    </div>
                  </Button>
                ))}
                
                {/* Section Tags */}
                {section.tags.length > 0 && (
                  <div className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {section.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {section.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{section.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
