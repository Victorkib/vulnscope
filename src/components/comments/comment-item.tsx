'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/theme/theme-provider';
import { formatRelativeTime } from '@/lib/utils';
import ReplyForm from './reply-form';
import {
  ThumbsUp,
  ThumbsDown,
  Reply,
  Edit,
  Trash2,
  Shield,
  Star,
  Crown,
  MessageSquare,
} from 'lucide-react';
import type { CommentWithVotes } from '@/types/community';

interface CommentItemProps {
  comment: CommentWithVotes;
  onReply?: (commentId: string) => void;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onVote?: (commentId: string, voteType: 'like' | 'dislike') => void;
  onReplySubmitted?: () => void;
  currentUserId?: string;
  vulnerabilityId?: string;
  showReplyForm?: boolean;
}

export default function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onVote,
  onReplySubmitted,
  currentUserId,
  vulnerabilityId,
  showReplyForm = false,
}: CommentItemProps) {
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();
  const { preferences } = useTheme();

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (isVoting || !onVote) return;

    try {
      setIsVoting(true);
      await onVote(comment.id, voteType);
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to record your vote',
        variant: 'destructive',
      });
    } finally {
      setIsVoting(false);
    }
  };

  const getBadgeIcon = (badge: { category: string }) => {
    switch (badge.category) {
      case 'expertise':
        return <Shield className="h-3 w-3" />;
      case 'leadership':
        return <Crown className="h-3 w-3" />;
      case 'helpfulness':
        return <Star className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getBadgeColor = (badge: { category: string }) => {
    switch (badge.category) {
      case 'expertise':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'leadership':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'helpfulness':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 8) return 'text-purple-600 font-bold';
    if (level >= 5) return 'text-blue-600 font-semibold';
    if (level >= 3) return 'text-green-600 font-medium';
    return 'text-gray-600';
  };

  const isOwner = currentUserId === comment.userId;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* User Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {comment.userDisplayName?.charAt(0) || comment.userEmail?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* User Info */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {comment.userDisplayName || comment.userEmail || 'Anonymous User'}
              </span>
              
              {/* User Level */}
              <Badge variant="outline" className="text-xs">
                Level {comment.userLevel || 1}
              </Badge>

              {/* User Badges */}
              {comment.userBadges?.slice(0, 2).map((badge) => (
                <Badge
                  key={badge.id}
                  variant="outline"
                  className={`text-xs ${getBadgeColor(badge)}`}
                  title={badge.description}
                >
                  {getBadgeIcon(badge)}
                  <span className="ml-1">{badge.name}</span>
                </Badge>
              ))}

              {/* Reputation Score */}
              <span className={`text-sm ${getLevelColor(comment.userLevel || 1)}`}>
                {comment.userReputation || 0} pts
              </span>

              {/* Edit indicator */}
              {comment.isEdited && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  edited
                </Badge>
              )}

              <span className="text-sm text-gray-500">
                {formatRelativeTime(comment.createdAt, preferences?.language || 'en')}
              </span>
            </div>

            {/* Comment Content */}
            <div className="text-gray-800 dark:text-gray-200 mb-3">
              {comment.content}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Voting */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('like')}
                  disabled={isVoting}
                  className={`h-8 px-2 ${
                    comment.userVote === 'like'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="ml-1">{comment.likes || 0}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('dislike')}
                  disabled={isVoting}
                  className={`h-8 px-2 ${
                    comment.userVote === 'dislike'
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="ml-1">{comment.dislikes || 0}</span>
                </Button>
              </div>

              {/* Reply Button */}
              {onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(comment.id)}
                  className="h-8 px-2 text-gray-500 hover:text-gray-700"
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              )}

              {/* Owner Actions */}
              {isOwner && (
                <div className="flex items-center space-x-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(comment.id)}
                      className="h-8 px-2 text-gray-500 hover:text-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(comment.id)}
                      className="h-8 px-2 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Reply Form */}
      {showReplyForm && vulnerabilityId && onReplySubmitted && (
        <ReplyForm
          parentCommentId={comment.id}
          vulnerabilityId={vulnerabilityId}
          onReplySubmitted={onReplySubmitted}
          onCancel={() => onReply?.(comment.id)}
          placeholder={`Reply to ${comment.userDisplayName || comment.userEmail || 'this comment'}...`}
        />
      )}
      
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 mt-4 space-y-3 border-l-2 border-gray-200 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              vulnerabilityId={vulnerabilityId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onVote={onVote}
              onReplySubmitted={onReplySubmitted}
              showReplyForm={false} // Don't show reply form for replies
            />
          ))}
        </div>
      )}
    </Card>
  );
}
