import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { adminVulnerabilityService } from '@/lib/admin-vulnerability-service';

/**
 * POST /api/admin/vulnerabilities/import
 * Import vulnerabilities from JSON data
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['vulnerability_import'], request);
    
    const body = await request.json();
    
    if (!body.vulnerabilities || !Array.isArray(body.vulnerabilities)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Expected "vulnerabilities" array.',
        },
        { status: 400 }
      );
    }

    if (body.vulnerabilities.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No vulnerabilities provided for import.',
        },
        { status: 400 }
      );
    }

    // Limit import size to prevent abuse
    if (body.vulnerabilities.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Import limit exceeded. Maximum 1000 vulnerabilities per import.',
        },
        { status: 400 }
      );
    }

    const result = await adminVulnerabilityService.importVulnerabilities(body.vulnerabilities, adminUser);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Import completed: ${result.success} successful, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('Error importing vulnerabilities:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import vulnerabilities',
      },
      { status: 500 }
    );
  }
}
