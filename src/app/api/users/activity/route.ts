import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get('limit') || '50');
    const type = url.searchParams.get('type');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const db = await getDatabase();
    const collection = db.collection('user_activity');

    // Build query
    const query: any = { userId: user.id };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    // Get activities with vulnerability details where applicable
    const activities = await collection
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'vulnerabilities',
            localField: 'vulnerabilityId',
            foreignField: 'cveId',
            as: 'vulnerability',
          },
        },
        {
          $addFields: {
            vulnerability: { $arrayElemAt: ['$vulnerability', 0] },
          },
        },
        { $sort: { timestamp: -1 } },
        { $limit: limit },
      ])
      .toArray();

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, description, vulnerabilityId, metadata } =
      await request.json();

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('user_activity');

    const activity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type,
      description,
      vulnerabilityId: vulnerabilityId || null,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    await collection.insertOne(activity);

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityIds } = await request.json();

    if (!activityIds || !Array.isArray(activityIds)) {
      return NextResponse.json(
        { error: 'Activity IDs array is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('user_activity');

    // Delete activities (only user's own activities)
    const result = await collection.deleteMany({
      userId: user.id,
      id: { $in: activityIds },
    });

    return NextResponse.json({ deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting activities:', error);
    return NextResponse.json(
      { error: 'Failed to delete activities' },
      { status: 500 }
    );
  }
}
