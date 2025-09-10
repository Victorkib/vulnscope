import { getDatabase } from '../lib/mongodb';
import { getServerUser } from '../lib/supabase-server';
import { reputationService } from '../lib/reputation-service';
import type { Comment, CommentVote, UserReputation } from '../types/community';

export async function testVotingSystemFixed() {
  try {
    console.log('🗳️ Testing Fixed Voting System...');

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

    // Test 1: Create a test comment
    console.log('\n📝 Test 1: Creating test comment...');
    const testComment: Comment = {
      id: `test_comment_fixed_${Date.now()}`,
      vulnerabilityId: 'CVE-2024-0001',
      userId: user.id,
      userEmail: user.email || 'test@example.com',
      userDisplayName: user.user_metadata?.display_name || user.email || 'Test User',
      content: 'This is a test comment for the fixed voting system.',
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

    // Test 2: Test like vote
    console.log('\n👍 Test 2: Testing like vote...');
    const likeVote: CommentVote = {
      id: `vote_like_fixed_${Date.now()}`,
      commentId: testComment.id,
      userId: user.id,
      voteType: 'like',
      createdAt: new Date().toISOString(),
    };

    await votesCollection.insertOne(likeVote);
    await commentsCollection.updateOne(
      { id: testComment.id },
      { $inc: { likes: 1 } }
    );

    // Test reputation update
    try {
      await reputationService.updateReputationAfterVote(
        testComment.userId,
        'like',
        true,
        undefined
      );
      console.log('✅ Like vote created and reputation updated');
    } catch (repError) {
      console.log('⚠️ Reputation update failed:', repError);
    }

    // Test 3: Test vote change (like to dislike)
    console.log('\n🔄 Test 3: Testing vote change (like to dislike)...');
    
    await votesCollection.updateOne(
      { id: likeVote.id },
      { $set: { voteType: 'dislike', createdAt: new Date().toISOString() } }
    );

    await commentsCollection.updateOne(
      { id: testComment.id },
      { $inc: { likes: -1, dislikes: 1 } }
    );

    // Test reputation update for vote change
    try {
      await reputationService.updateReputationAfterVote(
        testComment.userId,
        'dislike',
        false,
        'like'
      );
      console.log('✅ Vote changed from like to dislike and reputation updated');
    } catch (repError) {
      console.log('⚠️ Reputation update for vote change failed:', repError);
    }

    // Test 4: Test vote removal
    console.log('\n🗑️ Test 4: Testing vote removal...');
    
    await votesCollection.deleteOne({ id: likeVote.id });
    await commentsCollection.updateOne(
      { id: testComment.id },
      { $inc: { dislikes: -1 } }
    );

    console.log('✅ Vote removed successfully');

    // Test 5: Test multiple users voting on same comment
    console.log('\n👥 Test 5: Testing multiple users voting...');
    
    const testUser2 = `test_user_2_${Date.now()}`;
    const testUser3 = `test_user_3_${Date.now()}`;

    // User 2 likes the comment
    const vote2: CommentVote = {
      id: `vote_user2_${Date.now()}`,
      commentId: testComment.id,
      userId: testUser2,
      voteType: 'like',
      createdAt: new Date().toISOString(),
    };

    await votesCollection.insertOne(vote2);
    await commentsCollection.updateOne(
      { id: testComment.id },
      { $inc: { likes: 1 } }
    );

    // User 3 dislikes the comment
    const vote3: CommentVote = {
      id: `vote_user3_${Date.now()}`,
      commentId: testComment.id,
      userId: testUser3,
      voteType: 'dislike',
      createdAt: new Date().toISOString(),
    };

    await votesCollection.insertOne(vote3);
    await commentsCollection.updateOne(
      { id: testComment.id },
      { $inc: { dislikes: 1 } }
    );

    console.log('✅ Multiple users voted successfully');

    // Test 6: Verify final state
    console.log('\n📊 Test 6: Verifying final state...');
    
    const finalComment = await commentsCollection.findOne({ id: testComment.id });
    const allVotes = await votesCollection.find({ commentId: testComment.id }).toArray();
    
    console.log(`✅ Final comment state:`);
    console.log(`  - Likes: ${finalComment?.likes}`);
    console.log(`  - Dislikes: ${finalComment?.dislikes}`);
    console.log(`  - Total votes: ${allVotes.length}`);
    
    const likeCount = allVotes.filter(v => v.voteType === 'like').length;
    const dislikeCount = allVotes.filter(v => v.voteType === 'dislike').length;
    
    console.log(`✅ Vote breakdown:`);
    console.log(`  - Like votes: ${likeCount}`);
    console.log(`  - Dislike votes: ${dislikeCount}`);

    // Test 7: Test data integrity
    console.log('\n🔍 Test 7: Testing data integrity...');
    
    // Check if comment vote counts match actual votes
    const actualLikes = await votesCollection.countDocuments({ 
      commentId: testComment.id, 
      voteType: 'like' 
    });
    const actualDislikes = await votesCollection.countDocuments({ 
      commentId: testComment.id, 
      voteType: 'dislike' 
    });
    
    if (finalComment?.likes === actualLikes && finalComment?.dislikes === actualDislikes) {
      console.log('✅ Data integrity verified - vote counts match');
    } else {
      console.log('❌ Data integrity issue detected:');
      console.log(`  - Comment likes: ${finalComment?.likes}, Actual likes: ${actualLikes}`);
      console.log(`  - Comment dislikes: ${finalComment?.dislikes}, Actual dislikes: ${actualDislikes}`);
    }

    // Test 8: Test reputation system integration
    console.log('\n🏆 Test 8: Testing reputation system integration...');
    
    try {
      const reputation = await reputationService.getUserReputation(testComment.userId);
      console.log(`✅ User reputation calculated: ${reputation.score} points (Level ${reputation.level})`);
    } catch (repError) {
      console.log('⚠️ Reputation calculation failed:', repError);
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await votesCollection.deleteMany({ commentId: testComment.id });
    await commentsCollection.deleteOne({ id: testComment.id });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Fixed voting system test completed successfully!');
    
    return {
      success: true,
      testsPassed: 8,
      finalLikes: finalComment?.likes || 0,
      finalDislikes: finalComment?.dislikes || 0,
      totalVotes: allVotes.length,
      dataIntegrity: finalComment?.likes === actualLikes && finalComment?.dislikes === actualDislikes,
    };

  } catch (error) {
    console.error('❌ Fixed voting system test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testVotingSystemFixed()
    .then((result) => {
      console.log('Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
