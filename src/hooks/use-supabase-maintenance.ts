'use client';

import { useEffect, useCallback, useState } from 'react';
import { supabaseFreeTierService } from '@/lib/supabase-free-tier-service';
import type { 
  DatabaseSizeInfo, 
  ConnectionStats, 
  UsageAlert, 
  MaintenanceTaskResult 
} from '@/lib/supabase-free-tier-service';

interface UseSupabaseMaintenanceOptions {
  autoCleanup?: boolean;
  cleanupInterval?: number; // in milliseconds
  showAlerts?: boolean;
}

export function useSupabaseMaintenance({
  autoCleanup = true,
  cleanupInterval = 24 * 60 * 60 * 1000, // 24 hours
  showAlerts = true,
}: UseSupabaseMaintenanceOptions = {}) {
  const [databaseSize, setDatabaseSize] = useState<DatabaseSizeInfo | null>(null);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  const [usageAlerts, setUsageAlerts] = useState<UsageAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMaintenance, setLastMaintenance] = useState<string | null>(null);

  // Check usage alerts
  const checkUsageAlerts = useCallback(async () => {
    try {
      const alerts = await supabaseFreeTierService.checkUsageAlerts();
      setUsageAlerts(alerts);
      
      // Show critical alerts
      if (showAlerts) {
        const criticalAlerts = alerts.filter(alert => alert.alert_level === 'CRITICAL');
        if (criticalAlerts.length > 0) {
          console.warn('Critical Supabase usage alerts:', criticalAlerts);
          // You could show toast notifications here
        }
      }
    } catch (error) {
      console.error('Error checking usage alerts:', error);
    }
  }, [showAlerts]);

  // Get database size information
  const getDatabaseSize = useCallback(async () => {
    try {
      const sizeInfo = await supabaseFreeTierService.getDatabaseSize();
      setDatabaseSize(sizeInfo);
    } catch (error) {
      console.error('Error getting database size:', error);
    }
  }, []);

  // Get connection statistics
  const getConnectionStats = useCallback(async () => {
    try {
      const stats = await supabaseFreeTierService.getConnectionStats();
      setConnectionStats(stats);
    } catch (error) {
      console.error('Error getting connection stats:', error);
    }
  }, []);

  // Run maintenance tasks
  const runMaintenance = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await supabaseFreeTierService.runMaintenanceTasks();
      setLastMaintenance(new Date().toISOString());
      console.log('Maintenance tasks completed:', results);
      return results;
    } catch (error) {
      console.error('Error running maintenance tasks:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clean up old data
  const cleanupOldData = useCallback(async (notificationDays: number = 30) => {
    setIsLoading(true);
    try {
      const result = await supabaseFreeTierService.cleanupOldData(notificationDays, true);
      if (result) {
        console.log('Data cleanup completed:', result);
        // Refresh database size after cleanup
        await getDatabaseSize();
      }
      return result;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getDatabaseSize]);

  // Archive old notifications
  const archiveOldNotifications = useCallback(async (daysOld: number = 30) => {
    setIsLoading(true);
    try {
      const result = await supabaseFreeTierService.archiveOldNotifications(daysOld);
      if (result) {
        console.log('Notification archiving completed:', result);
        // Refresh database size after archiving
        await getDatabaseSize();
      }
      return result;
    } catch (error) {
      console.error('Error archiving old notifications:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getDatabaseSize]);

  // Check if cleanup is needed and run it
  const checkAndRunCleanup = useCallback(async () => {
    if (supabaseFreeTierService.shouldRunCleanup()) {
      console.log('Running scheduled cleanup...');
      await cleanupOldData();
    }
  }, [cleanupOldData]);

  // Refresh all monitoring data
  const refreshMonitoring = useCallback(async () => {
    await Promise.all([
      getDatabaseSize(),
      getConnectionStats(),
      checkUsageAlerts(),
    ]);
  }, [getDatabaseSize, getConnectionStats, checkUsageAlerts]);

  // Auto-cleanup effect
  useEffect(() => {
    if (!autoCleanup) return;

    // Run initial cleanup check
    checkAndRunCleanup();

    // Set up interval for periodic cleanup
    const interval = setInterval(checkAndRunCleanup, cleanupInterval);

    return () => clearInterval(interval);
  }, [autoCleanup, cleanupInterval, checkAndRunCleanup]);

  // Initial data load
  useEffect(() => {
    refreshMonitoring();
  }, [refreshMonitoring]);

  // Get bandwidth usage estimate
  const getBandwidthUsage = useCallback(() => {
    return supabaseFreeTierService.getBandwidthUsageEstimate();
  }, []);

  // Get API call count
  const getApiCallCount = useCallback(() => {
    return supabaseFreeTierService.getApiCallCount();
  }, []);

  // Reset API call count (call daily)
  const resetApiCallCount = useCallback(() => {
    supabaseFreeTierService.resetApiCallCount();
  }, []);

  return {
    // Data
    databaseSize,
    connectionStats,
    usageAlerts,
    isLoading,
    lastMaintenance,
    
    // Actions
    runMaintenance,
    cleanupOldData,
    archiveOldNotifications,
    refreshMonitoring,
    checkUsageAlerts,
    
    // Monitoring
    getBandwidthUsage,
    getApiCallCount,
    resetApiCallCount,
    
    // Status
    hasCriticalAlerts: usageAlerts.some(alert => alert.alert_level === 'CRITICAL'),
    hasWarnings: usageAlerts.some(alert => alert.alert_level === 'WARNING'),
    needsCleanup: supabaseFreeTierService.shouldRunCleanup(),
  };
}
