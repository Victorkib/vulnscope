import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { notificationService } from '@/lib/notification-service';

export async function GET() {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const bookmarksCollection = db.collection('user_bookmarks');
    const vulnerabilitiesCollection = db.collection('vulnerabilities');

    // Get user bookmarks with vulnerability details
    const bookmarks = await bookmarksCollection
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch vulnerability details for each bookmark
    const bookmarksWithDetails = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const vulnerability = await vulnerabilitiesCollection.findOne({
          cveId: bookmark.vulnerabilityId,
        });

        return {
          ...bookmark,
          vulnerability,
        };
      })
    );

    // Remove MongoDB _id fields
    const cleanBookmarks = bookmarksWithDetails.map(
      ({ _id, ...bookmark }) => bookmark
    );

    return NextResponse.json(cleanBookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      vulnerabilityId,
      notes = '',
      priority = 'medium',
      tags = [],
    } = await request.json();

    if (!vulnerabilityId) {
      return NextResponse.json(
        { error: 'Vulnerability ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const bookmarksCollection = db.collection('user_bookmarks');
    const activityCollection = db.collection('user_activity');

    // Check if bookmark already exists
    const existingBookmark = await bookmarksCollection.findOne({
      userId: user.id,
      vulnerabilityId,
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Vulnerability already bookmarked' },
        { status: 409 }
      );
    }

    // Create new bookmark
    const bookmark = {
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      vulnerabilityId,
      notes,
      priority,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await bookmarksCollection.insertOne(bookmark);

    // Log activity
    await activityCollection.insertOne({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'bookmark',
      description: `Bookmarked vulnerability ${vulnerabilityId}`,
      vulnerabilityId,
      timestamp: new Date().toISOString(),
      metadata: { priority, tags },
    });

    // Send notification
    try {
      await notificationService.sendBookmarkUpdate(user.id, {
        vulnerabilityId,
        action: 'created',
        title: `Bookmarked ${vulnerabilityId}`,
      });
    } catch (notificationError) {
      console.error('Error sending bookmark notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, bookmark });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vulnerabilityId } = await request.json();

    if (!vulnerabilityId) {
      return NextResponse.json(
        { error: 'Vulnerability ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const bookmarksCollection = db.collection('user_bookmarks');
    const activityCollection = db.collection('user_activity');

    // Delete bookmark
    const result = await bookmarksCollection.deleteOne({
      userId: user.id,
      vulnerabilityId,
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
      description: `Removed bookmark for vulnerability ${vulnerabilityId}`,
      vulnerabilityId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}
