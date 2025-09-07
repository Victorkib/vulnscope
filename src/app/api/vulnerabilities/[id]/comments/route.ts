import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
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
  dislikes: number;
  replies: ObjectId[];
  parentId?: string;
  isEdited: boolean;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: cveId } = params;
    const { user } = await getServerUser();
    
    const db = await getDatabase();
    const commentsCollection = db.collection<Comment>('vulnerability_comments');
    const votesCollection = db.collection('comment_votes');
    const reputationCollection = db.collection('user_reputation');

    // Fetch comments for this vulnerability, sorted by creation date (newest first)
    // Only fetch top-level comments (no parentId)
    const comments = await commentsCollection
      .find({ 
        vulnerabilityId: cveId,
        parentId: { $exists: false }
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Get user votes for these comments
    const commentIds = comments.map(c => c._id?.toString()).filter(Boolean);
    const userVotes = user ? await votesCollection.find({
      commentId: { $in: commentIds },
      userId: user.id,
    }).toArray() : [];

    // Get user reputations
    const userIds = [...new Set(comments.map(c => c.userId))];
    const reputations = await reputationCollection.find({
      userId: { $in: userIds },
    }).toArray();

    // Transform to match the expected frontend format
    const transformedComments = await Promise.all(comments.map(async (comment) => {
      const commentId = comment._id?.toString();
      const userVote = userVotes.find(v => v.commentId === commentId);
      const userReputation = reputations.find(r => r.userId === comment.userId);

      // Fetch replies for this comment
      const replies = await commentsCollection
        .find({ parentId: commentId })
        .sort({ createdAt: 1 }) // Oldest first for replies
        .toArray();

      // Get votes for replies
      const replyIds = replies.map(r => r._id?.toString()).filter(Boolean);
      const replyVotes = user ? await votesCollection.find({
        commentId: { $in: replyIds },
        userId: user.id,
      }).toArray() : [];

      // Get reputations for reply authors
      const replyUserIds = [...new Set(replies.map(r => r.userId))];
      const replyReputations = await reputationCollection.find({
        userId: { $in: replyUserIds },
      }).toArray();

      // Transform replies
      const transformedReplies = replies.map(reply => {
        const replyId = reply._id?.toString();
        const replyVote = replyVotes.find(v => v.commentId === replyId);
        const replyUserReputation = replyReputations.find(r => r.userId === reply.userId);

        return {
          id: replyId,
          content: reply.content,
          userId: reply.userId,
          userEmail: reply.userEmail,
          userDisplayName: reply.userDisplayName,
          vulnerabilityId: reply.vulnerabilityId,
          isPublic: reply.isPublic,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
          likes: reply.likes || 0,
          dislikes: reply.dislikes || 0,
          isEdited: reply.isEdited || false,
          parentId: reply.parentId,
          userVote: replyVote?.voteType,
          userReputation: replyUserReputation?.totalScore || 0,
          userLevel: replyUserReputation?.level || 1,
          userBadges: replyUserReputation?.badges || [],
        };
      });

      return {
        id: commentId,
        content: comment.content,
        userId: comment.userId,
        userEmail: comment.userEmail,
        userDisplayName: comment.userDisplayName,
        vulnerabilityId: comment.vulnerabilityId,
        isPublic: comment.isPublic,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        isEdited: comment.isEdited || false,
        userVote: userVote?.voteType,
        userReputation: userReputation?.totalScore || 0,
        userLevel: userReputation?.level || 1,
        userBadges: userReputation?.badges || [],
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

    const db = await getDatabase();
    const commentsCollection = db.collection<Comment>('vulnerability_comments');

    // Use authenticated user data
    const commentUserId = user.id;
    const commentUserEmail = user.email || 'user@example.com';
    const commentUserDisplayName = user.user_metadata?.display_name || user.email || 'User';

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
      dislikes: 0,
      replies: [],
      parentId: parentId || undefined,
      isEdited: false,
    };

    const result = await commentsCollection.insertOne(newComment);

    // Return the created comment in the expected format
    const createdComment = {
      id: result.insertedId.toString(),
      content: newComment.content,
      userId: newComment.userId,
      userEmail: newComment.userEmail,
      userDisplayName: newComment.userDisplayName,
      vulnerabilityId: newComment.vulnerabilityId,
      isPublic: newComment.isPublic,
      createdAt: newComment.createdAt.toISOString(),
      updatedAt: newComment.updatedAt.toISOString(),
      likes: newComment.likes,
      dislikes: newComment.dislikes,
      isEdited: newComment.isEdited,
      userVote: undefined,
      userReputation: 0,
      userLevel: 1,
      userBadges: [],
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
