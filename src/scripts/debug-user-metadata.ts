#!/usr/bin/env tsx

/**
 * Debug User Metadata Script
 * This script checks what's actually in the user metadata
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugUserMetadata(email: string) {
  try {
    console.log(`🔍 Looking up user: ${email}`);
    
    // Find user by email
    const { data: users, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      console.error(`❌ Error searching for user ${email}:`, searchError);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }
    
    console.log(`\n✅ Found user: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Last Sign In: ${user.last_sign_in_at}`);
    
    console.log(`\n📋 User Metadata:`);
    console.log(JSON.stringify(user.user_metadata, null, 2));
    
    console.log(`\n📋 App Metadata:`);
    console.log(JSON.stringify(user.app_metadata, null, 2));
    
    // Check for admin role
    const role = user.user_metadata?.role || user.user_metadata?.admin_role;
    console.log(`\n🔍 Admin Role Check:`);
    console.log(`   Role: ${role}`);
    console.log(`   Is Admin: ${role && ['super_admin', 'admin', 'moderator', 'analyst'].includes(role)}`);
    
  } catch (error) {
    console.error(`❌ Exception:`, error);
  }
}

async function main() {
  console.log('🚀 Debugging User Metadata...\n');
  
  await debugUserMetadata('qinalexander56@gmail.com');
}

if (require.main === module) {
  main().catch(console.error);
}
