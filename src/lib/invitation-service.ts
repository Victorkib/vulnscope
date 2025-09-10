import crypto from 'crypto';

export interface InvitationData {
  teamId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationToken {
  token: string;
  expiresAt: string;
  createdAt: string;
}

export class InvitationService {
  private static instance: InvitationService;
  private readonly secretKey: string;
  private readonly tokenExpiryHours: number = 168; // 7 days

  private constructor() {
    this.secretKey = process.env.INVITATION_SECRET_KEY || process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
  }

  public static getInstance(): InvitationService {
    if (!InvitationService.instance) {
      InvitationService.instance = new InvitationService();
    }
    return InvitationService.instance;
  }

  /**
   * Generate a secure invitation token
   */
  public generateInvitationToken(invitationData: InvitationData): InvitationToken {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.tokenExpiryHours);
    
    const payload = {
      ...invitationData,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Create HMAC signature for security
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payloadString)
      .digest('hex');

    // Combine payload and signature
    const tokenData = {
      payload: payloadString,
      signature,
    };

    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64url');

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Validate and decode an invitation token
   */
  public validateInvitationToken(token: string): InvitationData | null {
    try {
      // Decode the token
      const tokenData = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
      
      if (!tokenData.payload || !tokenData.signature) {
        console.warn('[INVITATION SERVICE] Invalid token format');
        return null;
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(tokenData.payload)
        .digest('hex');

      if (tokenData.signature !== expectedSignature) {
        console.warn('[INVITATION SERVICE] Invalid token signature');
        return null;
      }

      // Parse payload
      const invitationData: InvitationData = JSON.parse(tokenData.payload);

      // Check expiration
      const expiresAt = new Date(invitationData.expiresAt);
      if (expiresAt < new Date()) {
        console.warn('[INVITATION SERVICE] Token expired');
        return null;
      }

      return invitationData;
    } catch (error) {
      console.error('[INVITATION SERVICE] Error validating token:', error);
      return null;
    }
  }

  /**
   * Check if a token is expired without full validation
   */
  public isTokenExpired(token: string): boolean {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
      const payload = JSON.parse(tokenData.payload);
      const expiresAt = new Date(payload.expiresAt);
      return expiresAt < new Date();
    } catch {
      return true; // If we can't parse it, consider it expired
    }
  }

  /**
   * Generate a secure invitation URL
   */
  public generateInvitationUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${base}/invitations/accept?token=${token}`;
  }

  /**
   * Extract token from URL
   */
  public extractTokenFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('token');
    } catch {
      return null;
    }
  }

  /**
   * Clean up expired invitations (utility method for maintenance)
   */
  public async cleanupExpiredInvitations(teams: any[]): Promise<number> {
    let cleanedCount = 0;
    
    for (const team of teams) {
      const validMembers = team.members.filter((member: any) => {
        if (member.status === 'pending' && member.invitationToken) {
          if (this.isTokenExpired(member.invitationToken)) {
            cleanedCount++;
            return false; // Remove expired invitation
          }
        }
        return true; // Keep valid members
      });

      if (validMembers.length !== team.members.length) {
        // Update team with cleaned members
        // This would need to be implemented with your database service
        console.log(`[INVITATION SERVICE] Cleaned ${team.members.length - validMembers.length} expired invitations from team ${team.id}`);
      }
    }

    return cleanedCount;
  }
}

// Export singleton instance
export const invitationService = InvitationService.getInstance();
