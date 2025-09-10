'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { usePreferences } from '@/contexts/preferences-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/components/layout/app-layout';
import BookmarkButton from '@/components/vulnerability/bookmark-button';
import DiscussionThread from '@/components/collaboration/discussion-thread';
import ShareVulnerability from '@/components/collaboration/share-vulnerability';
import CommentItem from '@/components/comments/comment-item';
import { useToast } from '@/hooks/use-toast';
import { useVulnerabilityDetails } from '@/hooks/use-api';
import { useRealtimeComments } from '@/hooks/use-realtime-comments';
import { apiClient } from '@/lib/api-client';
import type {
  Vulnerability,
  RelatedVulnerability,
  VulnerabilityComment,
} from '@/types/vulnerability';
import type { CommentWithVotes } from '@/types/community';
import {
  formatRelativeTime,
  getSeverityBadgeColor,
  getCvssColor,
} from '@/lib/utils';
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Download,
  AlertTriangle,
  Shield,
  Calendar,
  Globe,
  Code,
  Bug,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MessageSquare,
  Send,
  TrendingUp,
  Database,
  LinkIcon,
  Copy,
  FileText,
  Activity,
  Heart,
  Trash2,
  Edit,
  MoreHorizontal,
} from 'lucide-react';

// Use CommentWithVotes from community types which includes all necessary fields
// This ensures proper type safety for comment operations

export default function VulnerabilityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [sharedVulnerabilities, setSharedVulnerabilities] = useState<any[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);

  // Apply user preferences for styling
  const getFontSizeClass = () => {
    switch (preferences?.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getHighContrastClass = () => {
    return preferences?.highContrast ? 'border-2 border-gray-300 dark:border-gray-600' : '';
  };

  const getAnimationClass = () => {
    return preferences?.reduceMotion ? 'transition-none' : 'transition-colors';
  };


  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const cveId = params.id as string;

  // Use the optimized hook for data fetching
  const {
    vulnerability,
    relatedVulns,
    comments,
    loading,
    commentsLoading,
    relatedLoading,
    error,
    refetch,
    setComments,
  } = useVulnerabilityDetails(cveId);

  // Real-time comment updates
  const {
    isConnected: commentsConnected,
    connectionError: commentsError,
    usePolling: commentsPolling,
  } = useRealtimeComments({
    vulnerabilityId: cveId,
    enabled: !!cveId,
    onCommentAdded: (newComment) => {
      if (newComment) {
        // Add new comment to the list
        setComments((prev) => [newComment, ...prev]);
        toast({
          title: 'New Comment',
          description: `${newComment.userDisplayName} added a comment`,
        });
      } else {
        // Signal to refresh comments (polling detected changes)
        refetch();
      }
    },
    onCommentUpdated: (updatedComment) => {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === updatedComment.id ? updatedComment : comment
        )
      );
    },
    onCommentDeleted: (commentId) => {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    },
    onVoteUpdated: (commentId, likes, dislikes, userVote) => {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, likes, dislikes, userVote }
            : comment
        )
      );
    },
  });

  const fetchSharedVulnerabilities = useCallback(async () => {
    if (!vulnerability?.cveId) return;
    
    try {
      setLoadingShares(true);
      const shares = await apiClient.get(`/api/vulnerabilities/${vulnerability.cveId}/share`, {
        enableCache: true,
        cacheTTL: 120000, // 2 minutes cache
      });
      setSharedVulnerabilities(shares);
    } catch (error) {
      console.error('Error fetching shared vulnerabilities:', error);
    } finally {
      setLoadingShares(false);
    }
  }, [vulnerability?.cveId]);

  // Handle instant updates when vulnerability is shared
  const handleShareSuccess = useCallback((newSharedVulnerability: any) => {
    setSharedVulnerabilities(prev => [newSharedVulnerability, ...prev]);
    
    // Show a success toast for the instant update
    toast({
      title: 'Shared Status Updated',
      description: 'The vulnerability sharing status has been updated instantly',
    });
  }, [toast]);

  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load vulnerability details',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (activeTab === 'collaboration') {
      fetchSharedVulnerabilities();
    }
  }, [activeTab, fetchSharedVulnerabilities]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      
      const comment = await apiClient.post(`/api/vulnerabilities/${cveId}/comments`, {
        content: newComment,
        isPublic: true,
      });

      // Clear the input field immediately for better UX
      setNewComment('');
      
      // Clear cache to ensure fresh data on next fetch
      apiClient.clearCache(`/api/vulnerabilities/${cveId}/comments`);
      
      // Don't update local state here - let real-time subscription handle it
      // This prevents duplication since real-time will add the comment automatically
      
      toast({
        title: 'Comment Added',
        description: 'Your comment has been posted successfully',
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVoteComment = async (commentId: string, voteType: 'like' | 'dislike') => {
    try {
      const result = await apiClient.post(`/api/comments/${commentId}/vote`, {
        voteType,
      });

      // Clear cache to ensure fresh data on next fetch
      apiClient.clearCache(`/api/vulnerabilities/${cveId}/comments`);
      
      // Don't update local state here - let real-time subscription handle it
      // This prevents duplication since real-time will update the vote counts automatically
      
      toast({
        title: 'Vote recorded',
        description: `Your ${voteType} has been recorded`,
      });
    } catch (error) {
      console.error(`Error ${voteType}ing comment:`, error);
      toast({
        title: 'Error',
        description: `Failed to record your ${voteType}`,
        variant: 'destructive',
      });
    }
  };


  const [replyingToComment, setReplyingToComment] = useState<string | null>(null);

  const handleReplyComment = (commentId: string) => {
    setReplyingToComment(commentId);
  };

  const handleReplySubmitted = () => {
    setReplyingToComment(null);
    // Refresh comments to show the new reply
    refetch();
  };

  const handleEditCommentFromItem = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditContent(comment.content);
    }
  };

  const handleDeleteCommentFromItem = (commentId: string) => {
    handleDeleteComment(commentId);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiClient.delete(`/api/vulnerabilities/${cveId}/comments/${commentId}`);

      // Clear cache to ensure fresh data on next fetch
      apiClient.clearCache(`/api/vulnerabilities/${cveId}/comments`);
      
      // Don't update local state here - let real-time subscription handle it
      // This prevents issues since real-time will remove the comment automatically
      
      toast({
        title: 'Comment Deleted',
        description: 'Comment has been removed',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const updatedComment = await apiClient.patch(
        `/api/vulnerabilities/${cveId}/comments/${commentId}`,
        { action: 'edit', content: editContent }
      );

      setEditingComment(null);
      setEditContent('');
      
      // Clear cache to ensure fresh data on next fetch
      apiClient.clearCache(`/api/vulnerabilities/${cveId}/comments`);
      
      // Don't update local state here - let real-time subscription handle it
      // This prevents issues since real-time will update the comment automatically
      
      toast({
        title: 'Comment Updated',
        description: 'Your comment has been updated',
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!vulnerability) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: vulnerability.title,
          text: `${vulnerability.cveId}: ${vulnerability.description}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'Vulnerability link copied to clipboard',
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleExport = async (format: 'json' | 'text') => {
    try {
      const response = await fetch(
        `/api/vulnerabilities/${cveId}/export?format=${format}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cveId}.${format === 'json' ? 'json' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Export Successful',
          description: `Vulnerability details exported as ${format.toUpperCase()}`,
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export vulnerability details',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Text copied to clipboard',
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getRelationshipTypeLabel = (type: string) => {
    switch (type) {
      case 'SAME_SOFTWARE':
        return 'Same Software';
      case 'SAME_CWE':
        return 'Same Weakness';
      case 'SAME_SEVERITY':
        return 'Same Severity';
      case 'SAME_CATEGORY':
        return 'Same Category';
      default:
        return 'Similar Attack';
    }
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type) {
      case 'SAME_SOFTWARE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'SAME_CWE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'SAME_SEVERITY':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'SAME_CATEGORY':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!vulnerability) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Vulnerability Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The vulnerability {cveId} could not be found or may have been
              removed.
            </p>
            <Button onClick={() => router.push('/vulnerabilities')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vulnerabilities
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={`p-6 max-w-7xl mx-auto space-y-6 ${getFontSizeClass()}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="flex items-center space-x-2">
                {vulnerability.severity === 'CRITICAL' && (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                {vulnerability.severity === 'HIGH' && (
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                )}
                {vulnerability.severity === 'MEDIUM' && (
                  <Shield className="h-5 w-5 text-yellow-500" />
                )}
                {vulnerability.severity === 'LOW' && (
                  <Shield className="h-5 w-5 text-green-500" />
                )}
                <Badge
                  className={getSeverityBadgeColor(vulnerability.severity)}
                >
                  {vulnerability.severity}
                </Badge>
                <span
                  className={`font-bold text-lg ${getCvssColor(
                    vulnerability.cvssScore
                  )}`}
                >
                  CVSS {vulnerability.cvssScore}
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {vulnerability.cveId}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              {vulnerability.title}
            </p>
            
            {/* Shared Status Indicator */}
            {sharedVulnerabilities.length > 0 && (
              <div className="mb-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full">
                  <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Shared with {sharedVulnerabilities.length} {sharedVulnerabilities.length === 1 ? 'recipient' : 'recipients'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Published:{' '}
                  {new Date(vulnerability.publishedDate).toLocaleDateString(
                    preferences?.language || 'en',
                    { timeZone: preferences?.timezone || 'UTC' }
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  Updated: {formatRelativeTime(vulnerability.lastModifiedDate, preferences?.language || 'en')}
                </span>
              </div>
              {vulnerability.trending && (
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400">
                    Trending
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <BookmarkButton vulnerabilityId={vulnerability.cveId} />
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('text')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Text Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            className={`border-0 shadow-lg ${
              vulnerability.exploitAvailable
                ? 'bg-red-50 dark:bg-red-900/20'
                : 'bg-gray-50 dark:bg-gray-800/50'
            }`}
          >
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {vulnerability.exploitAvailable ? (
                  <Bug className="h-6 w-6 text-red-500" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="text-sm font-medium">
                {vulnerability.exploitAvailable
                  ? 'Exploit Available'
                  : 'No Known Exploits'}
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg ${
              vulnerability.patchAvailable
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-gray-50 dark:bg-gray-800/50'
            }`}
          >
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {vulnerability.patchAvailable ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="text-sm font-medium">
                {vulnerability.patchAvailable
                  ? 'Patch Available'
                  : 'No Patch Available'}
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg ${
              vulnerability.kev
                ? 'bg-purple-50 dark:bg-purple-900/20'
                : 'bg-gray-50 dark:bg-gray-800/50'
            }`}
          >
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {vulnerability.kev ? (
                  <Zap className="h-6 w-6 text-purple-500" />
                ) : (
                  <Shield className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="text-sm font-medium">
                {vulnerability.kev ? 'Known Exploited' : 'Not in KEV'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-sm font-medium">
                {comments.length} Comments
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="references">References</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
                <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className={`border-0 shadow-lg ${getHighContrastClass()}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span>Description</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {vulnerability.description}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5 text-green-600" />
                      <span>Affected Software</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vulnerability.affectedSoftware?.map(
                        (software, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          >
                            {software}
                          </Badge>
                        )
                      ) || (
                        <span className="text-gray-500">
                          No affected software listed
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {vulnerability.mitigations &&
                  vulnerability.mitigations.length > 0 && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Shield className="h-5 w-5 text-orange-600" />
                          <span>Mitigations</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {vulnerability.mitigations.map(
                            (mitigation, index) => (
                              <li
                                key={index}
                                className="flex items-start space-x-2"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {mitigation}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>

              <TabsContent value="technical" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Code className="h-5 w-5 text-purple-600" />
                      <span>CVSS Metrics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Attack Vector
                        </div>
                        <div className="text-lg font-semibold">
                          {vulnerability.attackVector || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Attack Complexity
                        </div>
                        <div className="text-lg font-semibold">
                          {vulnerability.attackComplexity || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Privileges Required
                        </div>
                        <div className="text-lg font-semibold">
                          {vulnerability.privilegesRequired || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          User Interaction
                        </div>
                        <div className="text-lg font-semibold">
                          {vulnerability.userInteraction || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Scope
                        </div>
                        <div className="text-lg font-semibold">
                          {vulnerability.scope || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          CVSS Vector
                        </div>
                        <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          {vulnerability.cvssVector || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-red-600" />
                      <span>Impact Assessment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Confidentiality
                        </div>
                        <Badge
                          className={
                            vulnerability.confidentialityImpact === 'HIGH'
                              ? 'bg-red-500'
                              : vulnerability.confidentialityImpact === 'LOW'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                          }
                        >
                          {vulnerability.confidentialityImpact || 'NONE'}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Integrity
                        </div>
                        <Badge
                          className={
                            vulnerability.integrityImpact === 'HIGH'
                              ? 'bg-red-500'
                              : vulnerability.integrityImpact === 'LOW'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                          }
                        >
                          {vulnerability.integrityImpact || 'NONE'}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Availability
                        </div>
                        <Badge
                          className={
                            vulnerability.availabilityImpact === 'HIGH'
                              ? 'bg-red-500'
                              : vulnerability.availabilityImpact === 'LOW'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                          }
                        >
                          {vulnerability.availabilityImpact || 'NONE'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {vulnerability.cweId && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Bug className="h-5 w-5 text-orange-600" />
                        <span>Weakness Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono">
                          {vulnerability.cweId}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const cweNumber =
                              vulnerability.cweId?.replace('CWE-', '') || '';
                            if (cweNumber) {
                              window.open(
                                `https://cwe.mitre.org/data/definitions/${cweNumber}.html`,
                                '_blank'
                              );
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View CWE Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="references" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <LinkIcon className="h-5 w-5 text-blue-600" />
                      <span>External References</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vulnerability.references?.map((reference, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-md">
                              {reference}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(reference)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(reference, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )) || (
                        <span className="text-gray-500">
                          No references available
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {vulnerability.vendorAdvisory && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span>Vendor Advisory</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(vulnerability.vendorAdvisory, '_blank')
                        }
                        className="w-full justify-start"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Vendor Advisory
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="comments" className="space-y-6">
                {/* Enhanced Real-time Status Indicator */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className={`w-3 h-3 rounded-full ${
                            commentsConnected 
                              ? 'bg-green-500 animate-pulse' 
                              : commentsPolling 
                              ? 'bg-yellow-500 animate-pulse' 
                              : 'bg-gray-400'
                          }`}></div>
                          {commentsConnected && (
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75"></div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {commentsConnected 
                              ? '🚀 Live Comments Active' 
                              : commentsPolling 
                              ? '🔄 Auto-Refresh Mode' 
                              : '💬 Comments Available'
                            }
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {commentsConnected 
                              ? 'Real-time updates enabled • Instant notifications' 
                              : commentsPolling 
                              ? 'Checking every 10 seconds • Reliable fallback' 
                              : 'Offline mode • Comments saved locally'
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* Connection Status Actions */}
                      <div className="flex items-center space-x-2">
                        {commentsConnected ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Live
                          </Badge>
                        ) : commentsPolling ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></div>
                            Polling
                          </Badge>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                              Offline
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Connection Error Display */}
                    {commentsError && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-700 dark:text-red-300">
                            Connection issue detected
                          </span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Using reliable fallback mode • Your comments are still saved
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {user && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <span>Add Comment</span>
                        </div>
                        {/* Connection Status for Comment Form */}
                        <div className="flex items-center space-x-2">
                          {commentsConnected ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                              Live
                            </Badge>
                          ) : commentsPolling ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1 animate-pulse"></div>
                              Auto-sync
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1"></div>
                              Offline
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Share your thoughts, analysis, or additional information about this vulnerability..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[100px]"
                          maxLength={2000}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                              {newComment.length}/2000 characters
                            </span>
                            {newComment.length > 0 && (
                              <span className="text-xs text-gray-400">
                                {commentsConnected 
                                  ? 'Will appear instantly' 
                                  : commentsPolling 
                                  ? 'Will sync automatically' 
                                  : 'Saved locally'
                                }
                              </span>
                            )}
                          </div>
                          <Button
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || submittingComment}
                            className="relative"
                          >
                            {submittingComment ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                {commentsConnected ? 'Posting...' : 'Saving...'}
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                {commentsConnected ? 'Post Live' : 'Post Comment'}
                              </>
                            )}
                            {/* Connection indicator on button */}
                            {commentsConnected && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        <span>Community Discussion ({comments.length})</span>
                      </div>
                      {/* Live Activity Indicator */}
                      {commentsConnected && comments.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Live updates
                            </span>
                          </div>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {commentsLoading ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Loading comments...
                            </span>
                          </div>
                        </div>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="relative">
                          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50 text-gray-400" />
                          {commentsConnected && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Start the Conversation
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Be the first to share your insights about this vulnerability!
                        </p>
                        {commentsConnected ? (
                          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-700 dark:text-green-300">
                              Live comments ready
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Comments will sync when online
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Live Activity Banner */}
                        {commentsConnected && (
                          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-green-700 dark:text-green-300">
                                Live comments active • New comments appear instantly
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {comments.map((comment) => (
                          <div key={comment.id} className="relative">
                            {/* Live indicator for new comments */}
                            {commentsConnected && (
                              <div className="absolute -left-2 top-2 w-1 h-1 bg-green-500 rounded-full animate-pulse opacity-0"></div>
                            )}
                            <CommentItem
                              comment={comment}
                              currentUserId={user?.id}
                              vulnerabilityId={cveId}
                              onReply={handleReplyComment}
                              onEdit={handleEditCommentFromItem}
                              onDelete={handleDeleteCommentFromItem}
                              onVote={handleVoteComment}
                              onReplySubmitted={handleReplySubmitted}
                              showReplyForm={replyingToComment === comment.id}
                            />
                          </div>
                        ))}
                        
                        {/* Connection Status Footer */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              {commentsConnected 
                                ? 'Real-time updates enabled' 
                                : commentsPolling 
                                ? 'Auto-refresh every 10 seconds' 
                                : 'Offline mode • Comments cached locally'
                              }
                            </span>
                            {comments.length > 0 && (
                              <span>
                                Last updated: {new Date().toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Discussions Tab */}
              <TabsContent value="discussions" className="space-y-6">
                <DiscussionThread vulnerabilityId={vulnerability.cveId} />
              </TabsContent>

              {/* Collaboration Tab */}
              <TabsContent value="collaboration" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Share2 className="h-5 w-5 text-green-600" />
                      <span>Share & Collaborate</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          Share with Team Members
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Share this vulnerability with your team for collaborative analysis
                        </p>
                      </div>
                      <ShareVulnerability 
                        vulnerabilityId={vulnerability.cveId} 
                        onShareSuccess={handleShareSuccess}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Team Discussions
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Start team discussions about this vulnerability
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setActiveTab('discussions')}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Start Discussion
                        </Button>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Export for Analysis
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Export vulnerability data for external analysis tools
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (vulnerability) {
                              const exportData = {
                                cveId: vulnerability.cveId,
                                title: vulnerability.title,
                                description: vulnerability.description,
                                severity: vulnerability.severity,
                                cvssScore: vulnerability.cvssScore,
                                publishedDate: vulnerability.publishedDate,
                                affectedSoftware: vulnerability.affectedSoftware,
                                references: vulnerability.references,
                                exportedAt: new Date().toISOString(),
                              };
                              
                              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${vulnerability.cveId}-export.json`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              
                              toast({
                                title: 'Export Successful',
                                description: 'Vulnerability data has been exported',
                              });
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shared Vulnerabilities */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Share2 className="h-5 w-5 text-blue-600" />
                      <span>Sharing History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingShares ? (
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ) : sharedVulnerabilities.length === 0 ? (
                      <div className="text-center py-8">
                        <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No Sharing History
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          This vulnerability hasn't been shared with anyone yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sharedVulnerabilities.map((share, index) => (
                          <div 
                            key={share.id} 
                            className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-300 ${
                              index === 0 ? 'animate-fade-in bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  Shared with {share.shareType === 'team' ? 'Team' : 'User'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(share.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {share.permissions.canView && (
                                <Badge variant="outline" className="text-xs">View</Badge>
                              )}
                              {share.permissions.canComment && (
                                <Badge variant="outline" className="text-xs">Comment</Badge>
                              )}
                              {share.permissions.canEdit && (
                                <Badge variant="outline" className="text-xs">Edit</Badge>
                              )}
                              {share.permissions.canShare && (
                                <Badge variant="outline" className="text-xs">Share</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Vulnerabilities */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-orange-600" />
                  <span>Related Vulnerabilities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatedLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : relatedVulns.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No related vulnerabilities found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {relatedVulns.slice(0, 5).map((related) => (
                      <div
                        key={related.cveId}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/vulnerabilities/${related.cveId}`)
                        }
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                            {related.cveId}
                          </span>
                          <Badge
                            className={`${getSeverityBadgeColor(
                              related.severity
                            )} text-xs`}
                          >
                            {related.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {related.title}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge
                            className={getRelationshipTypeColor(
                              related.relationshipType
                            )}
                            variant="outline"
                          >
                            {getRelationshipTypeLabel(related.relationshipType)}
                          </Badge>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {Math.round((related.similarity || 0) * 100)}%
                            similar
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            CVSS {related.cvssScore}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(related.publishedDate, preferences?.language || 'en')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() =>
                      window.open(
                        `https://nvd.nist.gov/vuln/detail/${vulnerability.cveId}`,
                        '_blank'
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on NVD
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() =>
                      window.open(
                        `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vulnerability.cveId}`,
                        '_blank'
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on MITRE
                  </Button>
                  {vulnerability.cweId && (
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => {
                        const cweNumber =
                          vulnerability.cweId?.replace('CWE-', '') || '';
                        if (cweNumber) {
                          window.open(
                            `https://cwe.mitre.org/data/definitions/${cweNumber}.html`,
                            '_blank'
                          );
                        }
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View CWE Details
                    </Button>
                  )}
                  <Separator />
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => handleExport('json')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as JSON
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => handleExport('text')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {vulnerability.tags && vulnerability.tags.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Tags</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vulnerability.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
    </AppLayout>
  );
}
