import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { Vulnerability } from '@/types/vulnerability';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const { user } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { format, filters } = body;

    // Get user preferences for default export format
    let userPreferences = null;
    try {
      const db = await getDatabase();
      const preferencesCollection = db.collection('user_preferences');
      userPreferences = await preferencesCollection.findOne({ userId: user.id });
    } catch (error) {
      console.warn('Failed to fetch user preferences for export:', error);
    }

    const exportFormat = format || userPreferences?.exportFormat || 'csv';
    const limit = parseInt(filters?.limit || '1000');
    const severity = filters?.severities?.join(',') || filters?.severity;
    const source = filters?.sources?.join(',') || filters?.source;
    const selected = filters?.cveIds;

    return await exportVulnerabilities(exportFormat, limit, severity, source, selected);
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
    } else if (format === 'pdf') {
      // Generate PDF in landscape mode for better table fit
      const doc = new jsPDF('landscape');
      
      // Add title
      doc.setFontSize(20);
      doc.text('Vulnerability Report', 14, 22);
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total vulnerabilities: ${vulnerabilities.length}`, 14, 35);
      
      // Prepare table data - simplified for better fit
      const tableData = vulnerabilities.map(vuln => [
        vuln.cveId,
        vuln.title.length > 40 ? vuln.title.substring(0, 40) + '...' : vuln.title,
        vuln.severity,
        vuln.cvssScore || 'N/A',
        new Date(vuln.publishedDate).toLocaleDateString(),
        vuln.patchAvailable ? 'Yes' : 'No',
        vuln.exploitAvailable ? 'Yes' : 'No'
      ]);
      
      // Add table
      autoTable(doc, {
        head: [['CVE ID', 'Title', 'Severity', 'CVSS', 'Published', 'Patched', 'Exploit']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 25 }, // CVE ID
          1: { cellWidth: 80 }, // Title
          2: { cellWidth: 20 }, // Severity
          3: { cellWidth: 15 }, // CVSS
          4: { cellWidth: 20 }, // Published
          5: { cellWidth: 15 }, // Patched
          6: { cellWidth: 15 }  // Exploit
        },
        margin: { left: 10, right: 10 }
      });
      
      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      }
      
      // Convert to buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="vulnerabilities-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use csv, json, or pdf.' },
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
