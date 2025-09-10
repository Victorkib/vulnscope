import { getDatabase } from '@/lib/mongodb';

/**
 * Clean up problematic admin users
 */
async function cleanupAdminUsers() {
  try {
    console.log('🧹 Cleaning up admin users...\n');
    
    const db = await getDatabase();
    const adminUsersCollection = db.collection('admin_users');
    
    // Get all admin users
    const adminUsers = await adminUsersCollection.find({}).toArray();
    
    console.log('📋 Current Admin Users:');
    adminUsers.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.email} (${admin.userId})`);
      console.log(`     Role: ${admin.role}`);
      console.log(`     Active: ${admin.isActive}`);
      console.log('');
    });
    
    // Remove admin users with invalid userIds
    const invalidUserIds = ['system', 'default', 'admin'];
    
    for (const invalidUserId of invalidUserIds) {
      const result = await adminUsersCollection.deleteMany({ userId: invalidUserId });
      if (result.deletedCount > 0) {
        console.log(`🗑️ Removed ${result.deletedCount} admin user(s) with userId: ${invalidUserId}`);
      }
    }
    
    // Get remaining admin users
    const remainingAdminUsers = await adminUsersCollection.find({}).toArray();
    
    console.log('📋 Remaining Admin Users:');
    remainingAdminUsers.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.email} (${admin.userId})`);
      console.log(`     Role: ${admin.role}`);
      console.log(`     Active: ${admin.isActive}`);
      console.log('');
    });
    
    console.log('✅ Admin user cleanup completed!');
    console.log(`Total admin users remaining: ${remainingAdminUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error cleaning up admin users:', error);
    throw error;
  }
}

// Run the cleanup script
if (require.main === module) {
  cleanupAdminUsers()
    .then(() => {
      console.log('🎉 Admin user cleanup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin user cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanupAdminUsers };
