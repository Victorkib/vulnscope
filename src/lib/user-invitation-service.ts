import { getDatabase } from '@/lib/mongodb';
import { invitationService } from './invitation-service';
import type { Team, TeamMember } from '@/types/collaboration';

export interface InvitationCheckResult {
  hasPendingInvitations: boolean;
  invitations: Array<{
    teamId: string;
    teamName: string;
    role: string;
    invitationToken: string;
  }>;
  autoAcceptedCount: number;
}

export class UserInvitationService {
  private static instance: UserInvitationService;

  private constructor() {}

  public static getInstance(): UserInvitationService {
    if (!UserInvitationService.instance) {
      UserInvitationService.instance = new UserInvitationService();
    }
    return UserInvitationService.instance;
  }

  /**
   * Check for pending invitations when a user signs up or logs in
   */
  public async checkAndProcessPendingInvitations(
    userEmail: string,
    userId: string,
    userDisplayName: string
  ): Promise<InvitationCheckResult> {
    try {
      const db = await getDatabase();
      const collection = db.collection<Team>('teams');

      // Find all teams where the user has pending invitations
      const teams = await collection.find({
        'members.email': userEmail,
        'members.status': 'pending'
      }).toArray();

      const result: InvitationCheckResult = {
        hasPendingInvitations: false,
        invitations: [],
        autoAcceptedCount: 0,
      };

      for (const team of teams) {
        const pendingMemberIndex = team.members.findIndex(
          member => member.email === userEmail && member.status === 'pending'
        );

        if (pendingMemberIndex !== -1) {
          const pendingMember = team.members[pendingMemberIndex];
          
          if (pendingMember.invitationToken) {
            // Check if invitation is still valid
            if (!invitationService.isTokenExpired(pendingMember.invitationToken)) {
              result.hasPendingInvitations = true;
              result.invitations.push({
                teamId: team.id,
                teamName: team.name,
                role: pendingMember.role,
                invitationToken: pendingMember.invitationToken,
              });

              // Auto-accept the invitation
              const updatedMember: TeamMember = {
                ...pendingMember,
                userId: userId,
                displayName: userDisplayName,
                status: 'active',
                // Remove invitation token and expiration after successful acceptance
                invitationToken: undefined,
                invitationExpiresAt: undefined,
              };

              // Update the team member
              const updatedMembers = [...team.members];
              updatedMembers[pendingMemberIndex] = updatedMember;

              await collection.updateOne(
                { id: team.id },
                { 
                  $set: { 
                    members: updatedMembers,
                    updatedAt: new Date().toISOString()
                  }
                }
              );

              result.autoAcceptedCount++;

              // Send notification to team members about new member acceptance
              try {
                const teamMemberIds = team.members
                  .filter(member => member.userId && member.status === 'active')
                  .map(member => member.userId!);

                if (teamMemberIds.length > 0) {
                  await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/notifications`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${userId}`,
                    },
                    body: JSON.stringify({
                      teamId: team.id,
                      type: 'team_member_joined',
                      title: 'Team Member Joined',
                      message: `${userEmail} has joined the team "${team.name}"`,
                      data: {
                        teamId: team.id,
                        newMemberEmail: userEmail,
                        newMemberRole: pendingMember.role,
                        joinedBy: userId,
                        autoAccepted: true,
                      },
                      priority: 'medium',
                    }),
                  });
                }
              } catch (notificationError) {
                console.warn('Error sending team notification:', notificationError);
              }
            } else {
              // Remove expired invitation
              const updatedMembers = team.members.filter((_, index) => index !== pendingMemberIndex);
              await collection.updateOne(
                { id: team.id },
                { 
                  $set: { 
                    members: updatedMembers,
                    updatedAt: new Date().toISOString()
                  }
                }
              );
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error checking pending invitations:', error);
      return {
        hasPendingInvitations: false,
        invitations: [],
        autoAcceptedCount: 0,
      };
    }
  }

  /**
   * Get pending invitations for a user (without auto-accepting)
   */
  public async getPendingInvitations(userEmail: string): Promise<Array<{
    teamId: string;
    teamName: string;
    teamDescription?: string;
    role: string;
    invitedBy: string;
    invitedAt: string;
    expiresAt: string;
    invitationToken: string;
  }>> {
    try {
      const db = await getDatabase();
      const collection = db.collection<Team>('teams');

      const teams = await collection.find({
        'members.email': userEmail,
        'members.status': 'pending'
      }).toArray();

      const invitations = [];

      for (const team of teams) {
        const pendingMember = team.members.find(
          member => member.email === userEmail && member.status === 'pending'
        );

        if (pendingMember && pendingMember.invitationToken) {
          if (!invitationService.isTokenExpired(pendingMember.invitationToken)) {
            const inviter = team.members.find(member => member.userId === pendingMember.invitedBy);
            
            invitations.push({
              teamId: team.id,
              teamName: team.name,
              teamDescription: team.description,
              role: pendingMember.role,
              invitedBy: pendingMember.invitedBy,
              invitedAt: pendingMember.joinedAt,
              expiresAt: pendingMember.invitationExpiresAt || '',
              invitationToken: pendingMember.invitationToken,
            });
          }
        }
      }

      return invitations;
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const userInvitationService = UserInvitationService.getInstance();
