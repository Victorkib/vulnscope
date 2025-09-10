'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Clock, Star, Code, Play, FileText, Zap } from 'lucide-react';

interface SearchResult {
  sectionId: string;
  contentId: string;
  title: string;
  content: string;
  type: string;
  level: string;
  score: number;
}

interface DocSearchProps {
  onResultClick: (sectionId: string, contentId: string) => void;
  onSearchChange: (query: string) => void;
  searchResults: SearchResult[];
  isSearching?: boolean;
}

export default function DocSearch({ 
  onResultClick, 
  onSearchChange, 
  searchResults, 
  isSearching = false 
}: DocSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    onSearchChange(value);
    setIsOpen(value.length > 0);
  }, [onSearchChange]);

  const clearSearch = useCallback(() => {
    setQuery('');
    onSearchChange('');
    setIsOpen(false);
  }, [onSearchChange]);

  const handleResultClick = useCallback((result: SearchResult) => {
    onResultClick(result.sectionId, result.contentId);
    clearSearch();
  }, [onResultClick, clearSearch]);

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'tutorial': return Play;
      case 'api': return Code;
      case 'video': return Play;
      case 'interactive': return Zap;
      default: return FileText;
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.doc-search-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative doc-search-container">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search documentation..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-12 pr-12 py-3 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {React.createElement(getContentTypeIcon(result.type), {
                          className: "w-4 h-4 text-blue-500"
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {result.content}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={`text-xs ${getLevelBadgeColor(result.level)}`}>
                            {result.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                          {result.score > 1 && (
                            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                              <Star className="w-3 h-3 mr-1" />
                              Best Match
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try different keywords or check spelling</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
