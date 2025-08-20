import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const db = await getDatabase();
    const collection = db.collection('saved_searches');

    const savedSearch = await collection.findOne({ id, userId: user.id });

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(savedSearch);
  } catch (error) {
    console.error('Error fetching saved search:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved search' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: searchId } = await params;
    const updates = await request.json();

    const db = await getDatabase();
    const searchesCollection = db.collection('saved_searches');
    const activityCollection = db.collection('user_activity');

    // Verify ownership
    const existingSearch = await searchesCollection.findOne({
      id: searchId,
      userId: user.id,
    });
    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    // Update search
    await searchesCollection.updateOne(
      { id: searchId, userId: user.id },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Log activity
    await activityCollection.insertOne({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'search_updated',
      description: `Updated saved search "${existingSearch.name}"`,
      timestamp: new Date().toISOString(),
      metadata: { searchId, changes: Object.keys(updates) },
    });

    return NextResponse.json({
      success: true,
      message: 'Saved search updated successfully',
      savedSearch: { id: searchId, ...updates },
    });
  } catch (error) {
    console.error('Error updating saved search:', error);
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: searchId } = await params;
    const db = await getDatabase();
    const searchesCollection = db.collection('saved_searches');
    const activityCollection = db.collection('user_activity');

    // Verify ownership and get details
    const savedSearch = await searchesCollection.findOne({
      id: searchId,
      userId: user.id,
    });
    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    // Delete search
    await searchesCollection.deleteOne({ id: searchId, userId: user.id });

    // Log activity
    await activityCollection.insertOne({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'search_deleted',
      description: `Deleted saved search "${savedSearch.name}"`,
      timestamp: new Date().toISOString(),
      metadata: { deletedSearchId: searchId },
    });

    return NextResponse.json({
      success: true,
      message: 'Saved search deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const db = await getDatabase();
    const searchesCollection = db.collection('saved_searches');
    const activityCollection = db.collection('user_activity');

    // Verify ownership
    const savedSearch = await searchesCollection.findOne({
      id,
      userId: user.id,
    });
    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    // Update use count and last used
    await searchesCollection.updateOne(
      { id, userId: user.id },
      {
        $inc: { useCount: 1 },
        $set: { lastUsed: new Date().toISOString() },
      }
    );

    // Log activity
    await activityCollection.insertOne({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'search',
      description: `Used saved search "${savedSearch.name}"`,
      timestamp: new Date().toISOString(),
      metadata: { searchId: id, filters: savedSearch.filters },
    });

    return NextResponse.json({ success: true, filters: savedSearch.filters });
  } catch (error) {
    console.error('Error using saved search:', error);
    return NextResponse.json(
      { error: 'Failed to use saved search' },
      { status: 500 }
    );
  }
}
