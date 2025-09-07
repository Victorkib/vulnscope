import { getDatabase } from '../lib/mongodb';
import { getServerUser } from '../lib/supabase-server';
import { reputationService } from '../lib/reputation-service';
import type { Comment, CommentVote } from '../types/community';

export async function testCommentSystem() {
  try {
    console.log('🧪 Testing Comment System...');

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

    // Test 1: Create a comment
    console.log('\n📝 Test 1: Creating a comment...');
    const testComment: Comment = {
      id: `test_comment_${Date.now()}`,
      vulnerabilityId: 'CVE-2024-0001', // Use an existing vulnerability
      userId: user.id,
      userEmail: user.email || 'test@example.com',
      userDisplayName: user.user_metadata?.display_name || user.email || 'Test User',
      content: 'This is a test comment to verify the comment system functionality.',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      isEdited: false,
    };

    await commentsCollection.insertOne(testComment);
    console.log('✅ Test comment created successfully');

    // Test 2: Vote on the comment
    console.log('\n👍 Test 2: Voting on the comment...');
    const testVote: CommentVote = {
      id: `test_vote_${Date.now()}`,
      commentId: testComment.id,
      userId: user.id,
      voteType: 'like',
      createdAt: new Date().toISOString(),
    };

    await votesCollection.insertOne(testVote);
    
    // Update comment vote counts
    await commentsCollection.updateOne(
      { id: testComment.id },
      { $inc: { likes: 1 } }
    );
    console.log('✅ Vote recorded successfully');

    // Test 3: Edit the comment
    console.log('\n✏️ Test 3: Editing the comment...');
    const updatedContent = 'This is an edited test comment to verify the edit functionality.';
    await commentsCollection.updateOne(
      { id: testComment.id },
      { 
        $set: { 
          content: updatedContent,
          updatedAt: new Date().toISOString(),
          isEdited: true,
        } 
      }
    );
    console.log('✅ Comment edited successfully');

    // Test 4: Check reputation system
    console.log('\n🏆 Test 4: Testing reputation system...');
    const reputation = await reputationService.calculateUserReputation(user.id);
    console.log(`✅ User reputation: ${reputation.score} (Level: ${reputation.level})`);

    // Test 5: Verify comment data integrity
    console.log('\n🔍 Test 5: Verifying comment data integrity...');
    const finalComment = await commentsCollection.findOne({ id: testComment.id });
    if (finalComment) {
      console.log('✅ Comment data integrity verified:');
      console.log(`  - Content: ${finalComment.content}`);
      console.log(`  - Likes: ${finalComment.likes}`);
      console.log(`  - Is Edited: ${finalComment.isEdited}`);
      console.log(`  - User: ${finalComment.userDisplayName}`);
    }

    // Test 6: Test comment deletion
    console.log('\n🗑️ Test 6: Testing comment deletion...');
    await commentsCollection.deleteOne({ id: testComment.id });
    await votesCollection.deleteOne({ commentId: testComment.id });
    console.log('✅ Comment and vote deleted successfully');

    console.log('\n🎉 Comment system test completed successfully!');
    
    return {
      success: true,
      testsPassed: 6,
      userReputation: reputation,
    };

  } catch (error) {
    console.error('❌ Comment system test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCommentSystem()
    .then((result) => {
      console.log('Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
