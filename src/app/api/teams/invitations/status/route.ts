import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { Team } from '@/types/collaboration';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');

    const team = await collection.findOne({ id: teamId });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user has any invitation status for this team
    const member = team.members.find(member => member.email === user.email);

    if (!member) {
      return NextResponse.json({
        hasInvitation: false,
        status: 'none',
        team: null,
      });
    }

    return NextResponse.json({
      hasInvitation: true,
      status: member.status,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        role: member.role,
      },
      member: {
        email: member.email,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        invitedBy: member.invitedBy,
      }
    });
  } catch (error) {
    console.error('Error checking team invitation status:', error);
    return NextResponse.json(
      { error: 'Failed to check invitation status' },
      { status: 500 }
    );
  }
}
