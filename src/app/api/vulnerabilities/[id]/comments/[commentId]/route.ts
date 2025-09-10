import { type NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase-server';
import { shouldUseSupabase } from '@/lib/migration-config';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { commentId } = params;

    // Use Supabase if enabled, otherwise fallback to MongoDB
    if (shouldUseSupabase('useSupabaseForComments')) {
      return await deleteCommentSupabase(commentId, user.id);
    } else {
      return await deleteCommentMongoDB(commentId, user.id);
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

// Supabase implementation
async function deleteCommentSupabase(commentId: string, userId: string) {
  // Validate comment ID format (UUID)
  if (!commentId || typeof commentId !== 'string') {
    return NextResponse.json(
      { error: 'Invalid comment ID' },
      { status: 400 }
    );
  }

  const supabaseClient = await supabase();

  // Check if comment exists and belongs to user
  const { data: comment, error: commentError } = await supabaseClient
    .from('vulnerability_comments')
    .select('id, user_id')
    .eq('id', commentId)
    .eq('user_id', userId)
    .single();

  if (commentError || !comment) {
    return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
  }

  // Delete the comment (CASCADE will handle votes automatically)
  const { error: deleteError } = await supabaseClient
    .from('vulnerability_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (deleteError) {
    throw deleteError;
  }

  return NextResponse.json({ message: 'Comment deleted successfully' });
}

// MongoDB implementation (fallback)
async function deleteCommentMongoDB(commentId: string, userId: string) {
  const db = await getDatabase();
  const commentsCollection = db.collection('vulnerability_comments');

  if (!ObjectId.isValid(commentId)) {
    return NextResponse.json(
      { error: 'Invalid comment ID' },
      { status: 400 }
    );
  }

  // Check if comment exists and belongs to user
  const comment = await commentsCollection.findOne({
    _id: new ObjectId(commentId),
    userId: userId,
  });

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
  }

  const result = await commentsCollection.deleteOne({
    _id: new ObjectId(commentId),
    userId: userId,
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Comment deleted successfully' });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { commentId } = params;
    const body = await request.json();
    const { action, content } = body;

    // Use Supabase if enabled, otherwise fallback to MongoDB
    if (shouldUseSupabase('useSupabaseForComments')) {
      return await updateCommentSupabase(commentId, user.id, action, content);
    } else {
      return await updateCommentMongoDB(commentId, user.id, action, content);
    }
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// Supabase implementation
async function updateCommentSupabase(commentId: string, userId: string, action: string, content: string) {
  // Validate comment ID format (UUID)
  if (!commentId || typeof commentId !== 'string') {
    return NextResponse.json(
      { error: 'Invalid comment ID' },
      { status: 400 }
    );
  }

  const supabaseClient = await supabase();

  // For edit action, check if comment belongs to user
  if (action === 'edit') {
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

    // Check if comment exists and belongs to user
    const { data: existingComment, error: commentError } = await supabaseClient
      .from('vulnerability_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .eq('user_id', userId)
      .single();

    if (commentError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabaseClient
      .from('vulnerability_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
        is_edited: true,
      })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    if (!updatedComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Return the updated comment in the expected format
    const transformedComment = {
      id: updatedComment.id,
      content: updatedComment.content,
      userId: updatedComment.user_id,
      userEmail: updatedComment.user_email,
      userDisplayName: updatedComment.user_display_name,
      vulnerabilityId: updatedComment.vulnerabilityid,
      isPublic: updatedComment.is_public,
      createdAt: updatedComment.created_at,
      updatedAt: updatedComment.updated_at,
      likes: updatedComment.likes || 0,
      dislikes: updatedComment.dislikes || 0,
      isEdited: updatedComment.is_edited || false,
      userVote: undefined,
      userReputation: 0, // TODO: Connect to reputation system
      userLevel: 1,
      userBadges: [],
    };

    return NextResponse.json(transformedComment);
  } else {
    return NextResponse.json(
      { error: 'Invalid action. Only "edit" is supported' },
      { status: 400 }
    );
  }
}

// MongoDB implementation (fallback)
async function updateCommentMongoDB(commentId: string, userId: string, action: string, content: string) {
  const db = await getDatabase();
  const commentsCollection = db.collection('vulnerability_comments');

  if (!ObjectId.isValid(commentId)) {
    return NextResponse.json(
      { error: 'Invalid comment ID' },
      { status: 400 }
    );
  }

  // For edit action, check if comment belongs to user
  if (action === 'edit') {
    const comment = await commentsCollection.findOne({
      _id: new ObjectId(commentId),
      userId: userId,
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
    }
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
        isEdited: true,
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
    userId: updatedComment.userId,
    userEmail: updatedComment.userEmail,
    userDisplayName: updatedComment.userDisplayName,
    vulnerabilityId: updatedComment.vulnerabilityId,
    isPublic: updatedComment.isPublic,
    createdAt: updatedComment.createdAt.toISOString(),
    updatedAt: updatedComment.updatedAt.toISOString(),
    likes: updatedComment.likes || 0,
    dislikes: updatedComment.dislikes || 0,
    isEdited: updatedComment.isEdited || false,
    userVote: undefined,
    userReputation: 0,
    userLevel: 1,
    userBadges: [],
  };

  return NextResponse.json(transformedComment);
}
