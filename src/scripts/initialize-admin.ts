import { getDatabase } from '@/lib/mongodb';
import { adminAuthService } from '@/lib/admin-auth';
import { DEFAULT_ADMIN_CONFIG } from '@/types/admin';

/**
 * Initialize the admin system with default admin users
 */
export async function initializeAdminSystem() {
  try {
    console.log('🚀 Initializing admin system...');
    
    const db = await getDatabase();
    
    // Create admin collections if they don't exist
    await createAdminCollections(db);
    
    // Initialize default admin users
    await adminAuthService.initializeDefaultAdmins();
    
    // Create indexes for better performance
    await createAdminIndexes(db);
    
    console.log('✅ Admin system initialized successfully');
    
    return {
      success: true,
      message: 'Admin system initialized successfully'
    };
  } catch (error) {
    console.error('❌ Error initializing admin system:', error);
    throw error;
  }
}

/**
 * Create admin collections
 */
async function createAdminCollections(db: any) {
  console.log('📁 Creating admin collections...');
  
  // Create admin_users collection
  const adminUsersCollection = db.collection('admin_users');
  await adminUsersCollection.createIndex({ userId: 1 }, { unique: true });
  await adminUsersCollection.createIndex({ email: 1 }, { unique: true });
  await adminUsersCollection.createIndex({ role: 1 });
  await adminUsersCollection.createIndex({ isActive: 1 });
  
  // Create admin_audit_logs collection
  const auditLogsCollection = db.collection('admin_audit_logs');
  await auditLogsCollection.createIndex({ adminId: 1 });
  await auditLogsCollection.createIndex({ action: 1 });
  await auditLogsCollection.createIndex({ timestamp: -1 });
  await auditLogsCollection.createIndex({ targetType: 1 });
  
  // Create system_config collection
  const systemConfigCollection = db.collection('system_config');
  await systemConfigCollection.createIndex({ key: 1 }, { unique: true });
  await systemConfigCollection.createIndex({ category: 1 });
  
  console.log('✅ Admin collections created');
}

/**
 * Create indexes for better performance
 */
async function createAdminIndexes(db: any) {
  console.log('🔍 Creating admin indexes...');
  
  // Admin users indexes
  const adminUsersCollection = db.collection('admin_users');
  await adminUsersCollection.createIndex({ 
    userId: 1, 
    isActive: 1 
  });
  
  // Audit logs indexes
  const auditLogsCollection = db.collection('admin_audit_logs');
  await auditLogsCollection.createIndex({ 
    adminId: 1, 
    timestamp: -1 
  });
  await auditLogsCollection.createIndex({ 
    action: 1, 
    timestamp: -1 
  });
  
  console.log('✅ Admin indexes created');
}

/**
 * Create a default admin user
 */
export async function createDefaultAdmin(
  userId: string,
  email: string,
  role: 'super_admin' | 'admin' = 'super_admin'
) {
  try {
    console.log(`👤 Creating default admin: ${email} (${role})`);
    
    const adminUser = await adminAuthService.createAdminUser(
      userId,
      email,
      role,
      'system',
      {
        reason: 'Default system administrator',
        department: 'IT Security',
        notes: 'Created during system initialization'
      }
    );
    
    console.log('✅ Default admin created successfully');
    
    return {
      success: true,
      data: adminUser,
      message: 'Default admin created successfully'
    };
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
    throw error;
  }
}

/**
 * Check if admin system is properly initialized
 */
export async function checkAdminSystemStatus() {
  try {
    const db = await getDatabase();
    
    // Check if collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col: any) => col.name);
    
    const requiredCollections = ['admin_users', 'admin_audit_logs', 'system_config'];
    const missingCollections = requiredCollections.filter(
      name => !collectionNames.includes(name)
    );
    
    if (missingCollections.length > 0) {
      return {
        initialized: false,
        missingCollections,
        message: 'Admin system not fully initialized'
      };
    }
    
    // Check if admin users exist
    const adminUsersCollection = db.collection('admin_users');
    const adminCount = await adminUsersCollection.countDocuments();
    
    return {
      initialized: true,
      adminCount,
      message: 'Admin system is properly initialized'
    };
  } catch (error) {
    console.error('Error checking admin system status:', error);
    return {
      initialized: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check admin system status'
    };
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeAdminSystem()
    .then(() => {
      console.log('🎉 Admin system initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin system initialization failed:', error);
      process.exit(1);
    });
}
