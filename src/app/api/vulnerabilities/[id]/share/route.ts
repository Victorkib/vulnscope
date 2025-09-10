import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { emailService } from '@/lib/email-service';
import { notificationService } from '@/lib/notification-service';
import { teamService } from '@/lib/team-service';
import type { SharedVulnerability } from '@/types/collaboration';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: vulnerabilityId } = await params;
    const body = await request.json();
    const {
      shareWith,
      shareType,
      message,
      permissions = {
        canView: true,
        canComment: true,
        canEdit: false,
        canShare: false,
      },
      expiresAt,
    } = body;

    if (!shareWith || !shareType) {
      return NextResponse.json(
        { error: 'Share target and type are required' },
        { status: 400 }
      );
    }

    if (!['user', 'team'].includes(shareType)) {
      return NextResponse.json(
        { error: 'Share type must be "user" or "team"' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<SharedVulnerability>('shared_vulnerabilities');

    // Validate team sharing
    if (shareType === 'team') {
      const teamsCollection = db.collection('teams');
      const team = await teamsCollection.findOne({ id: shareWith });
      
      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }

      // Check if user is a member of the team
      const isMember = team.ownerId === user.id || 
        team.members.some((member: any) => member.userId === user.id);
      
      if (!isMember) {
        return NextResponse.json(
          { error: 'You are not a member of this team' },
          { status: 403 }
        );
      }
    }

    // Check if already shared
    const existingShare = await collection.findOne({
      vulnerabilityId,
      sharedBy: user.id,
      shareWith,
      shareType,
    });

    if (existingShare) {
      return NextResponse.json(
        { error: 'Vulnerability already shared with this target' },
        { status: 409 }
      );
    }

    const sharedVulnerability: SharedVulnerability = {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vulnerabilityId,
      sharedBy: user.id,
      sharedWith: shareWith,
      shareType,
      message,
      permissions,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    await collection.insertOne(sharedVulnerability);

    // Get vulnerability details for email notification
    let vulnerabilityDetails = null;
    try {
      const vulnCollection = db.collection('vulnerabilities');
      vulnerabilityDetails = await vulnCollection.findOne({ cveId: vulnerabilityId });
    } catch (error) {
      console.warn('Failed to fetch vulnerability details for notification:', error);
    }

    // Send email notification for individual user sharing
    if (shareType === 'user' && vulnerabilityDetails) {
      try {
        await emailService.sendVulnerabilitySharedNotification(
          shareWith,
          vulnerabilityDetails,
          user.user_metadata?.display_name || user.email?.split('@')[0] || 'Team Member',
          message,
          permissions
        );
      } catch (emailError) {
        console.warn('Failed to send vulnerability shared email:', emailError);
      }
    }

    // Send notifications based on share type
    if (shareType === 'team' && vulnerabilityDetails) {
      try {
        // Send team-based notifications
        await notificationService.sendVulnerabilitySharedToTeam(
          shareWith,
          {
            cveId: vulnerabilityDetails.cveId,
            title: vulnerabilityDetails.title,
            severity: vulnerabilityDetails.severity,
            cvssScore: vulnerabilityDetails.cvssScore,
          },
          user.user_metadata?.display_name || user.email?.split('@')[0] || 'Team Member',
          message,
          permissions
        );

        // Also send email notifications to team members with rate limiting
        const teamMemberEmails = await teamService.getTeamMemberEmails(shareWith);
        
        // Send emails in batches to respect rate limits
        const batchSize = 3; // Send 3 emails at a time
        const batchDelay = 2000; // Wait 2 seconds between batches
        
        for (let i = 0; i < teamMemberEmails.length; i += batchSize) {
          const batch = teamMemberEmails.slice(i, i + batchSize);
          
          const emailPromises = batch.map(email =>
            emailService.sendVulnerabilitySharedNotification(
              email,
              vulnerabilityDetails,
              user.user_metadata?.display_name || user.email?.split('@')[0] || 'Team Member',
              message,
              permissions
            ).catch(emailError => {
              console.warn(`Failed to send email to ${email}:`, emailError);
            })
          );
          
          await Promise.allSettled(emailPromises);
          
          // Wait between batches (except for the last batch)
          if (i + batchSize < teamMemberEmails.length) {
            await new Promise(resolve => setTimeout(resolve, batchDelay));
          }
        }
      } catch (error) {
        console.warn('Error sending team notifications for shared vulnerability:', error);
      }
    } else if (shareType === 'user' && vulnerabilityDetails) {
      try {
        // Send individual user notification
        await notificationService.sendNotification(
          shareWith, // This should be userId, but we're using email for now
          'vulnerability_shared',
          `Vulnerability Shared: ${vulnerabilityDetails.cveId}`,
          `${user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'} shared a ${vulnerabilityDetails.severity} vulnerability "${vulnerabilityDetails.title}" with you${message ? `: ${message}` : ''}`,
          {
            vulnerabilityId: vulnerabilityDetails.cveId,
            sharedBy: user.id,
            shareType,
            permissions,
            message,
          },
          vulnerabilityDetails.severity === 'CRITICAL' ? 'critical' : 
          vulnerabilityDetails.severity === 'HIGH' ? 'high' : 'medium'
        );
      } catch (error) {
        console.warn('Error sending individual notification for shared vulnerability:', error);
      }
    }

    return NextResponse.json(sharedVulnerability, { status: 201 });
  } catch (error) {
    console.error('Error sharing vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to share vulnerability' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: vulnerabilityId } = await params;
    const db = await getDatabase();
    const collection = db.collection<SharedVulnerability>('shared_vulnerabilities');

    // Get shares where user is the sharer or the target
    const shares = await collection
      .find({
        vulnerabilityId,
        $or: [
          { sharedBy: user.id },
          { sharedWith: user.id }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Remove MongoDB _id fields
    const cleanShares = shares.map(({ _id, ...share }) => share);

    return NextResponse.json(cleanShares);
  } catch (error) {
    console.error('Error fetching vulnerability shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerability shares' },
      { status: 500 }
    );
  }
}
