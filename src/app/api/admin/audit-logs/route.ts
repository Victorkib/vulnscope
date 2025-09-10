import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import type { AdminAction, AdminTargetType } from '@/types/admin';

export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['security_audit'], request);
    
    const url = new URL(request.url);
    const adminId = url.searchParams.get('adminId');
    const action = url.searchParams.get('action') as AdminAction;
    const targetType = url.searchParams.get('targetType') as AdminTargetType;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const auditLogs = await adminAuthService.getAuditLogs({
      adminId: adminId || undefined,
      action: action || undefined,
      targetType: targetType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
      offset
    });
    
    return NextResponse.json({
      success: true,
      data: auditLogs,
      count: auditLogs.length,
      pagination: {
        limit,
        offset,
        hasMore: auditLogs.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch audit logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
