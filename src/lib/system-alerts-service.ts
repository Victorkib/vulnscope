import { notificationService } from './notification-service';
import { getDatabase } from './mongodb';

export interface SystemAlert {
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  alertType: 'system_maintenance' | 'feature_update' | 'security_alert' | 'general';
  targetUsers?: string[]; // If not provided, sends to all users
}

export class SystemAlertsService {
  private static instance: SystemAlertsService;

  public static getInstance(): SystemAlertsService {
    if (!SystemAlertsService.instance) {
      SystemAlertsService.instance = new SystemAlertsService();
    }
    return SystemAlertsService.instance;
  }

  /**
   * Send a system-wide alert
   */
  async sendSystemAlert(alert: SystemAlert, sentBy: string): Promise<{ success: boolean; recipientCount: number; error?: string }> {
    try {
      const db = await getDatabase();
      let userIds: string[] = [];

      if (alert.targetUsers && alert.targetUsers.length > 0) {
        userIds = alert.targetUsers;
      } else {
        // Get all active users
        const usersCollection = db.collection('users');
        const users = await usersCollection.find({}).toArray();
        userIds = users.map(u => u.id).filter(Boolean);
      }

      if (userIds.length === 0) {
        return { success: false, recipientCount: 0, error: 'No users found' };
      }

      // Send bulk notifications
      await notificationService.sendBulkNotifications(
        userIds,
        'system_alert',
        alert.title,
        alert.message,
        {
          alertType: alert.alertType,
          sentBy,
          sentAt: new Date().toISOString(),
        },
        alert.priority
      );

      // Log the system alert
      const systemAlertsCollection = db.collection('system_alerts');
      await systemAlertsCollection.insertOne({
        id: `system_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: alert.title,
        message: alert.message,
        priority: alert.priority,
        alertType: alert.alertType,
        targetUsers: alert.targetUsers || 'all',
        sentBy,
        sentAt: new Date().toISOString(),
        recipientCount: userIds.length,
      });

      return { success: true, recipientCount: userIds.length };
    } catch (error) {
      console.error('Error sending system alert:', error);
      return { success: false, recipientCount: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send maintenance notification
   */
  async sendMaintenanceAlert(
    title: string,
    message: string,
    scheduledTime?: string,
    estimatedDuration?: string,
    sentBy: string = 'system'
  ): Promise<{ success: boolean; recipientCount: number; error?: string }> {
    const alert: SystemAlert = {
      title,
      message,
      priority: 'high',
      alertType: 'system_maintenance',
    };

    if (scheduledTime) {
      alert.message += `\n\nScheduled for: ${scheduledTime}`;
    }
    if (estimatedDuration) {
      alert.message += `\nEstimated duration: ${estimatedDuration}`;
    }

    return this.sendSystemAlert(alert, sentBy);
  }

  /**
   * Send feature update notification
   */
  async sendFeatureUpdateAlert(
    title: string,
    message: string,
    featureName?: string,
    sentBy: string = 'system'
  ): Promise<{ success: boolean; recipientCount: number; error?: string }> {
    const alert: SystemAlert = {
      title,
      message,
      priority: 'medium',
      alertType: 'feature_update',
    };

    if (featureName) {
      alert.message = `New feature: ${featureName}\n\n${message}`;
    }

    return this.sendSystemAlert(alert, sentBy);
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(
    title: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high',
    sentBy: string = 'system'
  ): Promise<{ success: boolean; recipientCount: number; error?: string }> {
    const alert: SystemAlert = {
      title,
      message,
      priority: severity,
      alertType: 'security_alert',
    };

    return this.sendSystemAlert(alert, sentBy);
  }

  /**
   * Get system alert history
   */
  async getSystemAlertHistory(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const db = await getDatabase();
      const systemAlertsCollection = db.collection('system_alerts');

      const alerts = await systemAlertsCollection
        .find({})
        .sort({ sentAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();

      // Remove MongoDB _id fields
      return alerts.map(({ _id, ...alert }) => alert);
    } catch (error) {
      console.error('Error fetching system alert history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const systemAlertsService = SystemAlertsService.getInstance();
