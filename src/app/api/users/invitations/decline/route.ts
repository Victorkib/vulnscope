import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { invitationService } from '@/lib/invitation-service';
import type { Team } from '@/types/collaboration';

/**
 * POST /api/users/invitations/decline - Decline a team invitation
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

    // Find pending invitation for this user with matching token
    const pendingMemberIndex = team.members.findIndex(
      member => member.email === user.email && 
                member.status === 'pending' && 
                member.invitationToken === invitationToken
    );

    if (pendingMemberIndex === -1) {
      return NextResponse.json(
        { error: 'No valid pending invitation found' },
        { status: 404 }
      );
    }

    // Remove the declined invitation from the team
    const updatedMembers = team.members.filter((_, index) => index !== pendingMemberIndex);

    await collection.updateOne(
      { id: invitationData.teamId },
      { 
        $set: { 
          members: updatedMembers,
          updatedAt: new Date().toISOString()
        }
      }
    );

    // Send notification to team members about invitation decline
    try {
      const teamMemberIds = team.members
        .filter(member => member.userId && member.status === 'active')
        .map(member => member.userId!);

      if (teamMemberIds.length > 0) {
        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}`,
          },
          body: JSON.stringify({
            teamId: invitationData.teamId,
            type: 'team_invitation_declined',
            title: 'Invitation Declined',
            message: `${user.email} declined the invitation to join "${team.name}"`,
            data: {
              teamId: invitationData.teamId,
              declinedBy: user.email,
              teamName: team.name,
            },
            priority: 'low',
          }),
        });

        if (!notificationResponse.ok) {
          console.warn('Failed to send team notification');
        }
      }
    } catch (notificationError) {
      console.warn('Error sending team notification:', notificationError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation declined successfully',
      team: {
        id: invitationData.teamId,
        name: team.name,
      }
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    return NextResponse.json(
      { error: 'Failed to decline invitation' },
      { status: 500 }
    );
  }
}
