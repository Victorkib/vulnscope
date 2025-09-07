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

    // For now, we'll use the notification service to send an in-app notification
    // In a real implementation, you would integrate with an email service like SendGrid, Resend, etc.
    
    const vuln = vulnerability as Vulnerability;
    const priority = vuln.severity === 'CRITICAL' ? 'critical' : 
                    vuln.severity === 'HIGH' ? 'high' : 'medium';

    await notificationService.sendNotification(
      userId,
      'vulnerability_alert',
      `🚨 Alert: ${vuln.severity} Vulnerability Detected`,
      `New ${vuln.severity} vulnerability ${vuln.cveId} has been detected: ${vuln.title}`,
      {
        cveId: vuln.cveId,
        severity: vuln.severity,
        cvssScore: vuln.cvssScore,
        triggerId,
      },
      priority
    );

    // Log the email alert (in a real implementation, you would actually send the email)
    console.log(`Email alert sent for vulnerability ${vuln.cveId} to user ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Email alert sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email alert:', error);
    return NextResponse.json(
      { error: 'Failed to send email alert' },
      { status: 500 }
    );
  }
}
