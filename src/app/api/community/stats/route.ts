import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { CommunityStats } from '@/types/community';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vulnerabilityId = searchParams.get('vulnerabilityId');

    const db = await getDatabase();
    const commentsCollection = db.collection('vulnerability_comments');
    const votesCollection = db.collection('comment_votes');
    const reputationCollection = db.collection('user_reputation');

    // Build query for vulnerability-specific stats
    const query = vulnerabilityId ? { vulnerabilityId } : {};

    // Get total comments
    const totalComments = await commentsCollection.countDocuments(query);

    // Get total votes
    const totalVotes = await votesCollection.countDocuments();

    // Get active users (users who have commented in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await commentsCollection.distinct('userId', {
      ...query,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get top contributors
    const topContributors = await commentsCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$userId',
          displayName: { $first: '$userDisplayName' },
          commentsCount: { $sum: 1 },
        },
      },
      { $sort: { commentsCount: -1 } },
      { $limit: 10 },
    ]).toArray();

    // Get reputation data for top contributors
    const contributorIds = topContributors.map(c => c._id);
    const reputations = await reputationCollection.find({
      userId: { $in: contributorIds },
    }).toArray();

    const topContributorsWithReputation = topContributors.map(contributor => {
      const reputation = reputations.find(r => r.userId === contributor._id);
      return {
        userId: contributor._id,
        displayName: contributor.displayName,
        reputation: reputation?.totalScore || 0,
        commentsCount: contributor.commentsCount,
      };
    });

    // Get recent activity
    const recentComments = await commentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const recentVotes = await votesCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const recentActivity = [
      ...recentComments.map(comment => ({
        type: 'comment' as const,
        userId: comment.userId,
        displayName: comment.userDisplayName,
        timestamp: comment.createdAt.toISOString(),
        data: {
          vulnerabilityId: comment.vulnerabilityId,
          commentId: comment._id.toString(),
        },
      })),
      ...recentVotes.map(vote => ({
        type: 'vote' as const,
        userId: vote.userId,
        displayName: 'User', // We'd need to get this from user data
        timestamp: vote.createdAt,
        data: {
          commentId: vote.commentId,
          voteType: vote.voteType,
        },
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    const stats: CommunityStats = {
      totalComments,
      totalVotes,
      activeUsers: activeUsers.length,
      topContributors: topContributorsWithReputation,
      recentActivity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community stats' },
      { status: 500 }
    );
  }
}
