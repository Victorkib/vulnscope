import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import type { Vulnerability } from '@/types/vulnerability';

export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { triggerId, vulnerability, webhook } = body;

    if (!vulnerability || !webhook?.url) {
      return NextResponse.json(
        { error: 'Vulnerability and webhook URL are required' },
        { status: 400 }
      );
    }

    const vuln = vulnerability as Vulnerability;

    // Prepare webhook payload
    const payload = {
      triggerId,
      timestamp: new Date().toISOString(),
      vulnerability: {
        cveId: vuln.cveId,
        title: vuln.title,
        description: vuln.description,
        severity: vuln.severity,
        cvssScore: vuln.cvssScore,
        publishedDate: vuln.publishedDate,
        affectedSoftware: vuln.affectedSoftware,
        exploitAvailable: vuln.exploitAvailable,
        patchAvailable: vuln.patchAvailable,
        tags: vuln.tags,
        references: vuln.references,
      },
      alert: {
        type: 'vulnerability_alert',
        priority: vuln.severity === 'CRITICAL' ? 'critical' : 
                 vuln.severity === 'HIGH' ? 'high' : 'medium',
      },
    };

    // Send webhook
    const response = await fetch(webhook.url, {
      method: webhook.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VulnScope-Alerts/1.0',
        ...webhook.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    console.log(`Webhook alert sent for vulnerability ${vuln.cveId} to ${webhook.url}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook alert sent successfully',
      status: response.status,
    });
  } catch (error) {
    console.error('Error sending webhook alert:', error);
    return NextResponse.json(
      { error: 'Failed to send webhook alert' },
      { status: 500 }
    );
  }
}
