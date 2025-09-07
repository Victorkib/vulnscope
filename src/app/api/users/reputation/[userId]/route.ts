import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { reputationService } from '@/lib/reputation-service';
import type { UserReputation } from '@/types/community';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const db = await getDatabase();
    const reputationCollection = db.collection<UserReputation>('user_reputation');

    // Get user reputation
    let reputation = await reputationCollection.findOne({ userId });

    if (!reputation) {
      // Create initial reputation record
      reputation = {
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

      await reputationCollection.insertOne(reputation);
    }

    // Remove MongoDB _id field
    const { _id, ...cleanReputation } = reputation;

    return NextResponse.json(cleanReputation);
  } catch (error) {
    console.error('Error fetching user reputation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user reputation' },
      { status: 500 }
    );
  }
}
