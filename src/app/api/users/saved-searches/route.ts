import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection('saved_searches');

    const savedSearches = await collection
      .find({ userId: user.id })
      .sort({ lastUsed: -1 })
      .toArray();

    return NextResponse.json(savedSearches);
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
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

    const { name, description, filters, isPublic } = await request.json();

    if (!name || !filters) {
      return NextResponse.json(
        { error: 'Name and filters are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const searchesCollection = db.collection('saved_searches');
    const activityCollection = db.collection('user_activity');

    // Check if search name already exists for this user
    const existingSearch = await searchesCollection.findOne({
      userId: user.id,
      name,
    });

    if (existingSearch) {
      return NextResponse.json(
        { error: 'Search name already exists' },
        { status: 409 }
      );
    }

    const savedSearch = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      name,
      description: description || '',
      filters,
      isPublic: isPublic || false,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 0,
    };

    await searchesCollection.insertOne(savedSearch);

    // Log user activity
    await activityCollection.insertOne({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'search_saved',
      description: `Saved search "${name}"`,
      timestamp: new Date().toISOString(),
      metadata: { searchName: name, filterCount: Object.keys(filters).length },
    });

    return NextResponse.json(savedSearch, { status: 201 });
  } catch (error) {
    console.error('Error creating saved search:', error);
    return NextResponse.json(
      { error: 'Failed to create saved search' },
      { status: 500 }
    );
  }
}
