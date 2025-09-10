import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { notificationService } from '@/lib/notification-service';
import type { Team } from '@/types/collaboration';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;
    const db = await getDatabase();
    const collection = db.collection<Team>('teams');

    const team = await collection.findOne({ id: teamId });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is a member of the team
    const isMember = team.ownerId === user.id || 
      team.members.some(member => member.userId === user.id);

    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Remove MongoDB _id field
    const { _id, ...cleanTeam } = team;

    return NextResponse.json(cleanTeam);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;
    const body = await request.json();
    const { name, description, settings } = body;

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');

    const team = await collection.findOne({ id: teamId });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (team.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only team owner can update team' }, { status: 403 });
    }

    const updateData: Partial<Team> = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (settings) updateData.settings = { ...team.settings, ...settings };

    await collection.updateOne(
      { id: teamId },
      { $set: updateData }
    );

    // Send notifications to all team members about the update
    try {
      const teamMemberIds = team.members
        .filter(member => member.userId && member.status === 'active')
        .map(member => member.userId!);

      if (teamMemberIds.length > 0) {
        await notificationService.sendBulkNotifications(
          teamMemberIds,
          'system_alert',
          'Team Updated',
          `Team "${team.name}" has been updated by ${user.user_metadata?.display_name || user.email}`,
          {
            teamId,
            teamName: team.name,
            updatedBy: user.id,
            changes: Object.keys(updateData).filter(key => key !== 'updatedAt'),
          },
          'medium'
        );
      }
    } catch (notificationError) {
      // Log error but don't fail the team update
      console.error('Error sending team update notifications:', notificationError);
    }

    const updatedTeam = await collection.findOne({ id: teamId });
    const { _id, ...cleanTeam } = updatedTeam!;

    return NextResponse.json(cleanTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;
    const db = await getDatabase();
    const collection = db.collection<Team>('teams');

    const team = await collection.findOne({ id: teamId });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (team.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only team owner can delete team' }, { status: 403 });
    }

    // Send notifications to all team members about the deletion
    try {
      const teamMemberIds = team.members
        .filter(member => member.userId && member.status === 'active')
        .map(member => member.userId!);

      if (teamMemberIds.length > 0) {
        await notificationService.sendBulkNotifications(
          teamMemberIds,
          'system_alert',
          'Team Deleted',
          `Team "${team.name}" has been deleted by ${user.user_metadata?.display_name || user.email}`,
          {
            teamId,
            teamName: team.name,
            deletedBy: user.id,
          },
          'high'
        );
      }
    } catch (notificationError) {
      // Log error but don't fail the team deletion
      console.error('Error sending team deletion notifications:', notificationError);
    }

    await collection.deleteOne({ id: teamId });

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
