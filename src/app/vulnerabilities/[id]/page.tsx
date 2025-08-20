'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useTheme } from '@/components/theme/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/components/layout/app-layout';
import BookmarkButton from '@/components/vulnerability/bookmark-button';
import { useToast } from '@/hooks/use-toast';
import type {
  Vulnerability,
  RelatedVulnerability,
  VulnerabilityComment,
} from '@/types/vulnerability';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentWithActions extends VulnerabilityComment {
  likes: number;
}

export default function VulnerabilityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { preferences } = useTheme();
  const { toast } = useToast();

  const [vulnerability, setVulnerability] = useState<Vulnerability | null>(
    null
  );
  const [relatedVulns, setRelatedVulns] = useState<RelatedVulnerability[]>([]);
  const [comments, setComments] = useState<CommentWithActions[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const cveId = params.id as string;

  useEffect(() => {
    if (cveId) {
      fetchVulnerabilityDetails();
    }
  }, [cveId]);

  const fetchVulnerabilityDetails = async () => {
    try {
      setLoading(true);
      const [vulnRes, relatedRes, commentsRes] = await Promise.all([
        fetch(`/api/vulnerabilities/${cveId}`),
        fetch(`/api/vulnerabilities/${cveId}/related`),
        fetch(`/api/vulnerabilities/${cveId}/comments`),
      ]);

      if (vulnRes.ok) {
        const vulnData = await vulnRes.json();
        setVulnerability(vulnData);
      } else {
        toast({
          title: 'Error',
          description: 'Vulnerability not found',
          variant: 'destructive',
        });
      }

      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        setRelatedVulns(relatedData);
      }
      setRelatedLoading(false);

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
      }
      setCommentsLoading(false);
    } catch (error) {
      console.error('Error fetching vulnerability details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vulnerability details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await fetch(`/api/vulnerabilities/${cveId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          isPublic: true,
          userId: user?.id || 'anonymous',
          userEmail: user?.email || 'anonymous@example.com',
          userDisplayName:
            user?.user_metadata?.display_name ||
            user?.email ||
            'Anonymous User',
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments((prev) => [comment, ...prev]);
        setNewComment('');
        toast({
          title: 'Comment Added',
          description: 'Your comment has been posted successfully',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to post comment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/vulnerabilities/${cveId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'like' }),
        }
      );

      if (response.ok) {
        const updatedComment = await response.json();
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? { ...comment, likes: updatedComment.likes }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/vulnerabilities/${cveId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setComments((prev) =>
          prev.filter((comment) => comment.id !== commentId)
        );
        toast({
          title: 'Comment Deleted',
          description: 'Comment has been removed',
        });
      }
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
      const response = await fetch(
        `/api/vulnerabilities/${cveId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'edit', content: editContent }),
        }
      );

      if (response.ok) {
        const updatedComment = await response.json();
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  content: updatedComment.content,
                  updatedAt: updatedComment.updatedAt,
                }
              : comment
          )
        );
        setEditingComment(null);
        setEditContent('');
        toast({
          title: 'Comment Updated',
          description: 'Your comment has been updated',
        });
      }
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
        `/api/vulnerabilities/${cveId}/export?format=${format}`
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
      <div className="p-6 max-w-7xl mx-auto space-y-6">
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

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Published:{' '}
                  {new Date(vulnerability.publishedDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  Updated: {formatRelativeTime(vulnerability.lastModifiedDate)}
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
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="references">References</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className="border-0 shadow-lg">
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
                {user && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        <span>Add Comment</span>
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
                          <span className="text-sm text-gray-500">
                            {newComment.length}/2000 characters
                          </span>
                          <Button
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || submittingComment}
                          >
                            {submittingComment ? (
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span>Community Discussion ({comments.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {commentsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>
                          No comments yet. Be the first to share your insights!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="border-l-4 border-blue-500 pl-4 py-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {comment.user.displayName ||
                                    comment.user.email}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {comment.isPublic ? 'Public' : 'Private'}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatRelativeTime(comment.createdAt)}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleLikeComment(comment.id)
                                      }
                                    >
                                      <Heart className="h-4 w-4 mr-2" />
                                      Like ({comment.likes || 0})
                                    </DropdownMenuItem>
                                    {user && comment.user.id === user.id && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setEditingComment(comment.id);
                                            setEditContent(comment.content);
                                          }}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleDeleteComment(comment.id)
                                          }
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            {editingComment === comment.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editContent}
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
                                  className="min-h-[80px]"
                                  maxLength={2000}
                                />
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleEditComment(comment.id)
                                    }
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingComment(null);
                                      setEditContent('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-gray-700 dark:text-gray-300 mb-2">
                                  {comment.content}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <button
                                    onClick={() =>
                                      handleLikeComment(comment.id)
                                    }
                                    className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                                  >
                                    <Heart className="h-4 w-4" />
                                    <span>{comment.likes || 0}</span>
                                  </button>
                                  {comment.updatedAt !== comment.createdAt && (
                                    <span className="text-xs">Edited</span>
                                  )}
                                </div>
                              </div>
                            )}
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
                            {formatRelativeTime(related.publishedDate)}
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
