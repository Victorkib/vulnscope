import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { ObjectId } from 'mongodb';

interface Comment {
  _id?: ObjectId;
  vulnerabilityId: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  content: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  replies: ObjectId[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: cveId } = params;
    const db = await getDatabase();
    const commentsCollection = db.collection<Comment>('vulnerability_comments');

    // Fetch comments for this vulnerability, sorted by creation date (newest first)
    const comments = await commentsCollection
      .find({ vulnerabilityId: cveId })
      .sort({ createdAt: -1 })
      .toArray();

    // Transform to match the expected frontend format
    const transformedComments = comments.map((comment) => ({
      id: comment._id?.toString(),
      content: comment.content,
      user: {
        id: comment.userId,
        email: comment.userEmail,
        displayName: comment.userDisplayName,
      },
      vulnerabilityId: comment.vulnerabilityId,
      isPublic: comment.isPublic,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      likes: comment.likes || 0,
    }));

    return NextResponse.json(transformedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: cveId } = params;
    const body = await request.json();
    const {
      content,
      isPublic = true,
      userId,
      userEmail,
      userDisplayName,
    } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const commentsCollection = db.collection<Comment>('vulnerability_comments');

    // For now, use mock user data if not provided
    // In a real app, you'd get this from authentication
    const commentUserId = userId || 'anonymous';
    const commentUserEmail = userEmail || 'anonymous@example.com';
    const commentUserDisplayName = userDisplayName || 'Anonymous User';

    const newComment: Comment = {
      vulnerabilityId: cveId,
      userId: commentUserId,
      userEmail: commentUserEmail,
      userDisplayName: commentUserDisplayName,
      content: content.trim(),
      isPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      replies: [],
    };

    const result = await commentsCollection.insertOne(newComment);

    // Return the created comment in the expected format
    const createdComment = {
      id: result.insertedId.toString(),
      content: newComment.content,
      user: {
        id: newComment.userId,
        email: newComment.userEmail,
        displayName: newComment.userDisplayName,
      },
      vulnerabilityId: newComment.vulnerabilityId,
      isPublic: newComment.isPublic,
      createdAt: newComment.createdAt.toISOString(),
      updatedAt: newComment.updatedAt.toISOString(),
      likes: newComment.likes,
    };

    return NextResponse.json(createdComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
