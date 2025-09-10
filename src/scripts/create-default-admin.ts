import { createDefaultAdmin } from './initialize-admin';

/**
 * Create the default admin user for qinalexander56@gmail.com
 */
async function createDefaultAdminUser() {
  try {
    console.log('🚀 Creating default admin user...');
    
    const userId = 'b085f05c-ba41-45a9-8aeb-23e8c03afbe7';
    const email = 'qinalexander56@gmail.com';
    const role = 'super_admin';
    
    console.log(`👤 Creating admin user:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${role}`);
    
    const result = await createDefaultAdmin(userId, email, role);
    
    console.log('✅ Default admin user created successfully!');
    console.log('📋 Admin Details:', JSON.stringify(result.data, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Error creating default admin user:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createDefaultAdminUser()
    .then(() => {
      console.log('🎉 Default admin user setup completed!');
      console.log('🔗 You can now log in and access the admin dashboard at /admin/dashboard');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create default admin user:', error);
      process.exit(1);
    });
}

export { createDefaultAdminUser };
