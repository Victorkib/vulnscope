import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { notificationService } from '@/lib/notification-service';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['system_alerts'], request);

    const body = await request.json();
    const {
      title,
      message,
      priority = 'medium',
      targetUsers = 'all', // 'all' or array of user IDs
      alertType = 'system_maintenance', // 'system_maintenance', 'feature_update', 'security_alert', 'general'
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    let userIds: string[] = [];

    if (targetUsers === 'all') {
      // Get all active users
      const usersCollection = db.collection('users');
      const users = await usersCollection.find({}).toArray();
      userIds = users.map(u => u.id).filter(Boolean);
    } else if (Array.isArray(targetUsers)) {
      userIds = targetUsers;
    } else {
      return NextResponse.json(
        { error: 'targetUsers must be "all" or an array of user IDs' },
        { status: 400 }
      );
    }

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: 'No users found to send alerts to' },
        { status: 400 }
      );
    }

    // Send bulk notifications
    try {
      await notificationService.sendBulkNotifications(
        userIds,
        'system_alert',
        title,
        message,
        {
          alertType,
          sentBy: adminUser.userId,
          sentAt: new Date().toISOString(),
        },
        priority as 'low' | 'medium' | 'high' | 'critical'
      );

      // Log the system alert
      const systemAlertsCollection = db.collection('system_alerts');
      await systemAlertsCollection.insertOne({
        id: `system_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        message,
        priority,
        alertType,
        targetUsers: targetUsers === 'all' ? 'all' : userIds,
        sentBy: adminUser.userId,
        sentAt: new Date().toISOString(),
        recipientCount: userIds.length,
      });

      return NextResponse.json({
        success: true,
        message: `System alert sent to ${userIds.length} users`,
        recipientCount: userIds.length,
      });
    } catch (notificationError) {
      console.error('Error sending system alerts:', notificationError);
      return NextResponse.json(
        { error: 'Failed to send system alerts' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating system alert:', error);
    return NextResponse.json(
      { error: 'Failed to create system alert' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['system_alerts'], request);

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const db = await getDatabase();
    const systemAlertsCollection = db.collection('system_alerts');

    const alerts = await systemAlertsCollection
      .find({})
      .sort({ sentAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Remove MongoDB _id fields
    const cleanAlerts = alerts.map(({ _id, ...alert }) => alert);

    return NextResponse.json(cleanAlerts);
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system alerts' },
      { status: 500 }
    );
  }
}
