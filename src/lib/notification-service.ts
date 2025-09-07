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
   * Send a notification to a user (with free tier optimizations)
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
      };

      await collection.insertOne(notification);

      // Send real-time notification via Supabase
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
        }
      } catch (realtimeError) {
        console.error('Error sending real-time notification:', realtimeError);
        // Don't fail the request if real-time fails
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
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
