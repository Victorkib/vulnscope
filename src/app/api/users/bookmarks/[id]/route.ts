import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { notificationService } from '@/lib/notification-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDatabase();
    const collection = db.collection('user_bookmarks');

    const bookmark = await collection.findOne({
      userId: user.id,
      vulnerabilityId: id,
    });

    return NextResponse.json({ isBookmarked: !!bookmark, bookmark });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to check bookmark' },
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

    const { id } = await params;
    const updates = await request.json();

    const db = await getDatabase();
    const bookmarksCollection = db.collection('user_bookmarks');
    const activityCollection = db.collection('user_activity');

    // Update the bookmark
    const result = await bookmarksCollection.updateOne(
      { id, userId: user.id },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    // Log activity
    await activityCollection.insertOne({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'bookmark_updated',
      description: `Updated bookmark for vulnerability ${id}`,
      vulnerabilityId: id,
      timestamp: new Date().toISOString(),
      metadata: { updates },
    });

    // Send notification for bookmark update
    try {
      await notificationService.sendBookmarkUpdate(user.id, {
        vulnerabilityId: id,
        action: 'updated',
        title: `Updated bookmark for ${id}`,
      });
    } catch (notificationError) {
      // Log error but don't fail the bookmark update
      console.error('Error sending bookmark update notification:', notificationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
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

    const { id } = await params;
    const db = await getDatabase();
    const bookmarksCollection = db.collection('user_bookmarks');
    const activityCollection = db.collection('user_activity');

    // Delete the bookmark
    const result = await bookmarksCollection.deleteOne({
      id,
      userId: user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    // Log activity
    await activityCollection.insertOne({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'bookmark_deleted',
      description: `Deleted bookmark for vulnerability ${id}`,
      vulnerabilityId: id,
      timestamp: new Date().toISOString(),
    });

    // Send notification for bookmark deletion
    try {
      await notificationService.sendBookmarkUpdate(user.id, {
        vulnerabilityId: id,
        action: 'deleted',
        title: `Removed bookmark for ${id}`,
      });
    } catch (notificationError) {
      // Log error but don't fail the bookmark deletion
      console.error('Error sending bookmark deletion notification:', notificationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { priority = 'medium', notes = '', tags = [] } = await request.json();

    const db = await getDatabase();
    const bookmarksCollection = db.collection('user_bookmarks');
    const vulnerabilitiesCollection = db.collection('vulnerabilities');
    const activityCollection = db.collection('user_activity');

    // Check if vulnerability exists
    const vulnerability = await vulnerabilitiesCollection.findOne({
      cveId: id,
    });
    if (!vulnerability) {
      return NextResponse.json(
        { error: 'Vulnerability not found' },
        { status: 404 }
      );
    }

    // Check if already bookmarked
    const existingBookmark = await bookmarksCollection.findOne({
      userId: user.id,
      vulnerabilityId: id,
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Already bookmarked' },
        { status: 409 }
      );
    }

    // Create bookmark
    const bookmark = {
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      vulnerabilityId: id,
      priority,
      notes,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await bookmarksCollection.insertOne(bookmark);

    // Log activity
    await activityCollection.insertOne({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'bookmark_created',
      description: `Bookmarked vulnerability ${id}`,
      vulnerabilityId: id,
      timestamp: new Date().toISOString(),
      metadata: { priority, notes, tags },
    });

    return NextResponse.json({ success: true, bookmark });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}
