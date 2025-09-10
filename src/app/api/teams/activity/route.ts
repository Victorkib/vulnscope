import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { teamService } from '@/lib/team-service';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team IDs
    const userTeamIds = await teamService.getUserTeamIds(user.id);
    
    if (userTeamIds.length === 0) {
      return NextResponse.json([]);
    }

    const db = await getDatabase();
    const activity = [];

    // Get recent shared vulnerabilities
    const sharedVulnsCollection = db.collection('shared_vulnerabilities');
    const recentShares = await sharedVulnsCollection
      .find({
        $or: [
          { sharedBy: user.id },
          { sharedWith: { $in: userTeamIds } }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Add shared vulnerabilities to activity
    for (const share of recentShares) {
      activity.push({
        id: share.id,
        type: 'share',
        description: `Vulnerability ${share.vulnerabilityId} shared with ${share.shareType === 'team' ? 'team' : 'user'}`,
        createdAt: share.createdAt,
        data: {
          vulnerabilityId: share.vulnerabilityId,
          shareType: share.shareType,
          sharedBy: share.sharedBy,
        }
      });
    }

    // Get recent discussions
    const discussionsCollection = db.collection('discussions');
    const recentDiscussions = await discussionsCollection
      .find({
        teamId: { $in: userTeamIds }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Add discussions to activity
    for (const discussion of recentDiscussions) {
      activity.push({
        id: discussion.id,
        type: 'discussion',
        description: `Discussion "${discussion.title}" started in team`,
        createdAt: discussion.createdAt,
        data: {
          discussionId: discussion.id,
          title: discussion.title,
          teamId: discussion.teamId,
        }
      });
    }

    // Sort all activity by creation date
    activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Return top 10 activities
    return NextResponse.json(activity.slice(0, 10));

  } catch (error) {
    console.error('Error fetching team activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team activity' },
      { status: 500 }
    );
  }
}
