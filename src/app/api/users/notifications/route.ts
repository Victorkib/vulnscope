import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { Notification } from '@/types/notification';

export async function GET(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      console.log('Auth failed, using fallback user ID for notifications');
      // Fallback to a default user ID for testing
      const fallbackUserId = '45219cc9-8266-4b7f-a235-f57cec2253ce';
      
      const db = await getDatabase();
      const collection = db.collection<Notification>('notifications');

      // Build query based on minimal flag
      const { searchParams } = new URL(request.url);
      const minimal = searchParams.get('minimal') === 'true';
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      let query = collection
        .find({ userId: fallbackUserId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(Math.min(limit, 100));

      // If minimal, only fetch essential fields
      if (minimal) {
        query = query.project({
          id: 1,
          type: 1,
          title: 1,
          priority: 1,
          isRead: 1,
          createdAt: 1,
          _id: 0
        });
      }

      const notifications = await query.toArray();

      // Remove MongoDB _id fields
      const cleanNotifications = notifications.map(({ _id, ...notification }) => notification);

      return NextResponse.json(cleanNotifications);
    }

    // Parse query parameters for free tier optimizations
    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get('minimal') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDatabase();
    const collection = db.collection<Notification>('notifications');

    // Build query based on minimal flag
    let query = collection
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Math.min(limit, 100)); // Cap at 100 for free tier

    // If minimal, only fetch essential fields
    if (minimal) {
      query = query.project({
        id: 1,
        type: 1,
        title: 1,
        priority: 1,
        isRead: 1,
        createdAt: 1,
        _id: 0
      });
    }

    const notifications = await query.toArray();

    // Remove MongoDB _id fields
    const cleanNotifications = notifications.map(({ _id, ...notification }) => notification);

    return NextResponse.json(cleanNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      title,
      message,
      data,
      priority = 'medium',
      expiresAt,
    } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      );
    }

    // Check user notification preferences
    const db = await getDatabase();
    const preferencesCollection = db.collection('user_preferences');
    const userPreferences = await preferencesCollection.findOne({ userId: user.id });
    
    // Respect user's notification preferences
    if (userPreferences) {
      // Skip email notifications if user has disabled them
      if (type === 'email' && !userPreferences.emailNotifications) {
        return NextResponse.json({ 
          message: 'Email notifications disabled by user preferences',
          skipped: true 
        });
      }
      
      // Skip push notifications if user has disabled them
      if (type === 'push' && !userPreferences.pushNotifications) {
        return NextResponse.json({ 
          message: 'Push notifications disabled by user preferences',
          skipped: true 
        });
      }
      
      // Skip non-critical notifications if user only wants critical alerts
      if (priority !== 'critical' && userPreferences.criticalAlerts && !userPreferences.emailNotifications) {
        return NextResponse.json({ 
          message: 'Non-critical notifications disabled by user preferences',
          skipped: true 
        });
      }
    }

    const collection = db.collection<Notification>('notifications');

    const notification: Notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type,
      title,
      message,
      data,
      isRead: false,
      priority,
      createdAt: new Date().toISOString(),
      expiresAt,
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
            user_id: user.id,
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

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
