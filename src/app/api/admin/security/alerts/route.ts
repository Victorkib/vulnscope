import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { getDatabase } from '@/lib/mongodb';

// GET /api/admin/security/alerts - Get security alerts
export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['security_audit'], request);
    
    const url = new URL(request.url);
    const severity = url.searchParams.get('severity'); // 'low', 'medium', 'high', 'critical'
    const status = url.searchParams.get('status'); // 'active', 'resolved', 'all'
    const type = url.searchParams.get('type'); // 'failed_login', 'suspicious_activity', 'policy_violation'
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const db = await getDatabase();
    const alertsCollection = db.collection('security_alerts');
    
    // Build query
    const query: any = {};
    
    if (severity) {
      query.severity = severity;
    }
    
    if (status === 'active') {
      query.status = 'active';
    } else if (status === 'resolved') {
      query.status = 'resolved';
    }
    
    if (type) {
      query.type = type;
    }
    
    // Get alerts with pagination
    const alerts = await alertsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    // Get total count
    const totalCount = await alertsCollection.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: alerts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch security alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/security/alerts - Create or manage security alerts
export async function POST(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['security_audit'], request);
    
    const body = await request.json();
    const { action, alertId, config } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const alertsCollection = db.collection('security_alerts');
    const results: any = {
      action,
      timestamp: new Date().toISOString(),
      performedBy: adminUser.userId,
      results: {}
    };
    
    switch (action) {
      case 'create_alert':
        // Create new security alert
        const { type, severity, title, description, userId, ipAddress, userAgent, metadata } = config;
        
        if (!type || !severity || !title) {
          return NextResponse.json(
            { error: 'type, severity, and title are required for creating alerts' },
            { status: 400 }
          );
        }
        
        const alert = {
          id: `sec_${Date.now()}`,
          type,
          severity,
          title,
          description: description || '',
          userId: userId || null,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          metadata: metadata || {},
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: adminUser.userId,
          resolvedAt: null,
          resolvedBy: null
        };
        
        await alertsCollection.insertOne(alert);
        results.results = { alert };
        break;
        
      case 'resolve_alert':
        if (!alertId) {
          return NextResponse.json(
            { error: 'alertId is required for resolve_alert action' },
            { status: 400 }
          );
        }
        
        // Resolve security alert
        const updateResult = await alertsCollection.updateOne(
          { id: alertId },
          { 
            $set: { 
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              resolvedBy: adminUser.userId
            }
          }
        );
        
        if (updateResult.matchedCount === 0) {
          return NextResponse.json(
            { error: 'Alert not found' },
            { status: 404 }
          );
        }
        
        results.results = {
          alertId,
          resolvedAt: new Date().toISOString(),
          resolvedBy: adminUser.userId
        };
        break;
        
      case 'get_alert_analytics':
        // Get security alert analytics
        const analytics = {
          totalAlerts: await alertsCollection.countDocuments(),
          activeAlerts: await alertsCollection.countDocuments({ status: 'active' }),
          resolvedAlerts: await alertsCollection.countDocuments({ status: 'resolved' }),
          alertsBySeverity: await alertsCollection.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ]).toArray(),
          alertsByType: await alertsCollection.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ]).toArray(),
          alertsByDay: await alertsCollection.aggregate([
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: { $toDate: '$createdAt' }
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } },
            { $limit: 30 }
          ]).toArray(),
          topIPAddresses: await alertsCollection.aggregate([
            { $match: { ipAddress: { $ne: null } } },
            { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]).toArray()
        };
        
        results.results = analytics;
        break;
        
      case 'bulk_resolve':
        // Bulk resolve alerts
        const { alertIds, reason } = config;
        
        if (!alertIds || !Array.isArray(alertIds)) {
          return NextResponse.json(
            { error: 'alertIds array is required for bulk_resolve action' },
            { status: 400 }
          );
        }
        
        const bulkUpdateResult = await alertsCollection.updateMany(
          { id: { $in: alertIds } },
          { 
            $set: { 
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              resolvedBy: adminUser.userId,
              resolutionReason: reason || 'Bulk resolved by admin'
            }
          }
        );
        
        results.results = {
          resolvedCount: bulkUpdateResult.modifiedCount,
          alertIds,
          resolvedAt: new Date().toISOString()
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Unknown security alert action' },
          { status: 400 }
        );
    }
    
    // Log the security alert action
    await adminAuthService.logAdminAction(
      adminUser.userId,
      'security_scan',
      {
        targetId: 'system',
        targetType: 'system',
        oldValue: null,
        newValue: results.results,
        reason: 'Security alert action performed',
        description: `Security alert action ${action} performed by admin`
      }
    );
    
    return NextResponse.json({
      success: true,
      data: results,
      message: `Security alert action ${action} completed successfully`
    });
  } catch (error) {
    console.error('Error performing security alert action:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform security alert action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
