import type { UserReputation, UserBadge, CommentVote } from '@/types/community';
import { getDatabase } from './mongodb';

export class ReputationService {
  private static instance: ReputationService;

  public static getInstance(): ReputationService {
    if (!ReputationService.instance) {
      ReputationService.instance = new ReputationService();
    }
    return ReputationService.instance;
  }

  /**
   * Check if we're running in a server context
   */
  private isServerContext(): boolean {
    return typeof window === 'undefined';
  }

  /**
   * Calculate reputation score based on user activity
   */
  calculateReputationScore(votes: CommentVote[], commentsCount: number): number {
    const likes = votes.filter(v => v.voteType === 'like').length;
    const dislikes = votes.filter(v => v.voteType === 'dislike').length;
    
    // Base score from comments
    const commentScore = commentsCount * 2;
    
    // Score from votes (likes give +5, dislikes give -2)
    const voteScore = (likes * 5) - (dislikes * 2);
    
    // Bonus for high engagement
    const engagementBonus = commentsCount > 10 ? 20 : 0;
    
    return Math.max(0, commentScore + voteScore + engagementBonus);
  }

  /**
   * Calculate user level based on reputation score
   */
  calculateUserLevel(score: number): number {
    if (score < 50) return 1;
    if (score < 150) return 2;
    if (score < 300) return 3;
    if (score < 500) return 4;
    if (score < 750) return 5;
    if (score < 1000) return 6;
    if (score < 1500) return 7;
    if (score < 2000) return 8;
    if (score < 3000) return 9;
    return 10;
  }

  /**
   * Get badges for user based on their activity
   */
  getEarnedBadges(reputation: UserReputation): UserBadge[] {
    const badges: UserBadge[] = [];

    // Participation badges
    if (reputation.stats.commentsCount >= 1) {
      badges.push({
        id: 'first_comment',
        name: 'First Comment',
        description: 'Made your first comment',
        icon: '💬',
        color: 'blue',
        earnedAt: new Date().toISOString(),
        category: 'participation',
      });
    }

    if (reputation.stats.commentsCount >= 10) {
      badges.push({
        id: 'active_commenter',
        name: 'Active Commenter',
        description: 'Made 10+ comments',
        icon: '🗣️',
        color: 'green',
        earnedAt: new Date().toISOString(),
        category: 'participation',
      });
    }

    if (reputation.stats.commentsCount >= 50) {
      badges.push({
        id: 'prolific_commenter',
        name: 'Prolific Commenter',
        description: 'Made 50+ comments',
        icon: '📝',
        color: 'purple',
        earnedAt: new Date().toISOString(),
        category: 'participation',
      });
    }

    // Helpfulness badges
    if (reputation.stats.likesReceived >= 10) {
      badges.push({
        id: 'helpful_contributor',
        name: 'Helpful Contributor',
        description: 'Received 10+ likes',
        icon: '👍',
        color: 'green',
        earnedAt: new Date().toISOString(),
        category: 'helpfulness',
      });
    }

    if (reputation.stats.likesReceived >= 50) {
      badges.push({
        id: 'community_favorite',
        name: 'Community Favorite',
        description: 'Received 50+ likes',
        icon: '⭐',
        color: 'gold',
        earnedAt: new Date().toISOString(),
        category: 'helpfulness',
      });
    }

    // Expertise badges
    if (reputation.stats.expertComments >= 5) {
      badges.push({
        id: 'security_expert',
        name: 'Security Expert',
        description: 'Made 5+ expert-level comments',
        icon: '🛡️',
        color: 'red',
        earnedAt: new Date().toISOString(),
        category: 'expertise',
      });
    }

    // Leadership badges
    if (reputation.level >= 8) {
      badges.push({
        id: 'community_leader',
        name: 'Community Leader',
        description: 'Reached level 8+',
        icon: '👑',
        color: 'purple',
        earnedAt: new Date().toISOString(),
        category: 'leadership',
      });
    }

    return badges;
  }

  /**
   * Update user reputation after a vote
   */
  async updateReputationAfterVote(
    userId: string,
    voteType: 'like' | 'dislike',
    isNewVote: boolean,
    previousVoteType?: 'like' | 'dislike'
  ): Promise<void> {
    try {
      if (this.isServerContext()) {
        // Server-side: directly update the database
        await this.updateReputationDirectly(userId, voteType, isNewVote, previousVoteType);
      } else {
        // Client-side: make HTTP request
        const response = await fetch('/api/users/reputation/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            voteType,
            isNewVote,
            previousVoteType,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update reputation');
        }
      }
    } catch (error) {
      console.error('Error updating reputation:', error);
    }
  }

  /**
   * Directly update reputation in the database (server-side only)
   */
  private async updateReputationDirectly(
    userId: string,
    voteType: 'like' | 'dislike',
    isNewVote: boolean,
    previousVoteType?: 'like' | 'dislike'
  ): Promise<void> {
    try {
      const db = await getDatabase();
      const reputationCollection = db.collection<UserReputation>('user_reputations');
      const votesCollection = db.collection<CommentVote>('comment_votes');
      const commentsCollection = db.collection('vulnerability_comments');

      // Get current reputation
      let reputation = await reputationCollection.findOne({ userId });
      if (!reputation) {
        // Create new reputation record
        reputation = {
          id: `reputation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          totalScore: 0,
          level: 1,
          badges: [],
          stats: {
            commentsCount: 0,
            likesReceived: 0,
            dislikesReceived: 0,
            expertComments: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Get user's votes and comments for recalculation
      const votes = await votesCollection.find({ userId }).toArray();
      const commentsCount = await commentsCollection.countDocuments({ userId });

      // Recalculate reputation
      reputation.totalScore = this.calculateReputationScore(votes, commentsCount);
      reputation.level = this.calculateUserLevel(reputation.totalScore);
      reputation.badges = this.getEarnedBadges(reputation);
      reputation.updatedAt = new Date().toISOString();

      // Update or insert reputation
      await reputationCollection.replaceOne(
        { userId },
        reputation,
        { upsert: true }
      );
    } catch (error) {
      console.error('Error updating reputation directly:', error);
      throw error;
    }
  }

  /**
   * Get user reputation
   */
  async getUserReputation(userId: string): Promise<UserReputation | null> {
    try {
      if (this.isServerContext()) {
        // Server-side: directly query the database
        const db = await getDatabase();
        const reputationCollection = db.collection<UserReputation>('user_reputations');
        return await reputationCollection.findOne({ userId });
      } else {
        // Client-side: make HTTP request
        const response = await fetch(`/api/users/reputation/${userId}`);
        if (response.ok) {
          return await response.json();
        }
        return null;
      }
    } catch (error) {
      console.error('Error fetching user reputation:', error);
      return null;
    }
  }
}

// Export singleton instance
export const reputationService = ReputationService.getInstance();
