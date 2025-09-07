import { supabase } from './supabase';

/**
 * Supabase Free Tier Service
 * 
 * This service provides utilities for managing Supabase free tier limitations
 * and optimizations for the VulnScope project.
 */

export interface DatabaseSizeInfo {
  database_size: string;
  notifications_size: string;
  user_preferences_size: string;
  alert_rules_size: string;
  teams_size: string;
  team_members_size: string;
}

export interface ConnectionStats {
  active_connections: number;
  max_connections: number;
  connection_usage_percent: number;
}

export interface UsageAlert {
  alert_type: string;
  alert_level: 'OK' | 'WARNING' | 'CRITICAL';
  message: string;
  current_value: string;
  limit_value: string;
}

export interface CleanupResult {
  deleted_notifications: number;
  deleted_old_preferences: number;
  deleted_inactive_teams: number;
}

export interface MaintenanceTaskResult {
  task_name: string;
  result: string;
  details: Record<string, any>;
}

export class SupabaseFreeTierService {
  private static instance: SupabaseFreeTierService;
  private apiCallCount = 0;
  private maxApiCallsPerDay = 1000; // Estimate based on 2GB limit
  private lastCleanupDate: string | null = null;

  public static getInstance(): SupabaseFreeTierService {
    if (!SupabaseFreeTierService.instance) {
      SupabaseFreeTierService.instance = new SupabaseFreeTierService();
    }
    return SupabaseFreeTierService.instance;
  }

  /**
   * Track API calls to monitor bandwidth usage
   */
  public trackApiCall(): void {
    this.apiCallCount++;
    if (this.apiCallCount > this.maxApiCallsPerDay) {
      console.warn('Approaching bandwidth limit - consider optimizing API calls');
    }
  }

  /**
   * Get current database size information
   */
  public async getDatabaseSize(): Promise<DatabaseSizeInfo | null> {
    try {
      this.trackApiCall();
      const { data, error } = await supabase.rpc('get_database_size');
      
      if (error) {
        console.error('Error getting database size:', error);
        return null;
      }
      
      return data[0] || null;
    } catch (error) {
      console.error('Error getting database size:', error);
      return null;
    }
  }

  /**
   * Get current connection statistics
   */
  public async getConnectionStats(): Promise<ConnectionStats | null> {
    try {
      this.trackApiCall();
      const { data, error } = await supabase.rpc('get_connection_stats');
      
      if (error) {
        console.error('Error getting connection stats:', error);
        return null;
      }
      
      return data[0] || null;
    } catch (error) {
      console.error('Error getting connection stats:', error);
      return null;
    }
  }

  /**
   * Check for usage alerts
   */
  public async checkUsageAlerts(): Promise<UsageAlert[]> {
    try {
      this.trackApiCall();
      const { data, error } = await supabase.rpc('check_usage_alerts');
      
      if (error) {
        console.error('Error checking usage alerts:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error checking usage alerts:', error);
      return [];
    }
  }

  /**
   * Get minimal notification data for bandwidth optimization
   */
  public async getMinimalNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      this.trackApiCall();
      const { data, error } = await supabase.rpc('get_minimal_notifications', {
        user_uuid: userId,
        limit_count: limit,
        offset_count: offset
      });
      
      if (error) {
        console.error('Error getting minimal notifications:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting minimal notifications:', error);
      return [];
    }
  }

  /**
   * Get notification badge count only
   */
  public async getNotificationBadgeCount(userId: string): Promise<number> {
    try {
      this.trackApiCall();
      const { data, error } = await supabase.rpc('get_notification_badge_count', {
        user_uuid: userId
      });
      
      if (error) {
        console.error('Error getting notification badge count:', error);
        return 0;
      }
      
      return data || 0;
    } catch (error) {
      console.error('Error getting notification badge count:', error);
      return 0;
    }
  }

  /**
   * Clean up old data
   */
  public async cleanupOldData(
    notificationDays: number = 30,
    archiveOldData: boolean = true
  ): Promise<CleanupResult | null> {
    try {
      this.trackApiCall();
      const { data, error } = await supabase.rpc('cleanup_old_data', {
        notification_days: notificationDays,
        archive_old_data: archiveOldData
      });
      
      if (error) {
        console.error('Error cleaning up old data:', error);
        return null;
      }
      
      const result = data[0];
      if (result) {
        this.lastCleanupDate = new Date().toISOString();
        console.log(`Cleanup completed: ${result.deleted_notifications} notifications, ${result.deleted_old_preferences} preferences, ${result.deleted_inactive_teams} teams`);
      }
      
      return result || null;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return null;
    }
  }

  /**
   * Archive old notifications
   */
  public async archiveOldNotifications(daysOld: number = 30): Promise<{
    archived_count: number;
    archived_data: any;
  } | null> {
    try {
      this.trackApiCall();
      const { data, error } = await supabase.rpc('archive_old_notifications', {
        days_old: daysOld
      });
      
      if (error) {
        console.error('Error archiving old notifications:', error);
        return null;
      }
      
      const result = data[0];
      if (result) {
        console.log(`Archived ${result.archived_count} notifications`);
        // In a real implementation, you would save archived_data to external storage
        // For now, we'll just log it
        console.log('Archived data:', result.archived_data);
      }
      
      return result || null;
    } catch (error) {
      console.error('Error archiving old notifications:', error);
      return null;
    }
  }

  /**
   * Run all maintenance tasks
   */
  public async runMaintenanceTasks(): Promise<MaintenanceTaskResult[]> {
    try {
      this.trackApiCall();
      const { data, error } = await supabase.rpc('run_maintenance_tasks');
      
      if (error) {
        console.error('Error running maintenance tasks:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error running maintenance tasks:', error);
      return [];
    }
  }

  /**
   * Check if cleanup is needed (weekly)
   */
  public shouldRunCleanup(): boolean {
    if (!this.lastCleanupDate) {
      return true;
    }
    
    const lastCleanup = new Date(this.lastCleanupDate);
    const now = new Date();
    const daysSinceCleanup = (now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceCleanup >= 7; // Run cleanup weekly
  }

  /**
   * Get user notification statistics
   */
  public async getUserNotificationStats(userId: string): Promise<{
    total_notifications: number;
    unread_notifications: number;
    notifications_by_type: Record<string, number>;
    oldest_notification: string;
    newest_notification: string;
  } | null> {
    try {
      this.trackApiCall();
      const { data, error } = await supabase.rpc('get_user_notification_stats', {
        user_uuid: userId
      });
      
      if (error) {
        console.error('Error getting user notification stats:', error);
        return null;
      }
      
      return data[0] || null;
    } catch (error) {
      console.error('Error getting user notification stats:', error);
      return null;
    }
  }

  /**
   * Check if user can establish real-time connection
   */
  public async checkUserConnectionStatus(userId: string): Promise<boolean> {
    try {
      this.trackApiCall();
      const { data, error } = await supabase.rpc('check_user_connection_status', {
        user_uuid: userId
      });
      
      if (error) {
        console.error('Error checking user connection status:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error checking user connection status:', error);
      return false;
    }
  }

  /**
   * Get API call count for monitoring
   */
  public getApiCallCount(): number {
    return this.apiCallCount;
  }

  /**
   * Reset API call count (call daily)
   */
  public resetApiCallCount(): void {
    this.apiCallCount = 0;
  }

  /**
   * Get bandwidth usage estimate
   */
  public getBandwidthUsageEstimate(): {
    current: number;
    limit: number;
    percentage: number;
  } {
    // This is a rough estimate - in production you'd track actual bandwidth
    const estimatedBandwidthPerCall = 1024; // 1KB per call
    const currentBandwidth = this.apiCallCount * estimatedBandwidthPerCall;
    const limitBandwidth = 2 * 1024 * 1024 * 1024; // 2GB
    
    return {
      current: currentBandwidth,
      limit: limitBandwidth,
      percentage: (currentBandwidth / limitBandwidth) * 100
    };
  }
}

// Export singleton instance
export const supabaseFreeTierService = SupabaseFreeTierService.getInstance();
