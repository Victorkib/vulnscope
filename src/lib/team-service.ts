import { getDatabase } from '@/lib/mongodb';
import type { Team } from '@/types/collaboration';

export interface UserTeam {
  id: string;
  name: string;
  description?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
}

export class TeamService {
  private static instance: TeamService;

  private constructor() {}

  public static getInstance(): TeamService {
    if (!TeamService.instance) {
      TeamService.instance = new TeamService();
    }
    return TeamService.instance;
  }

  /**
   * Get all teams that a user is a member of
   */
  public async getUserTeams(userId: string): Promise<UserTeam[]> {
    try {
      const db = await getDatabase();
      const collection = db.collection<Team>('teams');

      const teams = await collection.find({
        'members.userId': userId,
        'members.status': 'active'
      }).toArray();

      const userTeams: UserTeam[] = [];

      for (const team of teams) {
        const member = team.members.find(
          member => member.userId === userId && member.status === 'active'
        );

        if (member) {
          userTeams.push({
            id: team.id,
            name: team.name,
            description: team.description,
            role: member.role,
            status: member.status,
            joinedAt: member.joinedAt,
          });
        }
      }

      return userTeams;
    } catch (error) {
      console.error('Error getting user teams:', error);
      return [];
    }
  }

  /**
   * Get all team IDs that a user is a member of
   */
  public async getUserTeamIds(userId: string): Promise<string[]> {
    const userTeams = await this.getUserTeams(userId);
    return userTeams.map(team => team.id);
  }

  /**
   * Check if a user is a member of a specific team
   */
  public async isUserTeamMember(userId: string, teamId: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const collection = db.collection<Team>('teams');

      const team = await collection.findOne({
        id: teamId,
        'members.userId': userId,
        'members.status': 'active'
      });

      return !!team;
    } catch (error) {
      console.error('Error checking team membership:', error);
      return false;
    }
  }

  /**
   * Get user's role in a specific team
   */
  public async getUserTeamRole(userId: string, teamId: string): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
    try {
      const db = await getDatabase();
      const collection = db.collection<Team>('teams');

      const team = await collection.findOne({ id: teamId });

      if (!team) {
        return null;
      }

      // Check if user is the owner
      if (team.ownerId === userId) {
        return 'owner';
      }

      // Check if user is a member
      const member = team.members.find(
        member => member.userId === userId && member.status === 'active'
      );

      return member ? member.role : null;
    } catch (error) {
      console.error('Error getting user team role:', error);
      return null;
    }
  }

  /**
   * Check if a user has permission to perform an action in a team
   */
  public async hasTeamPermission(
    userId: string, 
    teamId: string, 
    action: 'view' | 'comment' | 'create' | 'edit' | 'delete' | 'admin'
  ): Promise<boolean> {
    try {
      const role = await this.getUserTeamRole(userId, teamId);
      
      if (!role) {
        return false;
      }

      // Define role-based permissions
      const permissions = {
        owner: ['view', 'comment', 'create', 'edit', 'delete', 'admin'],
        admin: ['view', 'comment', 'create', 'edit', 'delete'],
        member: ['view', 'comment', 'create', 'edit'],
        viewer: ['view', 'comment'],
      };

      return permissions[role].includes(action);
    } catch (error) {
      console.error('Error checking team permission:', error);
      return false;
    }
  }

  /**
   * Get team details by ID
   */
  public async getTeamById(teamId: string): Promise<Team | null> {
    try {
      const db = await getDatabase();
      const collection = db.collection<Team>('teams');

      const team = await collection.findOne({ id: teamId });
      return team;
    } catch (error) {
      console.error('Error getting team by ID:', error);
      return null;
    }
  }

  /**
   * Get all team members for a specific team
   */
  public async getTeamMembers(teamId: string): Promise<Array<{
    userId: string;
    email: string;
    displayName: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    status: 'active' | 'pending' | 'suspended';
  }>> {
    try {
      const db = await getDatabase();
      const collection = db.collection<Team>('teams');
      const team = await collection.findOne({ id: teamId });
      
      if (!team) {
        return [];
      }

      // Return all team members (excluding pending invitations)
      return team.members.filter(member => member.status === 'active');
    } catch (error) {
      console.error('Error getting team members:', error);
      return [];
    }
  }

  /**
   * Get team member emails for notifications
   */
  public async getTeamMemberEmails(teamId: string): Promise<string[]> {
    try {
      const members = await this.getTeamMembers(teamId);
      return members.map(member => member.email);
    } catch (error) {
      console.error('Error getting team member emails:', error);
      return [];
    }
  }
}

// Export singleton instance
export const teamService = TeamService.getInstance();
