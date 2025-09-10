#!/usr/bin/env tsx

/**
 * Debug Frontend Auth Script
 * This script simulates what the frontend auth provider receives
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugFrontendAuth() {
  try {
    console.log('🚀 Debugging Frontend Auth...\n');
    
    // Get current session (this is what the frontend sees)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      return;
    }
    
    if (!session) {
      console.log('❌ No active session found');
      console.log('   You need to be logged in to test this');
      return;
    }
    
    console.log('✅ Active session found');
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}`);
    console.log(`   Created: ${session.user.created_at}`);
    
    console.log('\n📋 User Metadata (what frontend sees):');
    console.log(JSON.stringify(session.user.user_metadata, null, 2));
    
    console.log('\n📋 App Metadata (what frontend sees):');
    console.log(JSON.stringify(session.user.app_metadata, null, 2));
    
    // Check admin role detection
    const role = session.user.user_metadata?.role || session.user.user_metadata?.admin_role;
    const isAdmin = role && ['super_admin', 'admin', 'moderator', 'analyst'].includes(role);
    
    console.log('\n🔍 Admin Detection:');
    console.log(`   Role: ${role}`);
    console.log(`   Is Admin: ${isAdmin}`);
    console.log(`   Should show admin nav: ${isAdmin ? 'YES' : 'NO'}`);
    
    if (!isAdmin) {
      console.log('\n⚠️  Issue Found:');
      console.log('   The frontend is not detecting the admin role');
      console.log('   This could be due to:');
      console.log('   1. Cached session data');
      console.log('   2. Need to refresh the session');
      console.log('   3. Frontend code issue');
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

async function main() {
  await debugFrontendAuth();
}

if (require.main === module) {
  main().catch(console.error);
}
