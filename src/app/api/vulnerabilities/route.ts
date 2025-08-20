import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { Vulnerability } from '@/types/vulnerability';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '25'); // Default to 25 per page
    const skip = (page - 1) * limit;

    // Ensure reasonable limits to prevent performance issues
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    // Parse filters
    const searchText = searchParams.get('search') || '';
    const severities =
      searchParams.get('severities')?.split(',').filter(Boolean) || [];
    const sources =
      searchParams.get('sources')?.split(',').filter(Boolean) || [];
    const affectedSoftware =
      searchParams.get('affectedSoftware')?.split(',').filter(Boolean) || [];
    const cvssMin = Number.parseFloat(searchParams.get('cvssMin') || '0');
    const cvssMax = Number.parseFloat(searchParams.get('cvssMax') || '10');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'publishedDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const db = await getDatabase();
    const collection = db.collection<Vulnerability>('vulnerabilities');

    // Build query
    const query: any = {};

    // Text search with index optimization
    if (searchText) {
      query.$or = [
        { cveId: { $regex: searchText, $options: 'i' } },
        { title: { $regex: searchText, $options: 'i' } },
        { description: { $regex: searchText, $options: 'i' } },
      ];
    }

    // Severity filter
    if (severities.length > 0) {
      query.severity = { $in: severities };
    }

    // Source filter
    if (sources.length > 0) {
      query.source = { $in: sources };
    }

    // Affected software filter
    if (affectedSoftware.length > 0) {
      query.affectedSoftware = { $in: affectedSoftware };
    }

    // CVSS score range
    if (cvssMin > 0 || cvssMax < 10) {
      query.cvssScore = { $gte: cvssMin, $lte: cvssMax };
    }

    // Date range
    if (dateFrom || dateTo) {
      query.publishedDate = {};
      if (dateFrom) query.publishedDate.$gte = dateFrom;
      if (dateTo) query.publishedDate.$lte = dateTo;
    }

    // Build sort object
    const sortObj: any = {};
    switch (sortBy) {
      case 'cveId':
        sortObj.cveId = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'severity':
        // Custom severity sorting: CRITICAL > HIGH > MEDIUM > LOW
        sortObj.severity = sortOrder === 'asc' ? 1 : -1;
        sortObj.cvssScore = sortOrder === 'asc' ? 1 : -1; // Secondary sort by CVSS
        break;
      case 'cvssScore':
        sortObj.cvssScore = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'lastModifiedDate':
        sortObj.lastModifiedDate = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'publishedDate':
      default:
        sortObj.publishedDate = sortOrder === 'asc' ? 1 : -1;
        break;
    }

    // Get total count with filters (with timeout for large datasets)
    const totalCountPromise = collection.countDocuments(query, {
      maxTimeMS: 10000,
    });

    // Get paginated vulnerabilities with filters and sorting
    const vulnerabilitiesPromise = collection
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(actualLimit)
      .maxTimeMS(15000) // 15 second timeout
      .toArray();

    // Execute both queries in parallel
    const [totalCount, vulnerabilities] = await Promise.all([
      totalCountPromise,
      vulnerabilitiesPromise,
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / actualLimit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get additional metadata for better UX
    const startIndex = skip + 1;
    const endIndex = Math.min(skip + actualLimit, totalCount);

    return NextResponse.json({
      vulnerabilities,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit: actualLimit,
        hasNext,
        hasPrev,
        startIndex,
        endIndex,
      },
      filters: {
        search: searchText,
        severities,
        sources,
        affectedSoftware,
        cvssRange: [cvssMin, cvssMax],
        dateRange: dateFrom || dateTo ? { from: dateFrom, to: dateTo } : null,
        sortBy,
        sortOrder,
      },
      meta: {
        requestTime: new Date().toISOString(),
        processingTime: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error fetching vulnerabilities:', error);

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Request timeout',
            message:
              'The query took too long to execute. Please try with more specific filters.',
            code: 'TIMEOUT_ERROR',
          },
          { status: 408 }
        );
      }

      if (error.message.includes('memory')) {
        return NextResponse.json(
          {
            error: 'Memory limit exceeded',
            message:
              'The dataset is too large. Please use filters to narrow your search.',
            code: 'MEMORY_ERROR',
          },
          { status: 413 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch vulnerabilities',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'GENERAL_ERROR',
      },
      { status: 500 }
    );
  }
}
