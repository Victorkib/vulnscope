import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { getDatabase } from '@/lib/mongodb';

// GET /api/admin/security/sessions - Get active sessions
export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['security_audit'], request);
    
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status'); // 'active', 'expired', 'all'
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const db = await getDatabase();
    const sessionsCollection = db.collection('user_sessions');
    
    // Build query
    const query: any = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (status === 'active') {
      query.expiresAt = { $gt: new Date().toISOString() };
    } else if (status === 'expired') {
      query.expiresAt = { $lte: new Date().toISOString() };
    }
    
    // Get sessions with pagination
    const sessions = await sessionsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    // Get total count
    const totalCount = await sessionsCollection.countDocuments(query);
    
    // Sanitize session data (remove sensitive information)
    const sanitizedSessions = sessions.map(session => ({
      id: session._id,
      userId: session.userId,
      userEmail: session.userEmail,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastActivity: session.lastActivity,
      isActive: new Date(session.expiresAt) > new Date(),
      location: session.location || 'Unknown',
      device: session.device || 'Unknown'
    }));
    
    return NextResponse.json({
      success: true,
      data: sanitizedSessions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch active sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/security/sessions - Terminate sessions or get session analytics
export async function POST(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['security_audit'], request);
    
    const body = await request.json();
    const { action, sessionId, userId, reason } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const sessionsCollection = db.collection('user_sessions');
    const results: any = {
      action,
      timestamp: new Date().toISOString(),
      performedBy: adminUser.userId,
      results: {}
    };
    
    switch (action) {
      case 'terminate_session':
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId is required for terminate_session action' },
            { status: 400 }
          );
        }
        
        // Get session details
        const session = await sessionsCollection.findOne({ _id: sessionId });
        if (!session) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }
        
        // Terminate session
        await sessionsCollection.updateOne(
          { _id: sessionId },
          { 
            $set: { 
              expiresAt: new Date().toISOString(),
              terminatedBy: adminUser.userId,
              terminationReason: reason || 'Terminated by admin',
              terminatedAt: new Date().toISOString()
            }
          }
        );
        
        results.results = {
          sessionId,
          userId: session.userId,
          userEmail: session.userEmail,
          terminatedAt: new Date().toISOString()
        };
        break;
        
      case 'terminate_user_sessions':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for terminate_user_sessions action' },
            { status: 400 }
          );
        }
        
        // Terminate all active sessions for user
        const terminateResult = await sessionsCollection.updateMany(
          { 
            userId,
            expiresAt: { $gt: new Date().toISOString() }
          },
          { 
            $set: { 
              expiresAt: new Date().toISOString(),
              terminatedBy: adminUser.userId,
              terminationReason: reason || 'All sessions terminated by admin',
              terminatedAt: new Date().toISOString()
            }
          }
        );
        
        results.results = {
          userId,
          terminatedCount: terminateResult.modifiedCount,
          terminatedAt: new Date().toISOString()
        };
        break;
        
      case 'get_session_analytics':
        // Get session analytics
        const analytics = {
          totalSessions: await sessionsCollection.countDocuments(),
          activeSessions: await sessionsCollection.countDocuments({
            expiresAt: { $gt: new Date().toISOString() }
          }),
          expiredSessions: await sessionsCollection.countDocuments({
            expiresAt: { $lte: new Date().toISOString() }
          }),
          sessionsByDay: await sessionsCollection.aggregate([
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
          topUserAgents: await sessionsCollection.aggregate([
            { $group: { _id: '$userAgent', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]).toArray(),
          topIPAddresses: await sessionsCollection.aggregate([
            { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]).toArray()
        };
        
        results.results = analytics;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Unknown session action' },
          { status: 400 }
        );
    }
    
    // Log the session action
    await adminAuthService.logAdminAction(
      adminUser.userId,
      'security_scan',
      {
        targetId: 'user',
        targetType: 'user',
        oldValue: null,
        newValue: results.results,
        reason: reason || 'Session management action performed',
        description: `Session action ${action} performed by admin`
      }
    );
    
    return NextResponse.json({
      success: true,
      data: results,
      message: `Session action ${action} completed successfully`
    });
  } catch (error) {
    console.error('Error performing session action:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform session action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
