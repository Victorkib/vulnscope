import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const params = await context.params;
    const { commentId } = params;
    const db = await getDatabase();
    const commentsCollection = db.collection('vulnerability_comments');

    if (!ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const result = await commentsCollection.deleteOne({
      _id: new ObjectId(commentId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const params = await context.params;
    const { commentId } = params;
    const body = await request.json();
    const { action, content } = body;

    const db = await getDatabase();
    const commentsCollection = db.collection('vulnerability_comments');

    if (!ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    let updateOperation = {};

    if (action === 'like') {
      updateOperation = { $inc: { likes: 1 } };
    } else if (action === 'unlike') {
      updateOperation = { $inc: { likes: -1 } };
    } else if (action === 'edit' && content) {
      if (content.length > 2000) {
        return NextResponse.json(
          { error: 'Comment is too long (max 2000 characters)' },
          { status: 400 }
        );
      }
      updateOperation = {
        $set: {
          content: content.trim(),
          updatedAt: new Date(),
        },
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing content' },
        { status: 400 }
      );
    }

    const result = await commentsCollection.updateOne(
      { _id: new ObjectId(commentId) },
      updateOperation
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Fetch and return the updated comment
    const updatedComment = await commentsCollection.findOne({
      _id: new ObjectId(commentId),
    });

    if (!updatedComment) {
      return NextResponse.json(
        { error: 'Failed to fetch updated comment' },
        { status: 500 }
      );
    }

    const transformedComment = {
      id: updatedComment._id.toString(),
      content: updatedComment.content,
      user: {
        id: updatedComment.userId,
        email: updatedComment.userEmail,
        displayName: updatedComment.userDisplayName,
      },
      vulnerabilityId: updatedComment.vulnerabilityId,
      isPublic: updatedComment.isPublic,
      createdAt: updatedComment.createdAt.toISOString(),
      updatedAt: updatedComment.updatedAt.toISOString(),
      likes: updatedComment.likes || 0,
    };

    return NextResponse.json(transformedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}
