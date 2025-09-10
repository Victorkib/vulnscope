'use client';

import type { InvitationCheckResult } from './user-invitation-service';

export interface PendingInvitation {
  teamId: string;
  teamName: string;
  teamDescription?: string;
  role: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  invitationToken: string;
}

export class ClientInvitationService {
  private static instance: ClientInvitationService;

  private constructor() {}

  public static getInstance(): ClientInvitationService {
    if (!ClientInvitationService.instance) {
      ClientInvitationService.instance = new ClientInvitationService();
    }
    return ClientInvitationService.instance;
  }

  /**
   * Check and process pending invitations via API
   */
  public async checkAndProcessPendingInvitations(): Promise<InvitationCheckResult> {
    try {
      const response = await fetch('/api/users/invitations/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to check invitations');
      }

      return result.data;
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
   * Get pending invitations via API
   */
  public async getPendingInvitations(): Promise<PendingInvitation[]> {
    try {
      const response = await fetch('/api/users/invitations/pending', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get pending invitations');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const clientInvitationService = ClientInvitationService.getInstance();
