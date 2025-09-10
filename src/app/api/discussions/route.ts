import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { emailService } from '@/lib/email-service';
import { teamService } from '@/lib/team-service';
import type { Discussion } from '@/types/collaboration';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vulnerabilityId = searchParams.get('vulnerabilityId');
    const teamId = searchParams.get('teamId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDatabase();
    const collection = db.collection<Discussion>('discussions');

    // Build query
    const query: any = {};
    if (vulnerabilityId) {
      query.vulnerabilityId = vulnerabilityId;
    }
    if (teamId) {
      query.teamId = teamId;
    }

    // Get user's team memberships for proper permission checking
    const userTeamIds = await teamService.getUserTeamIds(user.id);
    
    // Build permission-based query
    const permissionQueries = [
      { isPublic: true }, // Public discussions
      { authorId: user.id } // User's own discussions
    ];

    // Add team-based discussions if user is a member of any teams
    if (userTeamIds.length > 0) {
      permissionQueries.push({
        teamId: { $in: userTeamIds }
      });
    }

    query.$or = permissionQueries;

    const discussions = await collection
      .find(query)
      .sort({ lastActivityAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Remove MongoDB _id fields
    const cleanDiscussions = discussions.map(({ _id, ...discussion }) => discussion);

    return NextResponse.json(cleanDiscussions);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vulnerabilityId,
      title,
      description,
      teamId,
      isPublic = true,
      tags = [],
    } = body;

    if (!vulnerabilityId || !title) {
      return NextResponse.json(
        { error: 'Vulnerability ID and title are required' },
        { status: 400 }
      );
    }

    // Check team permissions if creating a team discussion
    if (teamId) {
      const hasPermission = await teamService.hasTeamPermission(user.id, teamId, 'create');
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'You do not have permission to create discussions in this team' },
          { status: 403 }
        );
      }
    }

    const db = await getDatabase();
    const collection = db.collection<Discussion>('discussions');

    const discussion: Discussion = {
      id: `discussion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      teamId,
      vulnerabilityId,
      title,
      description,
      authorId: user.id,
      authorEmail: user.email || '',
      authorDisplayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      isPublic,
      isPinned: false,
      tags,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      participantCount: 1,
      messageCount: 0,
    };

    await collection.insertOne(discussion);

    return NextResponse.json(discussion, { status: 201 });
  } catch (error) {
    console.error('Error creating discussion:', error);
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
}
