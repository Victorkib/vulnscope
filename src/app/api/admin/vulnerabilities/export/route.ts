import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { adminVulnerabilityService } from '@/lib/admin-vulnerability-service';

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

    if (!['json', 'csv', 'xml'].includes(options.format)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid format. Supported formats: json, csv, xml',
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
        responseData = result.data;
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
      default:
        responseData = result.data;
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
