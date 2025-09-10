import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { adminVulnerabilityService } from '@/lib/admin-vulnerability-service';

/**
 * GET /api/admin/vulnerabilities/[id]
 * Get a specific vulnerability by CVE ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['vulnerability_management'], request);
    
    const cveId = params.id;
    
    // Get vulnerability from database
    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();
    const vulnerabilitiesCollection = db.collection('vulnerabilities');

    const vulnerability = await vulnerabilitiesCollection.findOne({ cveId });

    if (!vulnerability) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vulnerability not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vulnerability,
    });
  } catch (error) {
    console.error('Error fetching vulnerability:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch vulnerability',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/vulnerabilities/[id]
 * Update a specific vulnerability
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['vulnerability_management'], request);
    
    const cveId = params.id;
    const updates = await request.json();

    const vulnerability = await adminVulnerabilityService.updateVulnerability(cveId, updates, adminUser);

    return NextResponse.json({
      success: true,
      data: vulnerability,
      message: 'Vulnerability updated successfully',
    });
  } catch (error) {
    console.error('Error updating vulnerability:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update vulnerability',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/vulnerabilities/[id]
 * Delete a specific vulnerability
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['vulnerability_management'], request);
    
    const cveId = params.id;

    await adminVulnerabilityService.deleteVulnerability(cveId, adminUser);

    return NextResponse.json({
      success: true,
      message: 'Vulnerability deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting vulnerability:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete vulnerability',
      },
      { status: 500 }
    );
  }
}
