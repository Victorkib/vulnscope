import { supabase } from '@/lib/supabase-server';
import { ReputationService } from './reputation-service';

/**
 * Comment Reputation Integration Service
 * 
 * This service connects the comment system with the reputation system,
 * providing real-time reputation data for comments.
 * 
 * SAFETY: This is an additive service that doesn't modify existing functionality.
 */

export class CommentReputationService {
  private static instance: CommentReputationService;
  private reputationService: ReputationService;

  public static getInstance(): CommentReputationService {
    if (!CommentReputationService.instance) {
      CommentReputationService.instance = new CommentReputationService();
    }
    return CommentReputationService.instance;
  }

  constructor() {
    this.reputationService = ReputationService.getInstance();
  }

  /**
   * Get user reputation data for a comment
   */
  async getUserReputationForComment(userId: string): Promise<{
    reputation: number;
    level: number;
    badges: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      color: string;
      earnedAt: string;
      category: string;
    }>;
  }> {
    try {
      // For now, return default values
      // TODO: Connect to actual reputation system when available
      return {
        reputation: 0,
        level: 1,
        badges: [],
      };
    } catch (error) {
      console.error('Error fetching user reputation for comment:', error);
      // Return safe defaults
      return {
        reputation: 0,
        level: 1,
        badges: [],
      };
    }
  }

  /**
   * Update reputation when a comment receives a vote
   */
  async updateReputationOnVote(
    commentUserId: string,
    voteType: 'like' | 'dislike',
    commentId: string
  ): Promise<void> {
    try {
      // TODO: Implement reputation updates based on votes
      // This would integrate with the existing reputation service
      console.log(`Reputation update: User ${commentUserId} received ${voteType} on comment ${commentId}`);
    } catch (error) {
      console.error('Error updating reputation on vote:', error);
      // Don't throw - reputation updates shouldn't break comment functionality
    }
  }

  /**
   * Update reputation when a user posts a comment
   */
  async updateReputationOnComment(
    userId: string,
    commentId: string,
    isReply: boolean = false
  ): Promise<void> {
    try {
      // TODO: Implement reputation updates for comment posting
      console.log(`Reputation update: User ${userId} posted ${isReply ? 'reply' : 'comment'} ${commentId}`);
    } catch (error) {
      console.error('Error updating reputation on comment:', error);
      // Don't throw - reputation updates shouldn't break comment functionality
    }
  }

  /**
   * Get comment statistics for a user
   */
  async getUserCommentStats(userId: string): Promise<{
    totalComments: number;
    totalReplies: number;
    likesReceived: number;
    dislikesReceived: number;
    helpfulComments: number;
  }> {
    try {
      const supabaseClient = await supabase();

      // Get comment counts
      const { count: totalComments, error: commentsError } = await supabaseClient
        .from('vulnerability_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (commentsError) {
        throw commentsError;
      }

      // Get reply counts
      const { count: totalReplies, error: repliesError } = await supabaseClient
        .from('vulnerability_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('parent_id', 'is', null);

      if (repliesError) {
        throw repliesError;
      }

      // Get vote statistics
      const { data: comments, error: commentsDataError } = await supabaseClient
        .from('vulnerability_comments')
        .select('likes, dislikes')
        .eq('user_id', userId);

      if (commentsDataError) {
        throw commentsDataError;
      }

      const likesReceived = comments?.reduce((sum, comment) => sum + (comment.likes || 0), 0) || 0;
      const dislikesReceived = comments?.reduce((sum, comment) => sum + (comment.dislikes || 0), 0) || 0;

      return {
        totalComments: totalComments || 0,
        totalReplies: totalReplies || 0,
        likesReceived,
        dislikesReceived,
        helpfulComments: 0, // TODO: Implement helpful comment detection
      };
    } catch (error) {
      console.error('Error fetching user comment stats:', error);
      // Return safe defaults
      return {
        totalComments: 0,
        totalReplies: 0,
        likesReceived: 0,
        dislikesReceived: 0,
        helpfulComments: 0,
      };
    }
  }

  /**
   * Get community statistics
   */
  async getCommunityStats(): Promise<{
    totalComments: number;
    totalUsers: number;
    totalVotes: number;
    topContributors: Array<{
      userId: string;
      displayName: string;
      commentCount: number;
      reputation: number;
    }>;
  }> {
    try {
      const supabaseClient = await supabase();

      // Get total comment count
      const { count: totalComments, error: commentsError } = await supabaseClient
        .from('vulnerability_comments')
        .select('*', { count: 'exact', head: true });

      if (commentsError) {
        throw commentsError;
      }

      // Get unique user count
      const { data: users, error: usersError } = await supabaseClient
        .from('vulnerability_comments')
        .select('user_id, user_display_name')
        .eq('is_public', true);

      if (usersError) {
        throw usersError;
      }

      const uniqueUsers = new Set(users?.map(u => u.user_id) || []);
      const totalUsers = uniqueUsers.size;

      // Get total vote count
      const { count: totalVotes, error: votesError } = await supabaseClient
        .from('comment_votes')
        .select('*', { count: 'exact', head: true });

      if (votesError) {
        throw votesError;
      }

      // Get top contributors (users with most comments)
      const { data: contributors, error: contributorsError } = await supabaseClient
        .from('vulnerability_comments')
        .select('user_id, user_display_name')
        .eq('is_public', true);

      if (contributorsError) {
        throw contributorsError;
      }

      // Count comments per user
      const userCommentCounts = new Map<string, { displayName: string; count: number }>();
      contributors?.forEach(comment => {
        const userId = comment.user_id;
        const displayName = comment.user_display_name;
        const current = userCommentCounts.get(userId) || { displayName, count: 0 };
        userCommentCounts.set(userId, { displayName, count: current.count + 1 });
      });

      // Get top 5 contributors
      const topContributors = Array.from(userCommentCounts.entries())
        .map(([userId, data]) => ({
          userId,
          displayName: data.displayName,
          commentCount: data.count,
          reputation: 0, // TODO: Get actual reputation
        }))
        .sort((a, b) => b.commentCount - a.commentCount)
        .slice(0, 5);

      return {
        totalComments: totalComments || 0,
        totalUsers,
        totalVotes: totalVotes || 0,
        topContributors,
      };
    } catch (error) {
      console.error('Error fetching community stats:', error);
      // Return safe defaults
      return {
        totalComments: 0,
        totalUsers: 0,
        totalVotes: 0,
        topContributors: [],
      };
    }
  }
}

// Export singleton instance
export const commentReputationService = CommentReputationService.getInstance();
