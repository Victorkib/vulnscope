import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { emailService } from '@/lib/email-service';
import { notificationService } from '@/lib/notification-service';
import { invitationService } from '@/lib/invitation-service';
import type { Team, TeamMember } from '@/types/collaboration';

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

    return NextResponse.json(team.members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { email, role = 'member' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');

    const team = await collection.findOne({ id: teamId });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is the owner or admin
    const userMember = team.members.find(member => member.userId === user.id);
    if (team.ownerId !== user.id && (!userMember || !['owner', 'admin'].includes(userMember.role))) {
      return NextResponse.json({ error: 'Only team owners and admins can add members' }, { status: 403 });
    }

    // Check if member already exists
    const existingMember = team.members.find(member => member.email === email);
    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this team' },
        { status: 409 }
      );
    }

    // Generate secure invitation token
    const invitationData = {
      teamId,
      email,
      role: role as 'admin' | 'member' | 'viewer',
      invitedBy: user.id,
      expiresAt: '', // Will be set by the service
      createdAt: new Date().toISOString(),
    };

    const invitationToken = invitationService.generateInvitationToken(invitationData);

    // Create new member with secure invitation token
    const newMember: TeamMember = {
      userId: `invited_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Placeholder until user accepts invitation
      email,
      displayName: email.split('@')[0],
      role: role as 'admin' | 'member' | 'viewer',
      joinedAt: new Date().toISOString(),
      invitedBy: user.id,
      status: 'pending',
      invitationToken: invitationToken.token,
      invitationExpiresAt: invitationToken.expiresAt,
    };

    await collection.updateOne(
      { id: teamId },
      { 
        $push: { members: newMember },
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    // Send email invitation to the new member
    try {
      const invitationUrl = invitationService.generateInvitationUrl(invitationToken.token);
      const emailResult = await emailService.sendTeamInvitation(
        email,
        team.name,
        user.user_metadata?.display_name || user.email?.split('@')[0] || 'Team Member',
        role,
        team.description,
        invitationUrl
      );
      
      if (emailResult.success) {
        console.log(`[TEAM INVITATION] Email sent successfully to ${email} for team ${team.name}`);
      } else {
        console.warn(`[TEAM INVITATION] Email failed to ${email} for team ${team.name}:`, emailResult.error);
      }
    } catch (emailError) {
      console.warn('[TEAM INVITATION] Failed to send team invitation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification to team members about new member
    try {
      const teamMemberIds = team.members
        .filter(member => member.userId && member.status === 'active')
        .map(member => member.userId!);

      if (teamMemberIds.length > 0) {
        await notificationService.sendBulkNotifications(
          teamMemberIds,
          'system_alert',
          'New Team Member',
          `${email} has been added to the team "${team.name}"`,
          {
            teamId,
            newMemberEmail: email,
            newMemberRole: role,
            addedBy: user.id,
          },
          'medium'
        );
      }
    } catch (notificationError) {
      // Log error but don't fail the member addition
      console.error('Error sending team member addition notifications:', notificationError);
    }

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');

    const team = await collection.findOne({ id: teamId });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is the owner or admin
    const userMember = team.members.find(member => member.userId === user.id);
    if (team.ownerId !== user.id && (!userMember || !['owner', 'admin'].includes(userMember.role))) {
      return NextResponse.json({ error: 'Only team owners and admins can remove members' }, { status: 403 });
    }

    // Check if trying to remove the owner
    if (memberId === team.ownerId) {
      return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 400 });
    }

    // Find the member being removed to get their details
    const memberToRemove = team.members.find(member => member.userId === memberId);
    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    await collection.updateOne(
      { id: teamId },
      { 
        $pull: { members: { userId: memberId } },
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    // Send notifications to remaining team members about the removal
    try {
      const remainingMemberIds = team.members
        .filter(member => member.userId && member.userId !== memberId && member.status === 'active')
        .map(member => member.userId!);

      if (remainingMemberIds.length > 0) {
        await notificationService.sendBulkNotifications(
          remainingMemberIds,
          'system_alert',
          'Team Member Removed',
          `${memberToRemove.displayName || memberToRemove.email} has been removed from the team "${team.name}"`,
          {
            teamId,
            removedMemberId: memberId,
            removedMemberEmail: memberToRemove.email,
            removedMemberName: memberToRemove.displayName,
            removedBy: user.id,
          },
          'medium'
        );
      }

      // Send notification to the removed member
      if (memberToRemove.userId && memberToRemove.userId.startsWith('user_')) {
        await notificationService.sendNotification(
          memberToRemove.userId,
          'system_alert',
          'Removed from Team',
          `You have been removed from the team "${team.name}"`,
          {
            teamId,
            teamName: team.name,
            removedBy: user.id,
          },
          'high'
        );
      }
    } catch (notificationError) {
      // Log error but don't fail the member removal
      console.error('Error sending team member removal notifications:', notificationError);
    }

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
