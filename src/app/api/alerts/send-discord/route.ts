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
    const { triggerId, vulnerability, discord } = body;

    if (!vulnerability || !discord?.webhookUrl) {
      return NextResponse.json(
        { error: 'Vulnerability and Discord webhook URL are required' },
        { status: 400 }
      );
    }

    const vuln = vulnerability as Vulnerability;

    // Prepare Discord embed
    const severityEmoji = {
      'CRITICAL': '🔴',
      'HIGH': '🟠',
      'MEDIUM': '🟡',
      'LOW': '🟢',
    };

    const color = {
      'CRITICAL': 0xff0000,
      'HIGH': 0xff8800,
      'MEDIUM': 0xffaa00,
      'LOW': 0x00aa00,
    };

    const discordMessage = {
      username: discord.username || 'VulnScope Alerts',
      embeds: [
        {
          title: `${severityEmoji[vuln.severity as keyof typeof severityEmoji] || '⚠️'} ${vuln.severity} Vulnerability Alert`,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/vulnerabilities/${vuln.cveId}`,
          color: color[vuln.severity as keyof typeof color] || 0x000000,
          fields: [
            {
              name: 'CVE ID',
              value: vuln.cveId,
              inline: true,
            },
            {
              name: 'CVSS Score',
              value: vuln.cvssScore?.toString() || 'N/A',
              inline: true,
            },
            {
              name: 'Published Date',
              value: new Date(vuln.publishedDate).toLocaleDateString(),
              inline: true,
            },
            {
              name: 'Affected Software',
              value: vuln.affectedSoftware.slice(0, 5).join('\n') + 
                     (vuln.affectedSoftware.length > 5 ? `\n... and ${vuln.affectedSoftware.length - 5} more` : ''),
              inline: false,
            },
            {
              name: 'Status',
              value: `Exploit: ${vuln.exploitAvailable ? '✅ Available' : '❌ Not Available'}\nPatch: ${vuln.patchAvailable ? '✅ Available' : '❌ Not Available'}`,
              inline: true,
            },
          ],
          description: vuln.description?.substring(0, 1000) + (vuln.description && vuln.description.length > 1000 ? '...' : ''),
          footer: {
            text: 'VulnScope Security Intelligence',
            icon_url: 'https://vulnscope.com/icon.png',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Send to Discord
    const response = await fetch(discord.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordMessage),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed with status ${response.status}`);
    }

    console.log(`Discord alert sent for vulnerability ${vuln.cveId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Discord alert sent successfully',
    });
  } catch (error) {
    console.error('Error sending Discord alert:', error);
    return NextResponse.json(
      { error: 'Failed to send Discord alert' },
      { status: 500 }
    );
  }
}
