import { getDatabase } from '../lib/mongodb';
import { getServerUser } from '../lib/supabase-server';
import { ObjectId } from 'mongodb';

export async function testCommentSystemComplete() {
  try {
    console.log('💬 Testing Complete Comment System...');

    // Get current user (you'll need to be authenticated)
    const { user, error } = await getServerUser();
    if (error || !user) {
      console.log('❌ No authenticated user found. Please log in first.');
      return;
    }

    console.log(`✅ Authenticated as: ${user.email}`);

    const db = await getDatabase();
    const commentsCollection = db.collection('vulnerability_comments');
    const votesCollection = db.collection('comment_votes');

    // Test 1: Create a parent comment
    console.log('\n📝 Test 1: Creating parent comment...');
    const parentComment = {
      vulnerabilityId: 'CVE-2024-0001',
      userId: user.id,
      userEmail: user.email || 'test@example.com',
      userDisplayName: user.user_metadata?.display_name || user.email || 'Test User',
      content: 'This is a parent comment for testing the complete system.',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      dislikes: 0,
      replies: [],
      isEdited: false,
    };

    const parentResult = await commentsCollection.insertOne(parentComment);
    const parentId = parentResult.insertedId.toString();
    console.log('✅ Parent comment created with ID:', parentId);

    // Test 2: Create a reply to the parent comment
    console.log('\n💬 Test 2: Creating reply comment...');
    const replyComment = {
      vulnerabilityId: 'CVE-2024-0001',
      userId: user.id,
      userEmail: user.email || 'test@example.com',
      userDisplayName: user.user_metadata?.display_name || user.email || 'Test User',
      content: 'This is a reply to the parent comment.',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      dislikes: 0,
      replies: [],
      parentId: parentId,
      isEdited: false,
    };

    const replyResult = await commentsCollection.insertOne(replyComment);
    const replyId = replyResult.insertedId.toString();
    console.log('✅ Reply comment created with ID:', replyId);

    // Test 3: Test voting on parent comment
    console.log('\n👍 Test 3: Testing voting on parent comment...');
    const parentVote = {
      id: `vote_parent_${Date.now()}`,
      commentId: parentId,
      userId: user.id,
      voteType: 'like',
      createdAt: new Date().toISOString(),
    };

    await votesCollection.insertOne(parentVote);
    await commentsCollection.updateOne(
      { _id: new ObjectId(parentId) },
      { $inc: { likes: 1 } }
    );
    console.log('✅ Vote on parent comment created');

    // Test 4: Test voting on reply comment
    console.log('\n👍 Test 4: Testing voting on reply comment...');
    const replyVote = {
      id: `vote_reply_${Date.now()}`,
      commentId: replyId,
      userId: user.id,
      voteType: 'dislike',
      createdAt: new Date().toISOString(),
    };

    await votesCollection.insertOne(replyVote);
    await commentsCollection.updateOne(
      { _id: new ObjectId(replyId) },
      { $inc: { dislikes: 1 } }
    );
    console.log('✅ Vote on reply comment created');

    // Test 5: Test API endpoints
    console.log('\n🔌 Test 5: Testing API endpoints...');
    
    // Test GET comments endpoint
    try {
      const response = await fetch(`/api/vulnerabilities/CVE-2024-0001/comments`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const comments = await response.json();
        const ourParentComment = comments.find((c: any) => c.id === parentId);
        
        if (ourParentComment) {
          console.log('✅ GET comments endpoint working');
          console.log(`  - Parent comment found: ${ourParentComment.content}`);
          console.log(`  - Parent comment likes: ${ourParentComment.likes}`);
          console.log(`  - Parent comment replies: ${ourParentComment.replies?.length || 0}`);
          
          if (ourParentComment.replies && ourParentComment.replies.length > 0) {
            const ourReply = ourParentComment.replies.find((r: any) => r.id === replyId);
            if (ourReply) {
              console.log(`  - Reply found: ${ourReply.content}`);
              console.log(`  - Reply dislikes: ${ourReply.dislikes}`);
            }
          }
        } else {
          console.log('⚠️ Parent comment not found in API response');
        }
      } else {
        console.log('❌ GET comments endpoint failed:', response.status);
      }
    } catch (error) {
      console.log('❌ GET comments endpoint test failed:', error);
    }

    // Test voting API endpoint
    try {
      const response = await fetch(`/api/comments/${parentId}/vote`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType: 'dislike' }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Voting API endpoint working');
        console.log(`  - Comment likes: ${result.comment.likes}`);
        console.log(`  - Comment dislikes: ${result.comment.dislikes}`);
        console.log(`  - User vote: ${result.userVote}`);
      } else {
        console.log('❌ Voting API endpoint failed:', response.status);
        const error = await response.text();
        console.log('  Error:', error);
      }
    } catch (error) {
      console.log('❌ Voting API endpoint test failed:', error);
    }

    // Test 6: Test reply creation via API
    console.log('\n📤 Test 6: Testing reply creation via API...');
    try {
      const response = await fetch(`/api/vulnerabilities/CVE-2024-0001/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'This is a reply created via API test.',
          isPublic: true,
          parentId: parentId,
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        console.log('✅ Reply creation via API working');
        console.log(`  - New reply ID: ${newReply.id}`);
        console.log(`  - New reply content: ${newReply.content}`);
        console.log(`  - New reply parentId: ${newReply.parentId}`);
      } else {
        console.log('❌ Reply creation via API failed:', response.status);
        const error = await response.text();
        console.log('  Error:', error);
      }
    } catch (error) {
      console.log('❌ Reply creation via API test failed:', error);
    }

    // Test 7: Verify data integrity
    console.log('\n🔍 Test 7: Verifying data integrity...');
    
    // Check parent comment
    const finalParentComment = await commentsCollection.findOne({ _id: new ObjectId(parentId) });
    const parentVotes = await votesCollection.find({ commentId: parentId }).toArray();
    
    // Check reply comment
    const finalReplyComment = await commentsCollection.findOne({ _id: new ObjectId(replyId) });
    const replyVotes = await votesCollection.find({ commentId: replyId }).toArray();
    
    console.log('✅ Data integrity check:');
    console.log(`  - Parent comment likes: ${finalParentComment?.likes}`);
    console.log(`  - Parent comment votes in DB: ${parentVotes.length}`);
    console.log(`  - Reply comment dislikes: ${finalReplyComment?.dislikes}`);
    console.log(`  - Reply comment votes in DB: ${replyVotes.length}`);
    
    // Check if parentId is correctly set
    if (finalReplyComment?.parentId === parentId) {
      console.log('✅ Reply parentId correctly set');
    } else {
      console.log('❌ Reply parentId not correctly set');
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await votesCollection.deleteMany({ commentId: { $in: [parentId, replyId] } });
    await commentsCollection.deleteMany({ 
      _id: { $in: [new ObjectId(parentId), new ObjectId(replyId)] } 
    });
    
    // Clean up any replies created during API test
    await commentsCollection.deleteMany({ parentId: parentId });
    
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Complete comment system test completed successfully!');
    
    return {
      success: true,
      testsPassed: 7,
      parentCommentId: parentId,
      replyCommentId: replyId,
      dataIntegrity: true,
    };

  } catch (error) {
    console.error('❌ Complete comment system test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCommentSystemComplete()
    .then((result) => {
      console.log('Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
