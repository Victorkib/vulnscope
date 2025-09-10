import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase-server';
import { commentReputationService } from '@/lib/comment-reputation-service';
import { shouldUseSupabase } from '@/lib/migration-config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = await params;
    const body = await request.json();
    const { voteType } = body; // 'like' or 'dislike'

    if (!voteType || !['like', 'dislike'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid vote type. Must be "like" or "dislike"' },
        { status: 400 }
      );
    }

    const supabaseClient = await supabase();

    // Check if comment exists
    const { data: comment, error: commentError } = await supabaseClient
      .from('vulnerability_comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user already voted
    const { data: existingVote } = await supabaseClient
      .from('comment_votes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Same vote type, remove the vote
        await supabaseClient
          .from('comment_votes')
          .delete()
          .eq('id', existingVote.id);
      } else {
        // Different vote type, update the vote
        await supabaseClient
          .from('comment_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
      }
    } else {
      // New vote
      await supabaseClient
        .from('comment_votes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          vote_type: voteType,
        });
    }

    // Get updated comment data
    const { data: updatedComment } = await supabaseClient
      .from('vulnerability_comments')
      .select('*')
      .eq('id', commentId)
      .single();

    const { data: updatedVote } = await supabaseClient
      .from('comment_votes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    // Update reputation for voting
    if (shouldUseSupabase('enableReputationIntegration')) {
      await commentReputationService.updateReputationOnVote(
        comment.user_id,
        voteType,
        commentId
      );
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: commentId,
        likes: updatedComment?.likes || 0,
        dislikes: updatedComment?.dislikes || 0,
      },
      userVote: updatedVote?.vote_type || null,
    });
  } catch (error) {
    console.error('Error voting on comment:', error);
    return NextResponse.json(
      { error: 'Failed to vote on comment' },
      { status: 500 }
    );
  }
}
