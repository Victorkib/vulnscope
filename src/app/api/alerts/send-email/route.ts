import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { notificationService } from '@/lib/notification-service';
import { emailService } from '@/lib/email-service';
import { getDatabase } from '@/lib/mongodb';
import type { Vulnerability } from '@/types/vulnerability';
import type { AlertRule } from '@/types/alert';

export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { triggerId, vulnerability, userId, alertRuleName } = body;

    if (!vulnerability || !userId) {
      return NextResponse.json(
        { error: 'Vulnerability and user ID are required' },
        { status: 400 }
      );
    }

    const vuln = vulnerability as Vulnerability;
    const priority = vuln.severity === 'CRITICAL' ? 'critical' : 
                    vuln.severity === 'HIGH' ? 'high' : 'medium';

    // Always send in-app notification
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

    // Get user email for sending actual email
    let userEmail: string | null = null;
    try {
      const db = await getDatabase();
      const usersCollection = db.collection('users');
      const userDoc = await usersCollection.findOne({ id: userId });
      userEmail = userDoc?.email || null;
    } catch (dbError) {
      console.error('Error fetching user email:', dbError);
    }

    // Send actual email if user email is available and email service is configured
    let emailResult: { 
      success: boolean; 
      messageId?: string; 
      provider: 'primary' | 'secondary' | 'none';
      error?: string;
      retryCount?: number;
      deliveryTime?: number;
    } = { 
      success: false, 
      messageId: undefined, 
      provider: 'none',
      error: 'No user email found',
      retryCount: 0,
      deliveryTime: Date.now()
    };
    
    if (userEmail) {
      try {
        emailResult = await emailService.sendVulnerabilityAlert(
          userEmail,
          vuln,
          alertRuleName || 'Custom Alert Rule',
          user.user_metadata?.display_name || user.email?.split('@')[0]
        );
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        emailResult = { 
          success: false, 
          provider: 'primary',
          error: emailError instanceof Error ? emailError.message : 'Unknown email error',
          retryCount: 0,
          deliveryTime: Date.now()
        };
      }
    }

    // Log the result with provider information
    if (emailResult.success) {
      console.log(`✅ Email alert sent via ${emailResult.provider} provider for vulnerability ${vuln.cveId} to user ${userId} (${userEmail}) - Message ID: ${emailResult.messageId}`);
    } else {
      console.log(`⚠️ Email alert failed via ${emailResult.provider} provider for vulnerability ${vuln.cveId} to user ${userId}: ${emailResult.error}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Alert processed successfully',
      emailSent: emailResult.success,
      emailMessageId: emailResult.messageId,
      emailProvider: emailResult.provider,
      emailError: emailResult.error,
      emailRetryCount: emailResult.retryCount,
      emailDeliveryTime: emailResult.deliveryTime,
      userEmail: userEmail ? `${userEmail.substring(0, 3)}***@${userEmail.split('@')[1]}` : null
    });
  } catch (error) {
    console.error('Error sending email alert:', error);
    return NextResponse.json(
      { error: 'Failed to send email alert' },
      { status: 500 }
    );
  }
}
