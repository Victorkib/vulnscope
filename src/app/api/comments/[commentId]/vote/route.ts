import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { reputationService } from '@/lib/reputation-service';
import { ObjectId } from 'mongodb';
import type { CommentVote } from '@/types/community';

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

    // Validate commentId format
    if (!ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const votesCollection = db.collection<CommentVote>('comment_votes');
    const commentsCollection = db.collection('vulnerability_comments');

    // Check if comment exists
    const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user already voted
    const existingVote = await votesCollection.findOne({
      commentId,
      userId: user.id,
    });

    let isNewVote = false;
    let previousVoteType: 'like' | 'dislike' | undefined;

    if (existingVote) {
      // User already voted, update the vote
      previousVoteType = existingVote.voteType;
      
      if (existingVote.voteType === voteType) {
        // Same vote type, remove the vote
        await votesCollection.deleteOne({ _id: existingVote._id });
        
        // Update comment counts
        if (voteType === 'like') {
          await commentsCollection.updateOne(
            { _id: new ObjectId(commentId) },
            { $inc: { likes: -1 } }
          );
        } else {
          await commentsCollection.updateOne(
            { _id: new ObjectId(commentId) },
            { $inc: { dislikes: -1 } }
          );
        }
      } else {
        // Different vote type, update the vote
        await votesCollection.updateOne(
          { _id: existingVote._id },
          { $set: { voteType, createdAt: new Date().toISOString() } }
        );

        // Update comment counts
        if (previousVoteType === 'like') {
          await commentsCollection.updateOne(
            { _id: new ObjectId(commentId) },
            { $inc: { likes: -1, dislikes: 1 } }
          );
        } else {
          await commentsCollection.updateOne(
            { _id: new ObjectId(commentId) },
            { $inc: { likes: 1, dislikes: -1 } }
          );
        }
      }
    } else {
      // New vote
      isNewVote = true;
      const newVote: CommentVote = {
        id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        commentId,
        userId: user.id,
        voteType,
        createdAt: new Date().toISOString(),
      };

      await votesCollection.insertOne(newVote);

      // Update comment counts
      if (voteType === 'like') {
        await commentsCollection.updateOne(
          { _id: new ObjectId(commentId) },
          { $inc: { likes: 1 } }
        );
      } else {
        await commentsCollection.updateOne(
          { _id: new ObjectId(commentId) },
          { $inc: { dislikes: 1 } }
        );
      }
    }

    // Update reputation for the comment author
    try {
      await reputationService.updateReputationAfterVote(
        comment.userId,
        voteType,
        isNewVote,
        previousVoteType
      );
    } catch (reputationError) {
      console.error('Error updating reputation:', reputationError);
      // Don't fail the request if reputation update fails
    }

    // Get updated comment data
    const updatedComment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });
    const updatedVote = await votesCollection.findOne({
      commentId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: commentId,
        likes: updatedComment?.likes || 0,
        dislikes: updatedComment?.dislikes || 0,
      },
      userVote: updatedVote?.voteType || null,
    });
  } catch (error) {
    console.error('Error voting on comment:', error);
    return NextResponse.json(
      { error: 'Failed to vote on comment' },
      { status: 500 }
    );
  }
}
