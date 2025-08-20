import type { Vulnerability } from '@/types/vulnerability';

export function exportToJSON(data: any[], filename = 'export'): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

export function exportToCSV(
  data: Vulnerability[],
  filename = 'vulnerabilities'
): void {
  if (data.length === 0) return;

  const headers = [
    'CVE ID',
    'Title',
    'Description',
    'Severity',
    'CVSS Score',
    'Published Date',
    'Source',
    'Affected Software',
    'CWE ID',
  ];

  const csvContent = [
    headers.join(','),
    ...data.map((vuln) =>
      [
        `"${vuln.cveId}"`,
        `"${vuln.title?.replace(/"/g, '""') || ''}"`,
        `"${vuln.description?.replace(/"/g, '""') || ''}"`,
        `"${vuln.severity}"`,
        vuln.cvssScore,
        `"${vuln.publishedDate}"`,
        `"${vuln.source}"`,
        `"${vuln.affectedSoftware?.join('; ') || ''}"`,
        `"${vuln.cweId || ''}"`,
      ].join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToXML(
  data: Vulnerability[],
  filename = 'vulnerabilities'
): void {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<vulnerabilities>
${data
  .map(
    (vuln) => `  <vulnerability>
    <cveId>${escapeXml(vuln.cveId)}</cveId>
    <title>${escapeXml(vuln.title || '')}</title>
    <description>${escapeXml(vuln.description || '')}</description>
    <severity>${escapeXml(vuln.severity)}</severity>
    <cvssScore>${vuln.cvssScore}</cvssScore>
    <publishedDate>${escapeXml(vuln.publishedDate)}</publishedDate>
    <source>${escapeXml(vuln.source)}</source>
    <affectedSoftware>
${
  vuln.affectedSoftware
    ?.map((software) => `      <software>${escapeXml(software)}</software>`)
    .join('\n') || ''
}
    </affectedSoftware>
    <cweId>${escapeXml(vuln.cweId || '')}</cweId>
  </vulnerability>`
  )
  .join('\n')}
</vulnerabilities>`;

  const blob = new Blob([xmlContent], { type: 'application/xml' });
  downloadBlob(blob, `${filename}.xml`);
}

export async function exportToPDF(
  data: Vulnerability[],
  filename = 'vulnerabilities'
): Promise<void> {
  // This would require a PDF library like jsPDF or Puppeteer
  // For now, we'll create a simple HTML version that can be printed to PDF
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Vulnerability Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .vulnerability { border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; }
        .severity-critical { border-left: 5px solid #dc2626; }
        .severity-high { border-left: 5px solid #ea580c; }
        .severity-medium { border-left: 5px solid #ca8a04; }
        .severity-low { border-left: 5px solid #16a34a; }
        .meta { color: #666; font-size: 0.9em; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Vulnerability Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <p>Total vulnerabilities: ${data.length}</p>
    </div>
    ${data
      .map(
        (vuln) => `
    <div class="vulnerability severity-${vuln.severity.toLowerCase()}">
        <h2>${vuln.cveId}</h2>
        <h3>${vuln.title || 'No title'}</h3>
        <p><strong>Severity:</strong> ${vuln.severity} (CVSS: ${
          vuln.cvssScore
        })</p>
        <p><strong>Published:</strong> ${new Date(
          vuln.publishedDate
        ).toLocaleDateString()}</p>
        <p><strong>Source:</strong> ${vuln.source}</p>
        <p><strong>Description:</strong> ${
          vuln.description || 'No description available'
        }</p>
        <p><strong>Affected Software:</strong> ${
          vuln.affectedSoftware?.join(', ') || 'None specified'
        }</p>
        ${vuln.cweId ? `<p><strong>CWE ID:</strong> ${vuln.cweId}</p>` : ''}
    </div>
    `
      )
      .join('')}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  downloadBlob(blob, `${filename}.html`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

export function getExportStats(data: Vulnerability[]): {
  total: number;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
} {
  const stats = {
    total: data.length,
    bySeverity: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
  };

  data.forEach((vuln) => {
    // Count by severity
    stats.bySeverity[vuln.severity] =
      (stats.bySeverity[vuln.severity] || 0) + 1;

    // Count by source
    stats.bySource[vuln.source] = (stats.bySource[vuln.source] || 0) + 1;
  });

  return stats;
}
