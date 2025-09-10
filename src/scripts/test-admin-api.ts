import { getDatabase } from '@/lib/mongodb';
import { adminAuthService } from '@/lib/admin-auth';
import { getServerUser } from '@/lib/supabase-server';

/**
 * Test the admin API endpoints directly
 */
async function testAdminAPI() {
  try {
    console.log('🧪 Testing Admin API Endpoints...\n');
    
    const db = await getDatabase();
    
    // Test 1: Check admin user in database
    console.log('📋 Test 1: Database Admin User Check');
    const adminUsersCollection = db.collection('admin_users');
    const adminUser = await adminUsersCollection.findOne({ 
      userId: 'b085f05c-ba41-45a9-8aeb-23e8c03afbe7' 
    });
    
    if (adminUser) {
      console.log('✅ Admin user found in database:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   User ID: ${adminUser.userId}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Active: ${adminUser.isActive}`);
      console.log(`   Permissions: ${adminUser.permissions.length} permissions`);
      console.log(`   Granted At: ${adminUser.grantedAt}`);
      console.log(`   Expires At: ${adminUser.expiresAt || 'Never'}`);
    } else {
      console.log('❌ Admin user NOT found in database');
    }
    console.log('');
    
    // Test 2: Test adminAuthService.getAdminUser
    console.log('📋 Test 2: AdminAuthService.getAdminUser');
    const serviceAdminUser = await adminAuthService.getAdminUser('b085f05c-ba41-45a9-8aeb-23e8c03afbe7');
    
    if (serviceAdminUser) {
      console.log('✅ AdminAuthService found admin user:');
      console.log(`   Email: ${serviceAdminUser.email}`);
      console.log(`   User ID: ${serviceAdminUser.userId}`);
      console.log(`   Role: ${serviceAdminUser.role}`);
      console.log(`   Active: ${serviceAdminUser.isActive}`);
    } else {
      console.log('❌ AdminAuthService did NOT find admin user');
    }
    console.log('');
    
    // Test 3: Test with non-existent user
    console.log('📋 Test 3: Non-existent User Test');
    const nonExistentUser = await adminAuthService.getAdminUser('non-existent-user-id');
    console.log(`Non-existent user result: ${nonExistentUser ? 'FOUND (❌ ERROR!)' : 'NOT FOUND (✅ Correct)'}`);
    console.log('');
    
    // Test 4: Check if there are any other admin users
    console.log('📋 Test 4: All Admin Users in Database');
    const allAdminUsers = await adminUsersCollection.find({}).toArray();
    console.log(`Total admin users: ${allAdminUsers.length}`);
    allAdminUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.userId}) - Active: ${user.isActive}`);
    });
    console.log('');
    
    // Test 5: Check MongoDB connection
    console.log('📋 Test 5: MongoDB Connection Test');
    try {
      const testCollection = db.collection('test');
      await testCollection.insertOne({ test: 'connection' });
      await testCollection.deleteOne({ test: 'connection' });
      console.log('✅ MongoDB connection is working');
    } catch (error) {
      console.log('❌ MongoDB connection failed:', error);
    }
    console.log('');
    
    // Test 6: Check admin user permissions
    if (adminUser) {
      console.log('📋 Test 6: Admin User Permissions');
      console.log('Permissions:');
      adminUser.permissions.forEach((permission, index) => {
        console.log(`  ${index + 1}. ${permission}`);
      });
      console.log('');
    }
    
    // Test 7: Check if admin user is expired
    if (adminUser && adminUser.expiresAt) {
      console.log('📋 Test 7: Admin User Expiration Check');
      const now = new Date();
      const expiresAt = new Date(adminUser.expiresAt);
      const isExpired = expiresAt < now;
      console.log(`Current time: ${now.toISOString()}`);
      console.log(`Expires at: ${expiresAt.toISOString()}`);
      console.log(`Is expired: ${isExpired ? 'YES (❌ ERROR!)' : 'NO (✅ Correct)'}`);
      console.log('');
    }
    
    console.log('🎯 Summary:');
    if (adminUser && adminUser.isActive && (!adminUser.expiresAt || new Date(adminUser.expiresAt) > new Date())) {
      console.log('✅ Admin user should have access');
      console.log('✅ Admin navigation should be visible');
      console.log('✅ Admin dashboard should be accessible');
    } else {
      console.log('❌ Admin user should NOT have access');
      console.log('❌ Admin navigation should NOT be visible');
      console.log('❌ Admin dashboard should NOT be accessible');
    }
    
  } catch (error) {
    console.error('❌ Error testing admin API:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testAdminAPI()
    .then(() => {
      console.log('🎉 Admin API test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin API test failed:', error);
      process.exit(1);
    });
}

export { testAdminAPI };
