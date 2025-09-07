import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { notificationService } from '@/lib/notification-service';

export async function POST() {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Send a test notification
    await notificationService.sendNotification(
      user.id,
      'system_alert',
      'Test Notification',
      'This is a test notification to verify the real-time system is working!',
      { test: true },
      'medium'
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Test notification sent successfully' 
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
