import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { Team } from '@/types/collaboration';

export async function GET() {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');

    // Get teams where user is a member
    const teams = await collection
      .find({
        $or: [
          { ownerId: user.id },
          { 'members.userId': user.id }
        ]
      })
      .sort({ updatedAt: -1 })
      .toArray();

    // Remove MongoDB _id fields
    const cleanTeams = teams.map(({ _id, ...team }) => team);

    return NextResponse.json(cleanTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
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
    const { name, description, settings } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');

    const team: Team = {
      id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      ownerId: user.id,
      members: [
        {
          userId: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          role: 'owner',
          joinedAt: new Date().toISOString(),
          invitedBy: user.id,
          status: 'active',
        }
      ],
      settings: {
        allowMemberInvites: true,
        requireApprovalForJoins: false,
        allowPublicDiscussions: true,
        defaultMemberRole: 'member',
        notificationSettings: {
          newMembers: true,
          newDiscussions: true,
          vulnerabilityUpdates: true,
        },
        ...settings,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await collection.insertOne(team);

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
