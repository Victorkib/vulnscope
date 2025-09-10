'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { usePreferences } from '@/contexts/preferences-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  Play,
  Code,
  Clock,
} from 'lucide-react';

// Import documentation components and data
import DocSearch from '@/components/documentation/doc-search';
import DocNavigation from '@/components/documentation/doc-navigation';
import DocContent from '@/components/documentation/doc-content';
import { 
  documentationSections, 
  searchDocumentation, 
  getLevelBadgeColor,
  type DocSection,
  type DocContent as DocContentType
} from '@/lib/documentation-data';

interface SearchResult {
  sectionId: string;
  contentId: string;
  title: string;
  content: string;
  type: string;
  level: string;
  score: number;
}

export default function DocumentationPage() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { toast } = useToast();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const [isSearching, setIsSearching] = useState(false);

  // Search functionality
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results = searchDocumentation(query, documentationSections);
    setSearchResults(results);
    setIsSearching(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Handle search result click
  const handleSearchResultClick = useCallback((sectionId: string, contentId: string) => {
    setActiveSection(sectionId);
    setExpandedSections(prev => new Set([...prev, sectionId]));
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Update user progress
  const updateProgress = useCallback((sectionId: string, progress: number) => {
    setUserProgress(prev => ({
      ...prev,
      [sectionId]: Math.max(prev[sectionId] || 0, progress)
    }));
  }, []);

  // Handle content completion
  const handleContentComplete = useCallback((sectionId: string, contentId: string) => {
    // This could be extended to save to backend
    console.log(`Content completed: ${sectionId}/${contentId}`);
  }, []);

  // Handle content click
  const handleContentClick = useCallback((sectionId: string, contentId: string) => {
    setActiveSection(sectionId);
    setExpandedSections(prev => new Set([...prev, sectionId]));
  }, []);

  // Filter sections based on user preferences
  const filteredSections = useMemo(() => {
    return documentationSections.filter(section => {
      // Filter by user level preference if set
      if (preferences?.language === 'en') {
        return true; // Show all sections for English
      }
      return true;
    });
  }, [preferences]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                VulnScope
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Documentation
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                Comprehensive guides, tutorials, and technical reference for the VulnScope vulnerability intelligence platform
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <DocSearch
                  onResultClick={handleSearchResultClick}
                  onSearchChange={setSearchQuery}
                  searchResults={searchResults}
                  isSearching={isSearching}
                />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4 mx-auto">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {documentationSections.length}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">Documentation Sections</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mb-4 mx-auto">
                    <Play className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {documentationSections.reduce((acc, section) => acc + section.content.length, 0)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">Guides & Tutorials</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mb-4 mx-auto">
                    <Code className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">50+</h3>
                  <p className="text-gray-600 dark:text-gray-400">API Endpoints</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg mb-4 mx-auto">
                    <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">2h</h3>
                  <p className="text-gray-600 dark:text-gray-400">Total Learning Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <DocNavigation
                sections={filteredSections}
                activeSection={activeSection}
                expandedSections={expandedSections}
                userProgress={userProgress}
                onSectionClick={setActiveSection}
                onToggleSection={toggleSection}
                onContentClick={handleContentClick}
              />
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <DocContent
                sections={filteredSections}
                activeSection={activeSection}
                userProgress={userProgress}
                onProgressUpdate={updateProgress}
                onContentComplete={handleContentComplete}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
