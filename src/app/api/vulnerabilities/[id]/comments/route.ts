import { type NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase-server';
import { notificationService } from '@/lib/notification-service';
// import { commentReputationService } from '@/lib/comment-reputation-service';
// import { shouldUseSupabase } from '@/lib/migration-config';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: cveId } = params;
    const { user } = await getServerUser();
    
    const supabaseClient = await supabase();

    // Fetch comments for this vulnerability, sorted by creation date (newest first)
    // Only fetch top-level comments (no parent_id)
    const { data: comments, error: commentsError } = await supabaseClient
      .from('vulnerability_comments')
      .select('*')
      .eq('vulnerabilityid', cveId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (commentsError) {
      throw commentsError;
    }

    // Get user votes for these comments
    const commentIds = comments?.map(c => c.id) || [];
    const { data: userVotes } = user ? await supabaseClient
      .from('comment_votes')
      .select('*')
      .in('comment_id', commentIds)
      .eq('user_id', user.id) : { data: [] };

    // Transform to match the expected frontend format
    const transformedComments = await Promise.all((comments || []).map(async (comment) => {
      const userVote = userVotes?.find(v => v.comment_id === comment.id);

      // Fetch replies for this comment
      const { data: replies } = await supabaseClient
        .from('vulnerability_comments')
        .select('*')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      // Get votes for replies
      const replyIds = replies?.map(r => r.id) || [];
      const { data: replyVotes } = user ? await supabaseClient
        .from('comment_votes')
        .select('*')
        .in('comment_id', replyIds)
        .eq('user_id', user.id) : { data: [] };

      // Transform replies (without async reputation calls for now)
      const transformedReplies = (replies || []).map(reply => {
        const replyVote = replyVotes?.find(v => v.comment_id === reply.id);

        return {
          id: reply.id,
          content: reply.content,
          userId: reply.user_id,
          userEmail: reply.user_email,
          userDisplayName: reply.user_display_name,
          vulnerabilityId: reply.vulnerabilityid,
          isPublic: reply.is_public,
          createdAt: reply.created_at,
          updatedAt: reply.updated_at,
          likes: reply.likes || 0,
          dislikes: reply.dislikes || 0,
          isEdited: reply.is_edited || false,
          parentId: reply.parent_id,
          userVote: replyVote?.vote_type,
          userReputation: 0, // Simplified for now
          userLevel: 1, // Simplified for now
          userBadges: [], // Simplified for now
        };
      });

      return {
        id: comment.id,
        content: comment.content,
        userId: comment.user_id,
        userEmail: comment.user_email,
        userDisplayName: comment.user_display_name,
        vulnerabilityId: comment.vulnerabilityid,
        isPublic: comment.is_public,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        isEdited: comment.is_edited || false,
        userVote: userVote?.vote_type,
        userReputation: 0, // Simplified for now
        userLevel: 1, // Simplified for now
        userBadges: [], // Simplified for now
        replies: transformedReplies,
      };
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
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id: cveId } = params;
    const body = await request.json();
    const {
      content,
      isPublic = true,
      parentId,
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

    const supabaseClient = await supabase();

    // Insert comment into Supabase
    const { data: newComment, error: insertError } = await supabaseClient
      .from('vulnerability_comments')
      .insert({
        vulnerabilityid: cveId,
        user_id: user.id,
        user_email: user.email || 'user@example.com',
        user_display_name: user.user_metadata?.display_name || user.email || 'User',
        content: content.trim(),
        is_public: isPublic,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Send notification to parent comment author if this is a reply
    if (parentId) {
      try {
        // Get the parent comment to find the author
        const { data: parentComment } = await supabaseClient
          .from('vulnerability_comments')
          .select('user_id, user_display_name, content')
          .eq('id', parentId)
          .single();

        if (parentComment && parentComment.user_id !== user.id) {
          // Send notification to parent comment author
          await notificationService.sendCommentReply(
            parentComment.user_id,
            {
              id: newComment.id,
              content: newComment.content,
              author: newComment.user_display_name,
              vulnerabilityId: cveId,
            }
          );
        }
      } catch (notificationError) {
        // Log error but don't fail the comment creation
        console.error('Error sending comment reply notification:', notificationError);
      }
    }

    // Return the created comment in the expected format
    const createdComment = {
      id: newComment.id,
      content: newComment.content,
      userId: newComment.user_id,
      userEmail: newComment.user_email,
      userDisplayName: newComment.user_display_name,
      vulnerabilityId: newComment.vulnerabilityid,
      isPublic: newComment.is_public,
      createdAt: newComment.created_at,
      updatedAt: newComment.updated_at,
      likes: newComment.likes || 0,
      dislikes: newComment.dislikes || 0,
      isEdited: newComment.is_edited || false,
      parentId: newComment.parent_id,
      userVote: undefined,
      userReputation: 0, // Simplified for now
      userLevel: 1, // Simplified for now
      userBadges: [], // Simplified for now
    };

    // Update reputation for comment posting (disabled for now)
    // if (shouldUseSupabase('enableReputationIntegration')) {
    //   await commentReputationService.updateReputationOnComment(
    //     user.id,
    //     newComment.id,
    //     !!parentId
    //   );
    // }

    return NextResponse.json(createdComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// Helper functions for reputation integration (disabled for now)
// These will be re-enabled once the reputation system is fully integrated
