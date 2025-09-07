import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { Notification } from '@/types/notification';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isRead } = body;

    const db = await getDatabase();
    const collection = db.collection<Notification>('notifications');

    // Verify ownership
    const existingNotification = await collection.findOne({
      id,
      userId: user.id,
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update notification
    const updateData: Partial<Notification> = {};
    if (typeof isRead === 'boolean') {
      updateData.isRead = isRead;
      if (isRead) {
        updateData.readAt = new Date().toISOString();
      } else {
        updateData.readAt = undefined;
      }
    }

    await collection.updateOne(
      { id, userId: user.id },
      { $set: updateData }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
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
    const collection = db.collection<Notification>('notifications');

    // Verify ownership and delete
    const result = await collection.deleteOne({
      id,
      userId: user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
