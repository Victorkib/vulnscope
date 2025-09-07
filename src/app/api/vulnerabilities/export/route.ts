import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { Vulnerability } from '@/types/vulnerability';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const limit = parseInt(searchParams.get('limit') || '1000');
    const severity = searchParams.get('severity');
    const source = searchParams.get('source');

    return await exportVulnerabilities(format, limit, severity, source);
  } catch (error) {
    console.error('Error exporting vulnerabilities:', error);
    return NextResponse.json(
      { error: 'Failed to export vulnerabilities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'csv', limit = 1000, severity, source, selected } = body;

    return await exportVulnerabilities(format, limit, severity, source, selected);
  } catch (error) {
    console.error('Error exporting vulnerabilities:', error);
    return NextResponse.json(
      { error: 'Failed to export vulnerabilities' },
      { status: 500 }
    );
  }
}

async function exportVulnerabilities(
  format: string,
  limit: number,
  severity?: string,
  source?: string,
  selected?: string[]
) {
  try {

    const db = await getDatabase();
    const collection = db.collection<Vulnerability>('vulnerabilities');

    // Build query
    const query: Record<string, unknown> = {};
    if (severity) {
      query.severity = severity.toUpperCase();
    }
    if (source) {
      query.source = source;
    }
    if (selected && selected.length > 0) {
      query._id = { $in: selected };
    }

    // Fetch vulnerabilities
    const vulnerabilities = await collection
      .find(query)
      .limit(limit)
      .sort({ publishedDate: -1 })
      .toArray();

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'CVE ID',
        'Title',
        'Severity',
        'CVSS Score',
        'Published Date',
        'Category',
        'Affected Software',
        'Patch Available',
        'Exploit Available',
        'Description'
      ];

      const csvRows = [
        headers.join(','),
        ...vulnerabilities.map(vuln => [
          vuln.cveId,
          `"${vuln.title.replace(/"/g, '""')}"`,
          vuln.severity,
          vuln.cvssScore || '',
          vuln.publishedDate,
          vuln.category,
          `"${vuln.affectedSoftware.join('; ')}"`,
          vuln.patchAvailable ? 'Yes' : 'No',
          vuln.exploitAvailable ? 'Yes' : 'No',
          `"${vuln.description.replace(/"/g, '""').substring(0, 200)}..."`
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="vulnerabilities-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      // Generate JSON
      return new NextResponse(JSON.stringify(vulnerabilities, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="vulnerabilities-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use csv or json.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting vulnerabilities:', error);
    return NextResponse.json(
      { error: 'Failed to export vulnerabilities' },
      { status: 500 }
    );
  }
}
