import { type NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase-server';

/**
 * MIGRATED VERSION: Individual Comment Operations (Supabase)
 * 
 * This is the Supabase version of the comment operations endpoint.
 * It maintains the exact same API contract as the MongoDB version
 * but uses Supabase for data persistence.
 * 
 * SAFETY: This endpoint can be deployed alongside the existing one
 * and switched via environment variable or gradual rollout.
 */

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
      .eq('user_id', user.id)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
    }

    // Delete the comment (CASCADE will handle votes automatically)
    const { error: deleteError } = await supabaseClient
      .from('vulnerability_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
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
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { commentId } = params;
    const body = await request.json();
    const { action, content } = body;

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
        .eq('user_id', user.id)
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
        .eq('user_id', user.id)
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
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}
