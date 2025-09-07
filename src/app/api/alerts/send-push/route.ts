import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { notificationService } from '@/lib/notification-service';
import type { Vulnerability } from '@/types/vulnerability';

export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { triggerId, vulnerability, userId } = body;

    if (!vulnerability || !userId) {
      return NextResponse.json(
        { error: 'Vulnerability and user ID are required' },
        { status: 400 }
      );
    }

    const vuln = vulnerability as Vulnerability;
    const priority = vuln.severity === 'CRITICAL' ? 'critical' : 
                    vuln.severity === 'HIGH' ? 'high' : 'medium';

    // Send push notification via our notification service
    // In a real implementation, you would integrate with a push notification service like Firebase, OneSignal, etc.
    await notificationService.sendNotification(
      userId,
      'vulnerability_alert',
      `🚨 ${vuln.severity} Alert: ${vuln.cveId}`,
      `${vuln.title} - CVSS: ${vuln.cvssScore}`,
      {
        cveId: vuln.cveId,
        severity: vuln.severity,
        cvssScore: vuln.cvssScore,
        triggerId,
        action: 'view_vulnerability',
        url: `/vulnerabilities/${vuln.cveId}`,
      },
      priority
    );

    console.log(`Push notification sent for vulnerability ${vuln.cveId} to user ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Push notification sent successfully' 
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}
