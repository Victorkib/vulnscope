import type { Notification } from '@/types/notification';
import { supabaseFreeTierService } from './supabase-free-tier-service';
import { getDatabase } from './mongodb';

export class NotificationService {
  private static instance: NotificationService;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send a notification to a user (with free tier optimizations and delivery tracking)
   */
  async sendNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: Record<string, unknown>,
    priority: Notification['priority'] = 'medium'
  ): Promise<void> {
    try {
      // Track API call for bandwidth monitoring
      supabaseFreeTierService.trackApiCall();

      const db = await getDatabase();
      const collection = db.collection<Notification>('notifications');

      const notification: Notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        title,
        message,
        data,
        isRead: false,
        priority,
        createdAt: new Date().toISOString(),
        deliveryStatus: 'pending',
        deliveryAttempts: 0,
      };

      await collection.insertOne(notification);

      // Send real-time notification via Supabase with delivery tracking
      try {
        const { supabase } = await import('@/lib/supabase-server');
        const supabaseClient = await supabase();
        
        if (supabaseClient) {
          await supabaseClient
            .from('notifications')
            .insert({
              id: notification.id,
              user_id: userId,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              data: notification.data,
              priority: notification.priority,
              timestamp: notification.createdAt,
            });

          // Update delivery status to delivered
          await collection.updateOne(
            { id: notification.id },
            {
              $set: {
                deliveryStatus: 'delivered',
                lastDeliveryAttempt: new Date().toISOString(),
              },
              $inc: { deliveryAttempts: 1 },
            }
          );
        } else {
          // Mark as failed if Supabase client is not available
          await collection.updateOne(
            { id: notification.id },
            {
              $set: {
                deliveryStatus: 'failed',
                lastDeliveryAttempt: new Date().toISOString(),
                deliveryError: 'Supabase client not available',
              },
              $inc: { deliveryAttempts: 1 },
            }
          );
        }
      } catch (realtimeError) {
        console.error('Error sending real-time notification:', realtimeError);
        
        // Update delivery status to failed
        await collection.updateOne(
          { id: notification.id },
          {
            $set: {
              deliveryStatus: 'failed',
              lastDeliveryAttempt: new Date().toISOString(),
              deliveryError: realtimeError instanceof Error ? realtimeError.message : 'Unknown error',
            },
            $inc: { deliveryAttempts: 1 },
          }
        );
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send vulnerability alert notification
   */
  async sendVulnerabilityAlert(
    userId: string,
    vulnerability: {
      cveId: string;
      title: string;
      severity: string;
      cvssScore?: number;
    }
  ): Promise<void> {
    const priority = vulnerability.severity === 'CRITICAL' ? 'critical' : 
                    vulnerability.severity === 'HIGH' ? 'high' : 'medium';

    await this.sendNotification(
      userId,
      'vulnerability_alert',
      `New ${vulnerability.severity} Vulnerability: ${vulnerability.cveId}`,
      `${vulnerability.title} has been discovered with CVSS score ${vulnerability.cvssScore || 'N/A'}`,
      {
        cveId: vulnerability.cveId,
        severity: vulnerability.severity,
        cvssScore: vulnerability.cvssScore,
      },
      priority
    );
  }

  /**
   * Send comment reply notification
   */
  async sendCommentReply(
    userId: string,
    comment: {
      id: string;
      content: string;
      author: string;
      vulnerabilityId: string;
    }
  ): Promise<void> {
    await this.sendNotification(
      userId,
      'comment_reply',
      'New Comment Reply',
      `${comment.author} replied to your comment on vulnerability ${comment.vulnerabilityId}`,
      {
        commentId: comment.id,
        vulnerabilityId: comment.vulnerabilityId,
        author: comment.author,
      },
      'medium'
    );
  }

  /**
   * Send bookmark update notification
   */
  async sendBookmarkUpdate(
    userId: string,
    bookmark: {
      vulnerabilityId: string;
      action: 'created' | 'updated' | 'deleted';
      title: string;
    }
  ): Promise<void> {
    const actionText = bookmark.action === 'created' ? 'added' :
                      bookmark.action === 'updated' ? 'updated' : 'removed';

    await this.sendNotification(
      userId,
      'bookmark_update',
      'Bookmark Updated',
      `Vulnerability ${bookmark.vulnerabilityId} has been ${actionText} from your bookmarks`,
      {
        vulnerabilityId: bookmark.vulnerabilityId,
        action: bookmark.action,
      },
      'low'
    );
  }

  /**
   * Send achievement unlocked notification
   */
  async sendAchievementUnlocked(
    userId: string,
    achievement: {
      id: string;
      title: string;
      description: string;
    }
  ): Promise<void> {
    await this.sendNotification(
      userId,
      'achievement_unlocked',
      'Achievement Unlocked! 🏆',
      `Congratulations! You've unlocked "${achievement.title}": ${achievement.description}`,
      {
        achievementId: achievement.id,
        title: achievement.title,
        description: achievement.description,
      },
      'medium'
    );
  }

  /**
   * Send system alert notification
   */
  async sendSystemAlert(
    userId: string,
    alert: {
      title: string;
      message: string;
      priority: Notification['priority'];
    }
  ): Promise<void> {
    await this.sendNotification(
      userId,
      'system_alert',
      alert.title,
      alert.message,
      {},
      alert.priority
    );
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotifications(
    userIds: string[],
    type: Notification['type'],
    title: string,
    message: string,
    data?: Record<string, unknown>,
    priority: Notification['priority'] = 'medium'
  ): Promise<void> {
    const promises = userIds.map(userId =>
      this.sendNotification(userId, type, title, message, data, priority)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Send vulnerability shared notification to team members
   */
  async sendVulnerabilitySharedToTeam(
    teamId: string,
    vulnerability: {
      cveId: string;
      title: string;
      severity: string;
      cvssScore?: number;
    },
    sharerName: string,
    message?: string,
    permissions?: {
      canView: boolean;
      canComment: boolean;
      canEdit: boolean;
      canShare: boolean;
    }
  ): Promise<void> {
    try {
      // Import team service to get team members
      const { teamService } = await import('./team-service');
      const teamMembers = await teamService.getTeamMembers(teamId);
      
      if (teamMembers.length === 0) {
        console.warn(`No active team members found for team ${teamId}`);
        return;
      }

      const priority = vulnerability.severity === 'CRITICAL' ? 'critical' : 
                      vulnerability.severity === 'HIGH' ? 'high' : 'medium';

      const title = `Vulnerability Shared: ${vulnerability.cveId}`;
      const notificationMessage = `${sharerName} shared a ${vulnerability.severity} vulnerability "${vulnerability.title}" with your team${message ? `: ${message}` : ''}`;

      // Send notifications to all team members
      const promises = teamMembers.map(member =>
        this.sendNotification(
          member.userId,
          'vulnerability_shared',
          title,
          notificationMessage,
          {
            vulnerabilityId: vulnerability.cveId,
            teamId,
            sharerName,
            severity: vulnerability.severity,
            cvssScore: vulnerability.cvssScore,
            permissions,
            message,
          },
          priority
        )
      );

      await Promise.allSettled(promises);
      
      console.log(`Sent vulnerability shared notifications to ${teamMembers.length} team members`);
    } catch (error) {
      console.error('Error sending vulnerability shared notification to team:', error);
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(maxRetries: number = 3): Promise<{ retried: number; successful: number; failed: number }> {
    try {
      const db = await getDatabase();
      const collection = db.collection<Notification>('notifications');

      // Find failed notifications that haven't exceeded max retries
      const failedNotifications = await collection.find({
        deliveryStatus: 'failed',
        deliveryAttempts: { $lt: maxRetries },
      }).toArray();

      let retried = 0;
      let successful = 0;
      let failed = 0;

      for (const notification of failedNotifications) {
        retried++;
        
        try {
          // Mark as retrying
          await collection.updateOne(
            { id: notification.id },
            {
              $set: {
                deliveryStatus: 'retrying',
                lastDeliveryAttempt: new Date().toISOString(),
              },
            }
          );

          // Attempt to resend via Supabase
          const { supabase } = await import('@/lib/supabase-server');
          const supabaseClient = await supabase();
          
          if (supabaseClient) {
            await supabaseClient
              .from('notifications')
              .insert({
                id: notification.id,
                user_id: notification.userId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                priority: notification.priority,
                timestamp: notification.createdAt,
              });

            // Mark as delivered
            await collection.updateOne(
              { id: notification.id },
              {
                $set: {
                  deliveryStatus: 'delivered',
                  lastDeliveryAttempt: new Date().toISOString(),
                },
                $inc: { deliveryAttempts: 1 },
              }
            );
            successful++;
          } else {
            // Mark as failed again
            await collection.updateOne(
              { id: notification.id },
              {
                $set: {
                  deliveryStatus: 'failed',
                  lastDeliveryAttempt: new Date().toISOString(),
                  deliveryError: 'Supabase client not available',
                },
                $inc: { deliveryAttempts: 1 },
              }
            );
            failed++;
          }
        } catch (retryError) {
          // Mark as failed again
          await collection.updateOne(
            { id: notification.id },
            {
              $set: {
                deliveryStatus: 'failed',
                lastDeliveryAttempt: new Date().toISOString(),
                deliveryError: retryError instanceof Error ? retryError.message : 'Unknown error',
              },
              $inc: { deliveryAttempts: 1 },
            }
          );
          failed++;
        }
      }

      return { retried, successful, failed };
    } catch (error) {
      console.error('Error retrying failed notifications:', error);
      return { retried: 0, successful: 0, failed: 0 };
    }
  }

  /**
   * Get notification delivery statistics
   */
  async getDeliveryStats(): Promise<{
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    retrying: number;
    deliveryRate: number;
  }> {
    try {
      const db = await getDatabase();
      const collection = db.collection<Notification>('notifications');

      const stats = await collection.aggregate([
        {
          $group: {
            _id: '$deliveryStatus',
            count: { $sum: 1 },
          },
        },
      ]).toArray();

      const total = stats.reduce((sum, stat) => sum + stat.count, 0);
      const delivered = stats.find(s => s._id === 'delivered')?.count || 0;
      const failed = stats.find(s => s._id === 'failed')?.count || 0;
      const pending = stats.find(s => s._id === 'pending')?.count || 0;
      const retrying = stats.find(s => s._id === 'retrying')?.count || 0;

      return {
        total,
        delivered,
        failed,
        pending,
        retrying,
        deliveryRate: total > 0 ? Math.round((delivered / total) * 100 * 100) / 100 : 0,
      };
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      return {
        total: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        retrying: 0,
        deliveryRate: 0,
      };
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
