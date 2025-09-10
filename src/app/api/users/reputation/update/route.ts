import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { reputationService } from '@/lib/reputation-service';
import type { UserReputation } from '@/types/community';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, voteType, isNewVote, previousVoteType } = body;

    if (!userId || !voteType) {
      return NextResponse.json(
        { error: 'User ID and vote type are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const reputationCollection = db.collection<UserReputation>('user_reputation');

    // Get current reputation
    let reputation = await reputationCollection.findOne({ userId });

    if (!reputation) {
      // Create initial reputation record
      reputation = {
        _id: new ObjectId(),
        userId,
        totalScore: 0,
        level: 1,
        badges: [],
        stats: {
          commentsCount: 0,
          likesReceived: 0,
          dislikesReceived: 0,
          helpfulComments: 0,
          expertComments: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Update stats based on vote
    if (isNewVote) {
      if (voteType === 'like') {
        reputation.stats.likesReceived += 1;
      } else {
        reputation.stats.dislikesReceived += 1;
      }
    } else if (previousVoteType) {
      // Changing vote
      if (previousVoteType === 'like') {
        reputation.stats.likesReceived -= 1;
      } else {
        reputation.stats.dislikesReceived -= 1;
      }

      if (voteType === 'like') {
        reputation.stats.likesReceived += 1;
      } else {
        reputation.stats.dislikesReceived += 1;
      }
    }

    // Recalculate reputation score and level
    const db2 = await getDatabase();
    const votesCollection = db2.collection('comment_votes');
    const commentsCollection = db2.collection('vulnerability_comments');

    const votes = await votesCollection.find({ userId }).toArray();
    const commentsCount = await commentsCollection.countDocuments({ userId });

    reputation.totalScore = reputationService.calculateReputationScore(votes as any, commentsCount);
    reputation.level = reputationService.calculateUserLevel(reputation.totalScore);
    reputation.badges = reputationService.getEarnedBadges(reputation);
    reputation.updatedAt = new Date().toISOString();

    // Update or insert reputation
    await reputationCollection.replaceOne(
      { userId },
      reputation,
      { upsert: true }
    );

    return NextResponse.json({ success: true, reputation });
  } catch (error) {
    console.error('Error updating reputation:', error);
    return NextResponse.json(
      { error: 'Failed to update reputation' },
      { status: 500 }
    );
  }
}
