import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { getDatabase } from '@/lib/mongodb';
import { SupabaseUserService } from '@/lib/supabase-user-service';
import type { AdminDashboardStats } from '@/types/admin';

export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['analytics_access'], request);
    
    const db = await getDatabase();
    
    // Get user statistics from Supabase
    const userStats = await SupabaseUserService.getUserStats();
    
    // Get vulnerability statistics
    const vulnerabilitiesCollection = db.collection('vulnerabilities');
    const totalVulnerabilities = await vulnerabilitiesCollection.countDocuments();
    
    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newVulnerabilitiesToday = await vulnerabilitiesCollection.countDocuments({
      publishedDate: { $gte: today.toISOString() }
    });
    
    // Get system health metrics (simplified for now)
    const systemHealth = {
      databaseStatus: 'healthy' as const,
      apiResponseTime: 150, // ms
      errorRate: 0.1, // percentage
      uptime: 99.9 // percentage
    };
    
    // Get security alerts (simplified for now)
    const securityAlerts = {
      failedLogins: 0,
      suspiciousActivity: 0,
      policyViolations: 0
    };
    
    // Get recent admin actions
    const recentAdminActions = await adminAuthService.getAuditLogs({
      limit: 10
    });
    
    // Get pending system alerts
    const systemAlertsCollection = db.collection('system_alerts');
    const pendingSystemAlerts = await systemAlertsCollection.countDocuments({
      status: 'pending'
    });
    
    const stats: AdminDashboardStats = {
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      suspendedUsers: userStats.suspended,
      newUsersToday: userStats.newToday,
      totalVulnerabilities,
      newVulnerabilitiesToday,
      systemHealth,
      securityAlerts,
      recentAdminActions,
      pendingSystemAlerts
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
