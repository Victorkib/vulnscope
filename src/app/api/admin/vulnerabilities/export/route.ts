import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { adminVulnerabilityService } from '@/lib/admin-vulnerability-service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * POST /api/admin/vulnerabilities/export
 * Export vulnerabilities in specified format
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['vulnerability_export'], request);
    
    const body = await request.json();
    
    // Validate export options
    const options = {
      format: body.format || 'json',
      filters: body.filters || {},
      includeMetadata: body.includeMetadata || false,
    };

    if (!['json', 'csv', 'xml', 'pdf'].includes(options.format)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid format. Supported formats: json, csv, xml, pdf',
        },
        { status: 400 }
      );
    }

    const result = await adminVulnerabilityService.exportVulnerabilities(options, adminUser);

    // Format response based on requested format
    let responseData: any;
    let contentType: string;

    switch (options.format) {
      case 'json':
        responseData = JSON.stringify(result.data, null, 2);
        contentType = 'application/json';
        break;
      case 'csv':
        responseData = convertToCSV(result.data);
        contentType = 'text/csv';
        break;
      case 'xml':
        responseData = convertToXML(result.data);
        contentType = 'application/xml';
        break;
      case 'pdf':
        responseData = await convertToPDF(result.data);
        contentType = 'application/pdf';
        break;
      default:
        responseData = JSON.stringify(result.data, null, 2);
        contentType = 'application/json';
    }

    return new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="vulnerabilities-export.${options.format}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting vulnerabilities:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export vulnerabilities',
      },
      { status: 500 }
    );
  }
}

/**
 * Convert vulnerabilities to CSV format
 */
function convertToCSV(vulnerabilities: any[]): string {
  if (vulnerabilities.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'CVE ID',
    'Title',
    'Description',
    'Severity',
    'CVSS Score',
    'Published Date',
    'Last Modified Date',
    'Affected Software',
    'References',
    'CWE ID',
    'Source',
    'Exploit Available',
    'Patch Available',
    'Tags',
    'Category',
    'KEV',
    'Trending',
  ];

  // Convert vulnerabilities to CSV rows
  const rows = vulnerabilities.map(vuln => [
    vuln.cveId || '',
    `"${(vuln.title || '').replace(/"/g, '""')}"`,
    `"${(vuln.description || '').replace(/"/g, '""')}"`,
    vuln.severity || '',
    vuln.cvssScore || '',
    vuln.publishedDate || '',
    vuln.lastModifiedDate || '',
    `"${(vuln.affectedSoftware || []).join('; ')}"`,
    `"${(vuln.references || []).join('; ')}"`,
    vuln.cweId || '',
    vuln.source || '',
    vuln.exploitAvailable ? 'Yes' : 'No',
    vuln.patchAvailable ? 'Yes' : 'No',
    `"${(vuln.tags || []).join('; ')}"`,
    vuln.category || '',
    vuln.kev ? 'Yes' : 'No',
    vuln.trending ? 'Yes' : 'No',
  ]);

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  return csvContent;
}

/**
 * Convert vulnerabilities to XML format
 */
function convertToXML(vulnerabilities: any[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const rootStart = '<vulnerabilities>';
  const rootEnd = '</vulnerabilities>';

  const vulnerabilityElements = vulnerabilities.map(vuln => {
    const escapeXml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    return `
  <vulnerability>
    <cveId>${escapeXml(vuln.cveId || '')}</cveId>
    <title>${escapeXml(vuln.title || '')}</title>
    <description>${escapeXml(vuln.description || '')}</description>
    <severity>${escapeXml(vuln.severity || '')}</severity>
    <cvssScore>${vuln.cvssScore || ''}</cvssScore>
    <publishedDate>${escapeXml(vuln.publishedDate || '')}</publishedDate>
    <lastModifiedDate>${escapeXml(vuln.lastModifiedDate || '')}</lastModifiedDate>
    <affectedSoftware>
      ${(vuln.affectedSoftware || []).map(software => `<software>${escapeXml(software)}</software>`).join('\n      ')}
    </affectedSoftware>
    <references>
      ${(vuln.references || []).map(ref => `<reference>${escapeXml(ref)}</reference>`).join('\n      ')}
    </references>
    <cweId>${escapeXml(vuln.cweId || '')}</cweId>
    <source>${escapeXml(vuln.source || '')}</source>
    <exploitAvailable>${vuln.exploitAvailable ? 'true' : 'false'}</exploitAvailable>
    <patchAvailable>${vuln.patchAvailable ? 'true' : 'false'}</patchAvailable>
    <tags>
      ${(vuln.tags || []).map(tag => `<tag>${escapeXml(tag)}</tag>`).join('\n      ')}
    </tags>
    <category>${escapeXml(vuln.category || '')}</category>
    <kev>${vuln.kev ? 'true' : 'false'}</kev>
    <trending>${vuln.trending ? 'true' : 'false'}</trending>
  </vulnerability>`;
  }).join('');

  return `${xmlHeader}\n${rootStart}${vulnerabilityElements}\n${rootEnd}`;
}

/**
 * Convert vulnerabilities to PDF format using jsPDF
 */
async function convertToPDF(vulnerabilities: any[]): Promise<Buffer> {
  // Generate PDF in landscape mode for better table fit
  const doc = new jsPDF('landscape');
  
  // Add title
  doc.setFontSize(20);
  doc.text('Admin Vulnerability Export Report', 14, 22);
  
  // Add generation date and metadata
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Total vulnerabilities: ${vulnerabilities.length}`, 14, 35);
  doc.text(`Generated by: Admin Export System`, 14, 40);
  
  // Prepare table data - comprehensive for admin use
  const tableData = vulnerabilities.map(vuln => [
    vuln.cveId || 'N/A',
    vuln.title ? (vuln.title.length > 35 ? vuln.title.substring(0, 35) + '...' : vuln.title) : 'N/A',
    vuln.severity || 'N/A',
    vuln.cvssScore || 'N/A',
    vuln.publishedDate ? new Date(vuln.publishedDate).toLocaleDateString() : 'N/A',
    vuln.category || 'N/A',
    vuln.patchAvailable ? 'Yes' : 'No',
    vuln.exploitAvailable ? 'Yes' : 'No',
    vuln.kev ? 'Yes' : 'No',
    vuln.trending ? 'Yes' : 'No'
  ]);
  
  // Add comprehensive table
  autoTable(doc, {
    head: [['CVE ID', 'Title', 'Severity', 'CVSS', 'Published', 'Category', 'Patched', 'Exploit', 'KEV', 'Trending']],
    body: tableData,
    startY: 50,
    styles: { fontSize: 6 },
    headStyles: { fillColor: [66, 139, 202] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 22 }, // CVE ID
      1: { cellWidth: 60 }, // Title
      2: { cellWidth: 18 }, // Severity
      3: { cellWidth: 12 }, // CVSS
      4: { cellWidth: 18 }, // Published
      5: { cellWidth: 25 }, // Category
      6: { cellWidth: 12 }, // Patched
      7: { cellWidth: 12 }, // Exploit
      8: { cellWidth: 10 }, // KEV
      9: { cellWidth: 12 }  // Trending
    },
    margin: { left: 8, right: 8 }
  });
  
  // Add footer with page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    doc.text(`Admin Export - ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10);
  }
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  return pdfBuffer;
}
