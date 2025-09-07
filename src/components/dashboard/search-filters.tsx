'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme/theme-provider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  X,
  ChevronDown,
  Download,
  RefreshCw,
  Shield,
  Database,
  Code,
  FileText,
  Settings,
} from 'lucide-react';

interface Filters {
  searchText: string;
  severities: string[];
  cvssRange: [number, number];
  dateRange: { from: Date; to: Date } | undefined;
  affectedSoftware: string[];
  sources: string[];
  exploitAvailable?: boolean;
  patchAvailable?: boolean;
  kev?: boolean;
  trending?: boolean;
  category?: string[];
  tags?: string[];
}

interface SearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onExport: (format: 'json' | 'csv' | 'pdf') => void;
  isLoading?: boolean;
}

const SEVERITY_OPTIONS = [
  {
    value: 'CRITICAL',
    label: 'Critical',
    color: 'bg-red-100 text-red-800 border-red-300',
  },
  {
    value: 'HIGH',
    label: 'High',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  {
    value: 'LOW',
    label: 'Low',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
];

const SOURCE_OPTIONS = [
  { value: 'NVD', label: 'NVD', icon: Database },
  { value: 'GITHUB', label: 'GitHub', icon: Code },
  { value: 'MITRE', label: 'MITRE', icon: Shield },
  { value: 'OSV', label: 'OSV', icon: FileText },
];

const POPULAR_SOFTWARE = [
  'Apache HTTP Server',
  'WordPress',
  'Laravel',
  'Django',
  'React Router',
  'OpenSSL',
  'Node.js',
  'jQuery',
  'Spring Framework',
  'Bootstrap',
  'Docker',
  'Jenkins',
  'MySQL',
  'Nginx',
  'Angular',
];

const CATEGORY_OPTIONS = [
  { value: 'Web Application', label: 'Web Application' },
  { value: 'Operating System', label: 'Operating System' },
  { value: 'Network', label: 'Network' },
  { value: 'Database', label: 'Database' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'IoT', label: 'IoT' },
  { value: 'Cloud', label: 'Cloud' },
  { value: 'Cryptography', label: 'Cryptography' },
];

const TAG_OPTIONS = [
  'RCE', 'XSS', 'SQL Injection', 'CSRF', 'Privilege Escalation',
  'Information Disclosure', 'Denial of Service', 'Code Execution',
  'Authentication Bypass', 'Directory Traversal', 'Buffer Overflow',
  'Memory Corruption', 'Injection', 'Deserialization', 'SSRF'
];

export default function SearchFilters({
  filters,
  onFiltersChange,
  onExport,
  isLoading: _isLoading = false,
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customSoftware, setCustomSoftware] = useState('');
  const { preferences } = useTheme();

  const updateFilters = (key: string, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleSeverity = (severity: string) => {
    const newSeverities = filters.severities.includes(severity)
      ? filters.severities.filter((s) => s !== severity)
      : [...filters.severities, severity];
    updateFilters('severities', newSeverities);
  };

  const toggleSource = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    updateFilters('sources', newSources);
  };

  const toggleSoftware = (software: string) => {
    const newSoftware = filters.affectedSoftware.includes(software)
      ? filters.affectedSoftware.filter((s) => s !== software)
      : [...filters.affectedSoftware, software];
    updateFilters('affectedSoftware', newSoftware);
  };

  const addCustomSoftware = () => {
    if (
      customSoftware.trim() &&
      !filters.affectedSoftware.includes(customSoftware.trim())
    ) {
      updateFilters('affectedSoftware', [
        ...filters.affectedSoftware,
        customSoftware.trim(),
      ]);
      setCustomSoftware('');
    }
  };

  const toggleCategory = (category: string) => {
    const newCategories = (filters.category || []).includes(category)
      ? (filters.category || []).filter((c) => c !== category)
      : [...(filters.category || []), category];
    updateFilters('category', newCategories);
  };

  const toggleTag = (tag: string) => {
    const newTags = (filters.tags || []).includes(tag)
      ? (filters.tags || []).filter((t) => t !== tag)
      : [...(filters.tags || []), tag];
    updateFilters('tags', newTags);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchText: '',
      severities: [],
      cvssRange: [0, 10],
      dateRange: undefined,
      affectedSoftware: [],
      sources: [],
      exploitAvailable: undefined,
      patchAvailable: undefined,
      kev: undefined,
      trending: undefined,
      category: [],
      tags: [],
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchText) count++;
    if (filters.severities.length > 0) count++;
    if (filters.sources.length > 0) count++;
    if (filters.affectedSoftware.length > 0) count++;
    if (filters.cvssRange[0] > 0 || filters.cvssRange[1] < 10) count++;
    if (filters.dateRange) count++;
    if (filters.exploitAvailable !== undefined) count++;
    if (filters.patchAvailable !== undefined) count++;
    if (filters.kev !== undefined) count++;
    if (filters.trending !== undefined) count++;
    if ((filters.category || []).length > 0) count++;
    if ((filters.tags || []).length > 0) count++;
    return count;
  };

  // Apply user preferences for styling
  const getFontSizeClass = () => {
    switch (preferences?.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getHighContrastClass = () => {
    return preferences?.highContrast ? 'border-2 border-white/40' : '';
  };

  return (
    <Card className={`bg-white/5 border-white/10 backdrop-blur-sm ${getHighContrastClass()}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-400" />
            <span>Search & Filters</span>
            {getActiveFilterCount() > 0 && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select
              onValueChange={(format) =>
                onExport(format as 'json' | 'csv' | 'pdf')
              }
            >
              <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                <Download className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={getActiveFilterCount() === 0}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label className="text-white/80">Search Vulnerabilities</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search by CVE ID, title, or description..."
              value={filters.searchText}
              onChange={(e) => updateFilters('searchText', e.target.value)}
              className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 ${getFontSizeClass()}`}
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={
              filters.severities.includes('CRITICAL') ? 'default' : 'outline'
            }
            size="sm"
            onClick={() => toggleSeverity('CRITICAL')}
            className={
              filters.severities.includes('CRITICAL')
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }
          >
            Critical Only
          </Button>
          <Button
            variant={filters.sources.includes('NVD') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleSource('NVD')}
            className={
              filters.sources.includes('NVD')
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }
          >
            NVD Only
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilters('cvssRange', [7, 10])}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            High CVSS (7+)
          </Button>
        </div>

        <Separator className="bg-white/10" />

        {/* Advanced Filters */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-white hover:bg-white/10"
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Advanced Filters</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 mt-4">
            {/* Severity Filter */}
            <div className="space-y-3">
              <Label className="text-white/80 flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Severity Levels</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITY_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`severity-${option.value}`}
                      checked={filters.severities.includes(option.value)}
                      onCheckedChange={() => toggleSeverity(option.value)}
                      className="border-white/20"
                    />
                    <Label
                      htmlFor={`severity-${option.value}`}
                      className="text-white/80 cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* CVSS Score Range */}
            <div className="space-y-3">
              <Label className="text-white/80">
                CVSS Score Range: {filters.cvssRange[0]} -{' '}
                {filters.cvssRange[1]}
              </Label>
              <Slider
                value={filters.cvssRange}
                onValueChange={(value) => updateFilters('cvssRange', value)}
                max={10}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/60">
                <span>0.0 (Low)</span>
                <span>10.0 (Critical)</span>
              </div>
            </div>

            {/* Source Filter */}
            <div className="space-y-3">
              <Label className="text-white/80 flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Data Sources</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {SOURCE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`source-${option.value}`}
                        checked={filters.sources.includes(option.value)}
                        onCheckedChange={() => toggleSource(option.value)}
                        className="border-white/20"
                      />
                      <Label
                        htmlFor={`source-${option.value}`}
                        className="text-white/80 cursor-pointer flex items-center space-x-2"
                      >
                        <Icon className="h-3 w-3" />
                        <span>{option.label}</span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Affected Software */}
            <div className="space-y-3">
              <Label className="text-white/80 flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span>Affected Software</span>
              </Label>

              {/* Popular Software */}
              <div className="flex flex-wrap gap-2">
                {POPULAR_SOFTWARE.map((software) => (
                  <Badge
                    key={software}
                    variant={
                      filters.affectedSoftware.includes(software)
                        ? 'default'
                        : 'outline'
                    }
                    className={`cursor-pointer transition-colors ${
                      filters.affectedSoftware.includes(software)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                    }`}
                    onClick={() => toggleSoftware(software)}
                  >
                    {software}
                  </Badge>
                ))}
              </div>

              {/* Custom Software Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Add custom software..."
                  value={customSoftware}
                  onChange={(e) => setCustomSoftware(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomSoftware()}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <Button
                  onClick={addCustomSoftware}
                  disabled={!customSoftware.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Add
                </Button>
              </div>

              {/* Selected Software */}
              {filters.affectedSoftware.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm">
                    Selected Software:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.affectedSoftware.map((software) => (
                      <Badge
                        key={software}
                        className="bg-blue-500/20 text-blue-300 border-blue-500/30"
                      >
                        {software}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => toggleSoftware(software)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filters */}
            <div className="space-y-4">
              <Label className="text-white/80 flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Advanced Filters</span>
              </Label>

              {/* Exploit & Patch Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="exploitAvailable"
                    checked={filters.exploitAvailable === true}
                    onChange={(e) => updateFilters('exploitAvailable', e.target.checked ? true : undefined)}
                    className="rounded border-white/20 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="exploitAvailable" className="text-white/80 text-sm">
                    Exploit Available
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="patchAvailable"
                    checked={filters.patchAvailable === true}
                    onChange={(e) => updateFilters('patchAvailable', e.target.checked ? true : undefined)}
                    className="rounded border-white/20 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="patchAvailable" className="text-white/80 text-sm">
                    Patch Available
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="kev"
                    checked={filters.kev === true}
                    onChange={(e) => updateFilters('kev', e.target.checked ? true : undefined)}
                    className="rounded border-white/20 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="kev" className="text-white/80 text-sm">
                    Known Exploited (KEV)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="trending"
                    checked={filters.trending === true}
                    onChange={(e) => updateFilters('trending', e.target.checked ? true : undefined)}
                    className="rounded border-white/20 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="trending" className="text-white/80 text-sm">
                    Trending
                  </Label>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-3">
                <Label className="text-white/80 text-sm">Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((category) => (
                    <Badge
                      key={category.value}
                      variant={
                        (filters.category || []).includes(category.value)
                          ? 'default'
                          : 'outline'
                      }
                      className={`cursor-pointer transition-colors ${
                        (filters.category || []).includes(category.value)
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                      }`}
                      onClick={() => toggleCategory(category.value)}
                    >
                      {category.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              <div className="space-y-3">
                <Label className="text-white/80 text-sm">Common Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        (filters.tags || []).includes(tag)
                          ? 'default'
                          : 'outline'
                      }
                      className={`cursor-pointer transition-colors text-xs ${
                        (filters.tags || []).includes(tag)
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Filter Summary */}
        {getActiveFilterCount() > 0 && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-300">
                <strong>{getActiveFilterCount()}</strong> filter
                {getActiveFilterCount() > 1 ? 's' : ''} applied
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-blue-300 hover:text-white hover:bg-blue-500/20"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
