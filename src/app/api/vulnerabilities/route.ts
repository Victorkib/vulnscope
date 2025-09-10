import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { Vulnerability } from '@/types/vulnerability';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    console.log('Vulnerabilities API: Starting request at', new Date().toISOString());
    
    // Get user preferences for defaults
    let userPreferences = null;
    try {
      const { user, error: userError } = await getServerUser();
      console.log('User auth result:', { user: !!user, error: userError });
      if (user) {
        const db = await getDatabase();
        const preferencesCollection = db.collection('user_preferences');
        userPreferences = await preferencesCollection.findOne({ userId: user.id });
        console.log('User preferences found:', { 
          userId: user.id, 
          hasPreferences: !!userPreferences,
          maxResultsPerPage: userPreferences?.maxResultsPerPage 
        });
      } else {
        console.log('No user found, userError:', userError);
      }
    } catch (error) {
      console.warn('Failed to fetch user preferences:', error);
    }

    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || (userPreferences?.maxResultsPerPage || 25).toString());
    const skip = (page - 1) * limit;

    // Debug logging
    console.log('Vulnerabilities API Debug:', {
      urlLimit: searchParams.get('limit'),
      userPreferenceLimit: userPreferences?.maxResultsPerPage,
      finalLimit: limit,
      hasUserPreferences: !!userPreferences
    });

    // Ensure reasonable limits to prevent performance issues
    const maxLimit = 100;
    const actualLimit = Math.min(limit, maxLimit);

    // Parse filters with user preference defaults
    const searchText = searchParams.get('search') || '';
    const severities =
      searchParams.get('severities')?.split(',').filter(Boolean) || 
      (userPreferences?.defaultSeverityFilter || []);
    const sources =
      searchParams.get('sources')?.split(',').filter(Boolean) || [];
    const affectedSoftware =
      searchParams.get('affectedSoftware')?.split(',').filter(Boolean) || [];
    const cvssMin = Number.parseFloat(searchParams.get('cvssMin') || '0');
    const cvssMax = Number.parseFloat(searchParams.get('cvssMax') || '10');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const exploitAvailable = searchParams.get('exploitAvailable') === 'true';
    const patchAvailable = searchParams.get('patchAvailable') === 'true';
    const kev = searchParams.get('kev') === 'true';
    const trending = searchParams.get('trending') === 'true';
    const category = searchParams.get('category')?.split(',').filter(Boolean) || [];
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const sortBy = searchParams.get('sortBy') || 'publishedDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const db = await getDatabase();
    const collection = db.collection<Vulnerability>('vulnerabilities');
    
    // Test database connection
    try {
      await collection.findOne({}, { projection: { _id: 1 } });
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      throw new Error('Database connection failed');
    }

    // Build query
    const query: Record<string, unknown> = {};

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
      if (dateFrom) (query.publishedDate as Record<string, unknown>).$gte = dateFrom;
      if (dateTo) (query.publishedDate as Record<string, unknown>).$lte = dateTo;
    }

    // Exploit and patch availability
    if (searchParams.has('exploitAvailable')) {
      query.exploitAvailable = exploitAvailable;
    }
    if (searchParams.has('patchAvailable')) {
      query.patchAvailable = patchAvailable;
    }
    if (searchParams.has('kev')) {
      query.kev = kev;
    }
    if (searchParams.has('trending')) {
      query.trending = trending;
    }

    // Category filter
    if (category.length > 0) {
      query.category = { $in: category };
    }

    // Tags filter
    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    // Build sort object
    const sortObj: Record<string, 1 | -1> = {};
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

    const processingTime = Date.now() - startTime;
    console.log(`Vulnerabilities API: Request completed in ${processingTime}ms`);
    
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
        processingTime,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Error fetching vulnerabilities after ${processingTime}ms:`, error);

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
