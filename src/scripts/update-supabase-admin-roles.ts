#!/usr/bin/env tsx

/**
 * Update Supabase User Metadata with Admin Roles
 * This script updates user metadata in Supabase to include admin roles
 * for proper authentication without API calls
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface AdminUser {
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'analyst';
}

// Default admin users to update
const adminUsers: AdminUser[] = [
  {
    email: 'qinalexander56@gmail.com',
    role: 'super_admin'
  }
  // Add more admin users here as needed
];

async function updateUserMetadata(email: string, role: string) {
  try {
    console.log(`🔍 Looking up user: ${email}`);
    
    // Find user by email
    const { data: users, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      console.error(`❌ Error searching for user ${email}:`, searchError);
      return false;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    
    // Update user metadata
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role: role,
        admin_role: role,
        is_admin: true,
        admin_permissions: getPermissionsForRole(role)
      }
    });
    
    if (error) {
      console.error(`❌ Error updating user ${email}:`, error);
      return false;
    }
    
    console.log(`✅ Successfully updated user ${email} with role: ${role}`);
    return true;
  } catch (error) {
    console.error(`❌ Exception updating user ${email}:`, error);
    return false;
  }
}

function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    super_admin: [
      'user_management', 'user_suspend', 'user_delete', 'user_roles',
      'system_config', 'database_maintenance', 'security_audit',
      'content_moderation', 'analytics_access', 'system_alerts',
      'backup_management', 'performance_monitoring'
    ],
    admin: [
      'user_management', 'user_suspend', 'user_roles',
      'system_config', 'security_audit', 'content_moderation',
      'analytics_access', 'system_alerts', 'performance_monitoring'
    ],
    moderator: [
      'user_management', 'content_moderation', 'analytics_access'
    ],
    analyst: [
      'analytics_access', 'security_audit'
    ]
  };
  
  return rolePermissions[role] || [];
}

async function main() {
  console.log('🚀 Starting Supabase Admin Role Update...\n');
  
  let successCount = 0;
  let totalCount = adminUsers.length;
  
  for (const adminUser of adminUsers) {
    console.log(`\n📝 Processing: ${adminUser.email} -> ${adminUser.role}`);
    const success = await updateUserMetadata(adminUser.email, adminUser.role);
    if (success) {
      successCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Total users processed: ${totalCount}`);
  console.log(`   Successfully updated: ${successCount}`);
  console.log(`   Failed: ${totalCount - successCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All admin users updated successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Users will now be authenticated via Supabase metadata');
    console.log('   2. No more API calls needed for admin status');
    console.log('   3. Admin navigation will show immediately on login');
  } else {
    console.log('\n⚠️  Some users failed to update. Please check the errors above.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { updateUserMetadata, getPermissionsForRole };
