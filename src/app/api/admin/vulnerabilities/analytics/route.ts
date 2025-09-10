import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { adminVulnerabilityService } from '@/lib/admin-vulnerability-service';

/**
 * GET /api/admin/vulnerabilities/analytics
 * Get admin-specific vulnerability analytics
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['vulnerability_analytics'], request);
    
    const analytics = await adminVulnerabilityService.getAdminAnalytics();

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching admin vulnerability analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
