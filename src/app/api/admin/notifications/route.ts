import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { notificationService } from '@/lib/notification-service';

export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['system_alerts'], request);

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'stats') {
      // Get delivery statistics
      const stats = await notificationService.getDeliveryStats();
      return NextResponse.json(stats);
    } else if (action === 'retry') {
      // Retry failed notifications
      const maxRetries = parseInt(url.searchParams.get('maxRetries') || '3');
      const result = await notificationService.retryFailedNotifications(maxRetries);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in notification admin endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
