import { getDatabase } from '@/lib/mongodb';
import { adminAuthService } from '@/lib/admin-auth';

/**
 * Debug script to check admin status for all users
 */
async function debugAdminStatus() {
  try {
    console.log('🔍 Debugging Admin Status...\n');
    
    const db = await getDatabase();
    
    // Get all admin users
    const adminUsersCollection = db.collection('admin_users');
    const adminUsers = await adminUsersCollection.find({}).toArray();
    
    console.log('📋 Admin Users in Database:');
    adminUsers.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.email} (${admin.userId})`);
      console.log(`     Role: ${admin.role}`);
      console.log(`     Active: ${admin.isActive}`);
      console.log(`     Permissions: ${admin.permissions.length} permissions`);
      console.log('');
    });
    
    // Test admin status for each admin user
    console.log('🧪 Testing Admin Status for Each Admin User:');
    for (const admin of adminUsers) {
      console.log(`Testing: ${admin.email} (${admin.userId})`);
      
      const adminUser = await adminAuthService.getAdminUser(admin.userId);
      
      if (adminUser) {
        console.log(`  ✅ Found in admin_users collection`);
        console.log(`  ✅ Role: ${adminUser.role}`);
        console.log(`  ✅ Active: ${adminUser.isActive}`);
        console.log(`  ✅ Permissions: ${adminUser.permissions.length} permissions`);
      } else {
        console.log(`  ❌ NOT found in admin_users collection`);
      }
      console.log('');
    }
    
    // Test with a non-existent user
    console.log('🧪 Testing with Non-Existent User:');
    const nonExistentUser = await adminAuthService.getAdminUser('non-existent-user-id');
    console.log(`Non-existent user result: ${nonExistentUser ? 'FOUND (❌ ERROR!)' : 'NOT FOUND (✅ Correct)'}`);
    console.log('');
    
    // Check if there are any users in the regular users collection
    console.log('📋 Checking Regular Users Collection:');
    try {
      const usersCollection = db.collection('users');
      const regularUsers = await usersCollection.find({}).limit(5).toArray();
      console.log(`Found ${regularUsers.length} regular users (showing first 5):`);
      regularUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email || 'No email'} (${user.id || 'No ID'})`);
      });
    } catch (error) {
      console.log('No regular users collection found or error accessing it');
    }
    
    console.log('');
    console.log('🎯 Summary:');
    console.log(`- Total admin users: ${adminUsers.length}`);
    console.log(`- Only these users should see admin navigation`);
    console.log(`- All other users should see NO admin navigation`);
    
  } catch (error) {
    console.error('❌ Error debugging admin status:', error);
    throw error;
  }
}

// Run the debug script
if (require.main === module) {
  debugAdminStatus()
    .then(() => {
      console.log('🎉 Admin status debug completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin status debug failed:', error);
      process.exit(1);
    });
}

export { debugAdminStatus };
