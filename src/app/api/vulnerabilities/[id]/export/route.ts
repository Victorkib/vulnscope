import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { Vulnerability } from '@/types/vulnerability';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: cveId } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const db = await getDatabase();
    const vulnerabilitiesCollection =
      db.collection<Vulnerability>('vulnerabilities');
    const commentsCollection = db.collection('vulnerability_comments');

    // Fetch vulnerability data
    const vulnerability = await vulnerabilitiesCollection.findOne({ cveId });

    if (!vulnerability) {
      return NextResponse.json(
        { error: 'Vulnerability not found' },
        { status: 404 }
      );
    }

    // Fetch comments for this vulnerability
    const comments = await commentsCollection
      .find({ vulnerabilityId: cveId })
      .sort({ createdAt: -1 })
      .toArray();

    const exportData = {
      vulnerability,
      comments: comments.map((comment) => ({
        id: comment._id.toString(),
        content: comment.content,
        author: comment.userDisplayName,
        createdAt: comment.createdAt.toISOString(),
        isPublic: comment.isPublic,
        likes: comment.likes || 0,
      })),
      exportedAt: new Date().toISOString(),
      exportFormat: format,
    };

    if (format === 'json') {
      const jsonData = JSON.stringify(exportData, null, 2);
      return new NextResponse(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${cveId}-export.json"`,
        },
      });
    } else if (format === 'text' || format === 'txt') {
      const textData = `
VULNERABILITY REPORT
====================

CVE ID: ${vulnerability.cveId}
Title: ${vulnerability.title}
Severity: ${vulnerability.severity}
CVSS Score: ${vulnerability.cvssScore}

Description:
${vulnerability.description}

Published Date: ${new Date(vulnerability.publishedDate).toLocaleDateString()}
Last Modified: ${new Date(vulnerability.lastModifiedDate).toLocaleDateString()}

Affected Software:
${
  vulnerability.affectedSoftware
    ?.map((software) => `- ${software}`)
    .join('\n') || 'None specified'
}

CWE ID: ${vulnerability.cweId || 'Not specified'}

Exploit Available: ${vulnerability.exploitAvailable ? 'Yes' : 'No'}
Patch Available: ${vulnerability.patchAvailable ? 'Yes' : 'No'}
In KEV Catalog: ${vulnerability.kev ? 'Yes' : 'No'}
Trending: ${vulnerability.trending ? 'Yes' : 'No'}

References:
${vulnerability.references?.map((ref) => `- ${ref}`).join('\n') || 'None'}

${
  vulnerability.mitigations && vulnerability.mitigations.length > 0
    ? `
Mitigations:
${vulnerability.mitigations.map((mitigation) => `- ${mitigation}`).join('\n')}
`
    : ''
}

COMMUNITY COMMENTS (${comments.length})
${'='.repeat(30)}

${
  comments.length > 0
    ? comments
        .map(
          (comment) => `
Author: ${comment.userDisplayName}
Date: ${new Date(comment.createdAt).toLocaleDateString()}
Likes: ${comment.likes || 0}

${comment.content}

${'─'.repeat(50)}
`
        )
        .join('\n')
    : 'No comments available.'
}

Report generated on: ${new Date().toLocaleString()}
`;

      return new NextResponse(textData, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${cveId}-report.txt"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to export vulnerability' },
      { status: 500 }
    );
  }
}
