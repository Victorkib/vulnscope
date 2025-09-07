import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { DiscussionMessage } from '@/types/collaboration';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: discussionId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDatabase();
    const collection = db.collection<DiscussionMessage>('discussion_messages');

    const messages = await collection
      .find({ discussionId })
      .sort({ createdAt: 1 }) // Oldest first for chronological order
      .skip(offset)
      .limit(limit)
      .toArray();

    // Remove MongoDB _id fields
    const cleanMessages = messages.map(({ _id, ...message }) => message);

    return NextResponse.json(cleanMessages);
  } catch (error) {
    console.error('Error fetching discussion messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discussion messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: discussionId } = await params;
    const body = await request.json();
    const { content, parentMessageId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const messagesCollection = db.collection<DiscussionMessage>('discussion_messages');
    const discussionsCollection = db.collection('discussions');

    const message: DiscussionMessage = {
      id: `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      discussionId,
      authorId: user.id,
      authorEmail: user.email || '',
      authorDisplayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      content: content.trim(),
      isEdited: false,
      reactions: [],
      parentMessageId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await messagesCollection.insertOne(message);

    // Update discussion last activity and message count
    await discussionsCollection.updateOne(
      { id: discussionId },
      {
        $set: { lastActivityAt: new Date().toISOString() },
        $inc: { messageCount: 1 }
      }
    );

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating discussion message:', error);
    return NextResponse.json(
      { error: 'Failed to create discussion message' },
      { status: 500 }
    );
  }
}
