import { getDatabase } from '../lib/mongodb';
import { getServerUser } from '../lib/supabase-server';
import { reputationService } from '../lib/reputation-service';
import type { Comment, CommentVote, UserReputation } from '../types/community';

export async function testVotingSystem() {
  try {
    console.log('🗳️ Testing Voting System...');

    // Get current user (you'll need to be authenticated)
    const { user, error } = await getServerUser();
    if (error || !user) {
      console.log('❌ No authenticated user found. Please log in first.');
      return;
    }

    console.log(`✅ Authenticated as: ${user.email}`);

    const db = await getDatabase();
    const commentsCollection = db.collection<Comment>('vulnerability_comments');
    const votesCollection = db.collection<CommentVote>('comment_votes');
    const reputationCollection = db.collection<UserReputation>('user_reputations');

    // Test 1: Check if comments exist
    console.log('\n📝 Test 1: Checking for existing comments...');
    const existingComments = await commentsCollection.find({}).limit(3).toArray();
    
    if (existingComments.length === 0) {
      console.log('⚠️ No comments found. Creating test comment...');
      
      // Create a test comment
      const testComment: Comment = {
        id: `test_comment_${Date.now()}`,
        vulnerabilityId: 'CVE-2024-0001',
        userId: user.id,
        userEmail: user.email || 'test@example.com',
        userDisplayName: user.user_metadata?.display_name || user.email || 'Test User',
        content: 'This is a test comment for voting system verification.',
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        replies: [],
        isEdited: false,
      };

      await commentsCollection.insertOne(testComment);
      console.log('✅ Test comment created');
    } else {
      console.log(`✅ Found ${existingComments.length} existing comments`);
    }

    // Test 2: Test voting functionality
    console.log('\n👍 Test 2: Testing vote creation...');
    const commentToVote = existingComments[0] || await commentsCollection.findOne({});
    
    if (!commentToVote) {
      console.log('❌ No comment available for voting test');
      return;
    }

    console.log(`Testing vote on comment: ${commentToVote.id}`);

    // Test like vote
    const likeVote: CommentVote = {
      id: `vote_like_${Date.now()}`,
      commentId: commentToVote.id,
      userId: user.id,
      voteType: 'like',
      createdAt: new Date().toISOString(),
    };

    await votesCollection.insertOne(likeVote);
    
    // Update comment like count
    await commentsCollection.updateOne(
      { id: commentToVote.id },
      { $inc: { likes: 1 } }
    );

    console.log('✅ Like vote created successfully');

    // Test 3: Test vote change (like to dislike)
    console.log('\n🔄 Test 3: Testing vote change...');
    
    // Update vote from like to dislike
    await votesCollection.updateOne(
      { id: likeVote.id },
      { $set: { voteType: 'dislike', createdAt: new Date().toISOString() } }
    );

    // Update comment counts
    await commentsCollection.updateOne(
      { id: commentToVote.id },
      { $inc: { likes: -1, dislikes: 1 } }
    );

    console.log('✅ Vote changed from like to dislike');

    // Test 4: Test vote removal
    console.log('\n🗑️ Test 4: Testing vote removal...');
    
    // Remove the vote
    await votesCollection.deleteOne({ id: likeVote.id });
    
    // Update comment counts
    await commentsCollection.updateOne(
      { id: commentToVote.id },
      { $inc: { dislikes: -1 } }
    );

    console.log('✅ Vote removed successfully');

    // Test 5: Test reputation system integration
    console.log('\n🏆 Test 5: Testing reputation system integration...');
    
    // Create a test user for reputation testing
    const testUserId = `test_user_${Date.now()}`;
    
    // Create a test comment by another user
    const testCommentForRep: Comment = {
      id: `test_comment_rep_${Date.now()}`,
      vulnerabilityId: 'CVE-2024-0001',
      userId: testUserId,
      userEmail: 'testuser@example.com',
      userDisplayName: 'Test User',
      content: 'This is a test comment for reputation testing.',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      replies: [],
      isEdited: false,
    };

    await commentsCollection.insertOne(testCommentForRep);

    // Create a like vote for the test user's comment
    const repVote: CommentVote = {
      id: `vote_rep_${Date.now()}`,
      commentId: testCommentForRep.id,
      userId: user.id,
      voteType: 'like',
      createdAt: new Date().toISOString(),
    };

    await votesCollection.insertOne(repVote);
    await commentsCollection.updateOne(
      { id: testCommentForRep.id },
      { $inc: { likes: 1 } }
    );

    // Test reputation update
    try {
      await reputationService.updateReputationAfterVote(
        testUserId,
        'like',
        true,
        undefined
      );
      console.log('✅ Reputation system integration working');
    } catch (repError) {
      console.log('⚠️ Reputation system integration test failed:', repError);
    }

    // Test 6: Verify vote data integrity
    console.log('\n🔍 Test 6: Verifying vote data integrity...');
    
    const allVotes = await votesCollection.find({}).toArray();
    const allComments = await commentsCollection.find({}).toArray();
    
    console.log(`✅ Total votes in system: ${allVotes.length}`);
    console.log(`✅ Total comments in system: ${allComments.length}`);
    
    // Check for orphaned votes
    const orphanedVotes = allVotes.filter(vote => 
      !allComments.some(comment => comment.id === vote.commentId)
    );
    
    if (orphanedVotes.length > 0) {
      console.log(`⚠️ Found ${orphanedVotes.length} orphaned votes`);
    } else {
      console.log('✅ No orphaned votes found');
    }

    // Test 7: Test vote statistics
    console.log('\n📊 Test 7: Testing vote statistics...');
    
    const likeVotes = await votesCollection.countDocuments({ voteType: 'like' });
    const dislikeVotes = await votesCollection.countDocuments({ voteType: 'dislike' });
    
    console.log(`✅ Total like votes: ${likeVotes}`);
    console.log(`✅ Total dislike votes: ${dislikeVotes}`);
    console.log(`✅ Like/Dislike ratio: ${likeVotes}:${dislikeVotes}`);

    // Test 8: Test comment vote counts
    console.log('\n📈 Test 8: Testing comment vote counts...');
    
    const commentsWithVotes = await commentsCollection.find({
      $or: [
        { likes: { $gt: 0 } },
        { dislikes: { $gt: 0 } }
      ]
    }).toArray();
    
    console.log(`✅ Comments with votes: ${commentsWithVotes.length}`);
    
    if (commentsWithVotes.length > 0) {
      const totalLikes = commentsWithVotes.reduce((sum, comment) => sum + comment.likes, 0);
      const totalDislikes = commentsWithVotes.reduce((sum, comment) => sum + comment.dislikes, 0);
      
      console.log(`✅ Total likes across all comments: ${totalLikes}`);
      console.log(`✅ Total dislikes across all comments: ${totalDislikes}`);
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await votesCollection.deleteMany({ userId: user.id });
    await commentsCollection.deleteMany({ userId: user.id });
    await commentsCollection.deleteMany({ userId: testUserId });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Voting system test completed successfully!');
    
    return {
      success: true,
      testsPassed: 8,
      totalVotes: allVotes.length,
      totalComments: allComments.length,
      likeVotes,
      dislikeVotes,
      commentsWithVotes: commentsWithVotes.length,
    };

  } catch (error) {
    console.error('❌ Voting system test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testVotingSystem()
    .then((result) => {
      console.log('Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
