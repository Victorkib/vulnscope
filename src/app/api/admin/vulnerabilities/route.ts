import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { adminVulnerabilityService } from '@/lib/admin-vulnerability-service';
import type { Vulnerability } from '@/types/vulnerability';

/**
 * GET /api/admin/vulnerabilities
 * List vulnerabilities with admin-specific filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['vulnerability_management'], request);
    
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    // Parse filters
    const searchText = searchParams.get('search') || '';
    const severity = searchParams.get('severity')?.split(',') || [];
    const category = searchParams.get('category')?.split(',') || [];
    const exploitAvailable = searchParams.get('exploitAvailable');
    const patchAvailable = searchParams.get('patchAvailable');
    const trending = searchParams.get('trending');
    const kev = searchParams.get('kev');

    // Build MongoDB query
    const query: any = {};
    
    if (searchText) {
      query.$or = [
        { cveId: { $regex: searchText, $options: 'i' } },
        { title: { $regex: searchText, $options: 'i' } },
        { description: { $regex: searchText, $options: 'i' } },
        { affectedSoftware: { $in: [new RegExp(searchText, 'i')] } },
      ];
    }

    if (severity.length > 0) {
      query.severity = { $in: severity };
    }

    if (category.length > 0) {
      query.category = { $in: category };
    }

    if (exploitAvailable !== null) {
      query.exploitAvailable = exploitAvailable === 'true';
    }

    if (patchAvailable !== null) {
      query.patchAvailable = patchAvailable === 'true';
    }

    if (trending !== null) {
      query.trending = trending === 'true';
    }

    if (kev !== null) {
      query.kev = kev === 'true';
    }

    // Get vulnerabilities from database
    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();
    const vulnerabilitiesCollection = db.collection<Vulnerability>('vulnerabilities');

    const [vulnerabilities, total] = await Promise.all([
      vulnerabilitiesCollection
        .find(query)
        .sort({ publishedDate: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      vulnerabilitiesCollection.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: vulnerabilities as unknown as Vulnerability[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching admin vulnerabilities:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch vulnerabilities',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/vulnerabilities
 * Create a new vulnerability
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['vulnerability_management'], request);
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.cveId || !body.title || !body.description || !body.severity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: cveId, title, description, severity',
        },
        { status: 400 }
      );
    }

    const vulnerability = await adminVulnerabilityService.createVulnerability(body, adminUser);

    return NextResponse.json({
      success: true,
      data: vulnerability,
      message: 'Vulnerability created successfully',
    });
  } catch (error) {
    console.error('Error creating vulnerability:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create vulnerability',
      },
      { status: 500 }
    );
  }
}
