import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { invitationService } from '@/lib/invitation-service';
import type { Team, TeamMember } from '@/types/collaboration';

export interface PendingInvitation {
  id: string;
  teamId: string;
  teamName: string;
  teamDescription?: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  expiresAt: string;
  invitationToken: string;
  invitationUrl: string;
}

/**
 * GET /api/users/invitations - Get pending invitations for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');

    // Find all teams where the user has pending invitations
    const teams = await collection.find({
      'members.email': user.email,
      'members.status': 'pending'
    }).toArray();

    const pendingInvitations: PendingInvitation[] = [];

    for (const team of teams) {
      const pendingMember = team.members.find(
        member => member.email === user.email && member.status === 'pending'
      );

      if (pendingMember && pendingMember.invitationToken) {
        // Check if invitation is still valid
        if (!invitationService.isTokenExpired(pendingMember.invitationToken)) {
          // Get inviter information
          const inviter = team.members.find(member => member.userId === pendingMember.invitedBy);
          const inviterName = inviter?.displayName || 'Team Member';

          pendingInvitations.push({
            id: `${team.id}_${pendingMember.email}`,
            teamId: team.id,
            teamName: team.name,
            teamDescription: team.description,
            role: pendingMember.role as 'admin' | 'member' | 'viewer',
            invitedBy: pendingMember.invitedBy,
            invitedByName: inviterName,
            invitedAt: pendingMember.joinedAt,
            expiresAt: pendingMember.invitationExpiresAt || '',
            invitationToken: pendingMember.invitationToken,
            invitationUrl: invitationService.generateInvitationUrl(pendingMember.invitationToken),
          });
        }
      }
    }

    return NextResponse.json({
      invitations: pendingInvitations,
      count: pendingInvitations.length,
    });
  } catch (error) {
    console.error('Error fetching user invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/invitations/[id]/accept - Accept a specific invitation
 */
export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invitationToken } = body;

    if (!invitationToken) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Validate the invitation token
    const invitationData = invitationService.validateInvitationToken(invitationToken);
    if (!invitationData) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 400 }
      );
    }

    // Verify the token is for the current user's email
    if (invitationData.email !== user.email) {
      return NextResponse.json(
        { error: 'This invitation is not for your email address' },
        { status: 403 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Team>('teams');

    const team = await collection.findOne({ id: invitationData.teamId });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = team.members.find(member => member.email === user.email);
    if (existingMember && existingMember.status === 'active') {
      return NextResponse.json(
        { error: 'You are already a member of this team' },
        { status: 409 }
      );
    }

    // Find pending invitation for this user with matching token
    const pendingMember = team.members.find(
      member => member.email === user.email && 
                member.status === 'pending' && 
                member.invitationToken === invitationToken
    );

    if (!pendingMember) {
      return NextResponse.json(
        { error: 'No valid pending invitation found' },
        { status: 404 }
      );
    }

    // Update member status to active and clean up invitation token
    const updatedMember: TeamMember = {
      ...pendingMember,
      userId: user.id,
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      status: 'active',
      // Remove invitation token and expiration after successful acceptance
      invitationToken: undefined,
      invitationExpiresAt: undefined,
    };

    await collection.updateOne(
      { id: invitationData.teamId, 'members.email': user.email },
      { 
        $set: { 
          'members.$': updatedMember,
          updatedAt: new Date().toISOString()
        }
      }
    );

    // Send notification to team members about new member acceptance
    try {
      const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          teamId: invitationData.teamId,
          type: 'team_member_joined',
          title: 'Team Member Joined',
          message: `${user.email} has joined the team "${team.name}"`,
          data: {
            teamId: invitationData.teamId,
            newMemberEmail: user.email,
            newMemberRole: pendingMember.role,
            joinedBy: user.id,
          },
          priority: 'medium',
        }),
      });

      if (!notificationResponse.ok) {
        console.warn('Failed to send team notification');
      }
    } catch (notificationError) {
      console.warn('Error sending team notification:', notificationError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully joined the team',
      team: {
        id: invitationData.teamId,
        name: team.name,
        description: team.description,
      }
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
