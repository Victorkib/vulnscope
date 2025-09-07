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
    const { triggerId, vulnerability, slack } = body;

    if (!vulnerability || !slack?.webhookUrl) {
      return NextResponse.json(
        { error: 'Vulnerability and Slack webhook URL are required' },
        { status: 400 }
      );
    }

    const vuln = vulnerability as Vulnerability;

    // Prepare Slack message
    const severityEmoji = {
      'CRITICAL': '🔴',
      'HIGH': '🟠',
      'MEDIUM': '🟡',
      'LOW': '🟢',
    };

    const color = {
      'CRITICAL': '#ff0000',
      'HIGH': '#ff8800',
      'MEDIUM': '#ffaa00',
      'LOW': '#00aa00',
    };

    const slackMessage = {
      username: slack.username || 'VulnScope Alerts',
      channel: slack.channel,
      attachments: [
        {
          color: color[vuln.severity as keyof typeof color] || '#000000',
          title: `${severityEmoji[vuln.severity as keyof typeof severityEmoji] || '⚠️'} ${vuln.severity} Vulnerability Alert`,
          title_link: `${process.env.NEXT_PUBLIC_APP_URL}/vulnerabilities/${vuln.cveId}`,
          fields: [
            {
              title: 'CVE ID',
              value: vuln.cveId,
              short: true,
            },
            {
              title: 'CVSS Score',
              value: vuln.cvssScore?.toString() || 'N/A',
              short: true,
            },
            {
              title: 'Affected Software',
              value: vuln.affectedSoftware.slice(0, 3).join(', ') + 
                     (vuln.affectedSoftware.length > 3 ? '...' : ''),
              short: false,
            },
            {
              title: 'Exploit Available',
              value: vuln.exploitAvailable ? 'Yes' : 'No',
              short: true,
            },
            {
              title: 'Patch Available',
              value: vuln.patchAvailable ? 'Yes' : 'No',
              short: true,
            },
          ],
          text: vuln.description?.substring(0, 500) + (vuln.description && vuln.description.length > 500 ? '...' : ''),
          footer: 'VulnScope Security Intelligence',
          footer_icon: 'https://vulnscope.com/icon.png',
          ts: Math.floor(new Date().getTime() / 1000),
        },
      ],
    };

    // Send to Slack
    const response = await fetch(slack.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed with status ${response.status}`);
    }

    console.log(`Slack alert sent for vulnerability ${vuln.cveId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Slack alert sent successfully',
    });
  } catch (error) {
    console.error('Error sending Slack alert:', error);
    return NextResponse.json(
      { error: 'Failed to send Slack alert' },
      { status: 500 }
    );
  }
}
