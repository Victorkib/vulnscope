'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Vulnerability } from '@/types/vulnerability';
import type { UserBookmark } from '@/types/user';
import {
  Bookmark,
  Edit,
  Trash2,
  Eye,
  Share2,
  Calendar,
  Clock,
  AlertTriangle,
  Shield,
  Target,
  Search,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Tag,
  Star,
} from 'lucide-react';

interface BookmarksManagerProps {
  bookmarks: (UserBookmark & { vulnerability: Vulnerability })[];
  isLoading: boolean;
  onUpdateBookmark: (
    bookmarkId: string,
    updates: Partial<UserBookmark>
  ) => Promise<void>;
  onDeleteBookmark: (bookmarkId: string) => Promise<void>;
  onViewVulnerability: (vulnerabilityId: string) => void;
}

type SortField = 'createdAt' | 'title' | 'severity' | 'cvssScore';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export default function BookmarksManager({
  bookmarks,
  isLoading,
  onUpdateBookmark,
  onDeleteBookmark,
  onViewVulnerability,
}: BookmarksManagerProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingBookmark, setEditingBookmark] = useState<
    (UserBookmark & { vulnerability: Vulnerability }) | null
  >(null);
  const [editForm, setEditForm] = useState({
    title: '',
    notes: '',
    category: '',
  });

  const categories = Array.from(
    new Set(bookmarks.map((b) => b.vulnerability.category).filter(Boolean))
  );

  const filteredAndSortedBookmarks = bookmarks
    .filter((bookmark) => {
      const matchesSearch =
        bookmark.vulnerability.cveId
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        bookmark.vulnerability.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        bookmark.vulnerability.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookmark.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || bookmark.vulnerability.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: unknown, bValue: unknown;

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'title':
          aValue = a.vulnerability.title;
          bValue = b.vulnerability.title;
          break;
        case 'severity':
          const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          aValue =
            severityOrder[
              a.vulnerability.severity as keyof typeof severityOrder
            ];
          bValue =
            severityOrder[
              b.vulnerability.severity as keyof typeof severityOrder
            ];
          break;
        case 'cvssScore':
          aValue = a.vulnerability.cvssScore;
          bValue = b.vulnerability.cvssScore;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const _getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4" />;
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />;
      case 'MEDIUM':
        return <Shield className="h-4 w-4" />;
      case 'LOW':
        return <Target className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const handleEditBookmark = (
    bookmark: UserBookmark & { vulnerability: Vulnerability }
  ) => {
    setEditingBookmark(bookmark);
    setEditForm({
      title: bookmark.vulnerability.title || '',
      notes: bookmark.notes || '',
      category: bookmark.vulnerability.category || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBookmark) return;

    try {
      await onUpdateBookmark(editingBookmark.id, editForm);
      setEditingBookmark(null);
      toast({
        title: 'Bookmark Updated',
        description: 'Your bookmark has been successfully updated.',
      });
    } catch (_error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update bookmark. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      await onDeleteBookmark(bookmarkId);
      toast({
        title: 'Bookmark Deleted',
        description: 'Your bookmark has been successfully removed.',
      });
    } catch (_error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete bookmark. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async (vulnerability: Vulnerability) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: vulnerability.title,
          text: `${vulnerability.cveId}: ${vulnerability.description}`,
          url: `${window.location.origin}/vulnerabilities/${vulnerability.cveId}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/vulnerabilities/${vulnerability.cveId}`
        );
        toast({
          title: 'Link Copied',
          description: 'Vulnerability link copied to clipboard',
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bookmark className="h-5 w-5 text-blue-500" />
            <span>Bookmarked Vulnerabilities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <Bookmark className="h-5 w-5 text-blue-500" />
            <span>Bookmarked Vulnerabilities</span>
            <Badge variant="secondary" className="ml-2">
              {bookmarks.length}
            </Badge>
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAndSortedBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {bookmarks.length === 0
                ? 'No bookmarks yet'
                : 'No matching bookmarks'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {bookmarks.length === 0
                ? 'Start bookmarking vulnerabilities to keep track of important threats'
                : 'Try adjusting your search or filter criteria'}
            </p>
            <Button onClick={() => router.push('/vulnerabilities')}>
              <Search className="h-4 w-4 mr-2" />
              Browse Vulnerabilities
            </Button>
          </div>
        ) : (
          <>
            {/* Sort Controls */}
            <div className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort by:
              </span>
              <Button
                variant={sortField === 'createdAt' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSort('createdAt')}
                className="flex items-center space-x-1"
              >
                <Calendar className="h-3 w-3" />
                <span>Date</span>
                {getSortIcon('createdAt')}
              </Button>
              <Button
                variant={sortField === 'title' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSort('title')}
                className="flex items-center space-x-1"
              >
                <Tag className="h-3 w-3" />
                <span>Title</span>
                {getSortIcon('title')}
              </Button>
              <Button
                variant={sortField === 'severity' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSort('severity')}
                className="flex items-center space-x-1"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Severity</span>
                {getSortIcon('severity')}
              </Button>
              <Button
                variant={sortField === 'cvssScore' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSort('cvssScore')}
                className="flex items-center space-x-1"
              >
                <Star className="h-3 w-3" />
                <span>CVSS</span>
                {getSortIcon('cvssScore')}
              </Button>
            </div>

            {/* Bookmarks Display */}
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredAndSortedBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className={`group relative p-6 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg ${
                    viewMode === 'list' ? 'flex items-center space-x-6' : ''
                  }`}
                >
                  <div
                    className={`flex-1 ${
                      viewMode === 'list'
                        ? 'flex items-center space-x-4'
                        : 'space-y-4'
                    }`}
                  >
                    {/* Header */}
                    <div
                      className={`flex items-start justify-between ${
                        viewMode === 'list' ? 'flex-1' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full ${getSeverityColor(
                            bookmark.vulnerability.severity
                          )}`}
                        ></div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {bookmark.vulnerability.title || bookmark.vulnerability.cveId}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {bookmark.vulnerability.cveId} •{' '}
                            {bookmark.vulnerability.severity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={`${getSeverityColor(
                            bookmark.vulnerability.severity
                          )} text-white border-0`}
                        >
                          {bookmark.vulnerability.cvssScore}
                        </Badge>
                        {bookmark.vulnerability.category && (
                          <Badge variant="outline" className="text-xs">
                            {bookmark.vulnerability.category}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    {viewMode === 'grid' && (
                      <div className="space-y-3">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-2">
                          {bookmark.vulnerability.title}
                        </p>
                        {bookmark.notes && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200 italic">
                              &ldquo;{bookmark.notes}&rdquo;
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Bookmarked{' '}
                              {new Date(
                                bookmark.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Published{' '}
                              {new Date(
                                bookmark.vulnerability.publishedDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className={`flex items-center space-x-2 ${
                      viewMode === 'list' ? '' : 'mt-4'
                    }`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onViewVulnerability(bookmark.vulnerability.cveId)
                      }
                      className="flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View</span>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBookmark(bookmark)}
                          className="flex items-center space-x-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Bookmark</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Title
                            </label>
                            <Input
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Custom title for this bookmark"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Category
                            </label>
                            <Input
                              value={editForm.category}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  category: e.target.value,
                                })
                              }
                              placeholder="e.g., Critical, Research, Monitoring"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Notes
                            </label>
                            <Textarea
                              value={editForm.notes}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  notes: e.target.value,
                                })
                              }
                              placeholder="Add your notes about this vulnerability..."
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingBookmark(null)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSaveEdit}>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(bookmark.vulnerability)}
                      className="flex items-center space-x-1"
                    >
                      <Share2 className="h-3 w-3" />
                      <span>Share</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBookmark(bookmark.id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
