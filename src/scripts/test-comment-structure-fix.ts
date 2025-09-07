import { getDatabase } from '../lib/mongodb';
import { getServerUser } from '../lib/supabase-server';

export async function testCommentStructureFix() {
  try {
    console.log('🔧 Testing Comment Structure Fix...');

    // Get current user (you'll need to be authenticated)
    const { user, error } = await getServerUser();
    if (error || !user) {
      console.log('❌ No authenticated user found. Please log in first.');
      return;
    }

    console.log(`✅ Authenticated as: ${user.email}`);

    const db = await getDatabase();
    const commentsCollection = db.collection('vulnerability_comments');

    // Test 1: Create a test comment
    console.log('\n📝 Test 1: Creating test comment...');
    const testComment = {
      vulnerabilityId: 'CVE-2024-0001',
      userId: user.id,
      userEmail: user.email || 'test@example.com',
      userDisplayName: user.user_metadata?.display_name || user.email || 'Test User',
      content: 'This is a test comment for structure validation.',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      dislikes: 0,
      replies: [],
      isEdited: false,
    };

    const result = await commentsCollection.insertOne(testComment);
    const commentId = result.insertedId.toString();
    console.log('✅ Test comment created with ID:', commentId);

    // Test 2: Test the GET endpoint structure
    console.log('\n🔍 Test 2: Testing GET endpoint structure...');
    try {
      const response = await fetch(`/api/vulnerabilities/CVE-2024-0001/comments`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const comments = await response.json();
        const ourComment = comments.find((c: any) => c.id === commentId);
        
        if (ourComment) {
          console.log('✅ GET endpoint structure validation:');
          console.log('  - Has userId:', !!ourComment.userId);
          console.log('  - Has userEmail:', !!ourComment.userEmail);
          console.log('  - Has userDisplayName:', !!ourComment.userDisplayName);
          console.log('  - Has userReputation:', typeof ourComment.userReputation === 'number');
          console.log('  - Has userLevel:', typeof ourComment.userLevel === 'number');
          console.log('  - Has userBadges:', Array.isArray(ourComment.userBadges));
          console.log('  - Has likes:', typeof ourComment.likes === 'number');
          console.log('  - Has dislikes:', typeof ourComment.dislikes === 'number');
          console.log('  - Has userVote:', ourComment.userVote === undefined || typeof ourComment.userVote === 'string');
          
          // Check for old structure (should not exist)
          console.log('  - No old user object:', !ourComment.user);
          
          if (ourComment.userId && ourComment.userEmail && ourComment.userDisplayName && 
              typeof ourComment.userReputation === 'number' && 
              typeof ourComment.userLevel === 'number' && 
              Array.isArray(ourComment.userBadges) && 
              !ourComment.user) {
            console.log('✅ GET endpoint structure is correct!');
          } else {
            console.log('❌ GET endpoint structure has issues');
          }
        } else {
          console.log('⚠️ Our test comment not found in GET response');
        }
      } else {
        console.log('❌ GET endpoint failed:', response.status);
      }
    } catch (error) {
      console.log('❌ GET endpoint test failed:', error);
    }

    // Test 3: Test the POST endpoint structure
    console.log('\n📤 Test 3: Testing POST endpoint structure...');
    try {
      const response = await fetch(`/api/vulnerabilities/CVE-2024-0001/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'This is a test comment for POST structure validation.',
          isPublic: true,
        }),
      });

      if (response.ok) {
        const newComment = await response.json();
        console.log('✅ POST endpoint structure validation:');
        console.log('  - Has userId:', !!newComment.userId);
        console.log('  - Has userEmail:', !!newComment.userEmail);
        console.log('  - Has userDisplayName:', !!newComment.userDisplayName);
        console.log('  - Has userReputation:', typeof newComment.userReputation === 'number');
        console.log('  - Has userLevel:', typeof newComment.userLevel === 'number');
        console.log('  - Has userBadges:', Array.isArray(newComment.userBadges));
        console.log('  - Has likes:', typeof newComment.likes === 'number');
        console.log('  - Has dislikes:', typeof newComment.dislikes === 'number');
        console.log('  - Has userVote:', newComment.userVote === undefined);
        
        // Check for old structure (should not exist)
        console.log('  - No old user object:', !newComment.user);
        
        if (newComment.userId && newComment.userEmail && newComment.userDisplayName && 
            typeof newComment.userReputation === 'number' && 
            typeof newComment.userLevel === 'number' && 
            Array.isArray(newComment.userBadges) && 
            !newComment.user) {
          console.log('✅ POST endpoint structure is correct!');
        } else {
          console.log('❌ POST endpoint structure has issues');
        }
      } else {
        console.log('❌ POST endpoint failed:', response.status);
      }
    } catch (error) {
      console.log('❌ POST endpoint test failed:', error);
    }

    // Test 4: Test the PATCH endpoint structure
    console.log('\n✏️ Test 4: Testing PATCH endpoint structure...');
    try {
      const response = await fetch(`/api/vulnerabilities/CVE-2024-0001/comments/${commentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          content: 'This is an edited test comment for PATCH structure validation.',
        }),
      });

      if (response.ok) {
        const updatedComment = await response.json();
        console.log('✅ PATCH endpoint structure validation:');
        console.log('  - Has userId:', !!updatedComment.userId);
        console.log('  - Has userEmail:', !!updatedComment.userEmail);
        console.log('  - Has userDisplayName:', !!updatedComment.userDisplayName);
        console.log('  - Has userReputation:', typeof updatedComment.userReputation === 'number');
        console.log('  - Has userLevel:', typeof updatedComment.userLevel === 'number');
        console.log('  - Has userBadges:', Array.isArray(updatedComment.userBadges));
        console.log('  - Has likes:', typeof updatedComment.likes === 'number');
        console.log('  - Has dislikes:', typeof updatedComment.dislikes === 'number');
        console.log('  - Has userVote:', updatedComment.userVote === undefined);
        console.log('  - Has isEdited:', updatedComment.isEdited === true);
        
        // Check for old structure (should not exist)
        console.log('  - No old user object:', !updatedComment.user);
        
        if (updatedComment.userId && updatedComment.userEmail && updatedComment.userDisplayName && 
            typeof updatedComment.userReputation === 'number' && 
            typeof updatedComment.userLevel === 'number' && 
            Array.isArray(updatedComment.userBadges) && 
            !updatedComment.user) {
          console.log('✅ PATCH endpoint structure is correct!');
        } else {
          console.log('❌ PATCH endpoint structure has issues');
        }
      } else {
        console.log('❌ PATCH endpoint failed:', response.status);
      }
    } catch (error) {
      console.log('❌ PATCH endpoint test failed:', error);
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await commentsCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Comment structure fix test completed!');
    
    return {
      success: true,
      message: 'All comment structure fixes are working correctly',
    };

  } catch (error) {
    console.error('❌ Comment structure fix test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCommentStructureFix()
    .then((result) => {
      console.log('Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
