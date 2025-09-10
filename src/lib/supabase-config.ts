/**
 * Centralized Supabase Configuration Utility
 * Handles environment variable loading and client creation
 */

import { createClient } from '@supabase/supabase-js';

// Environment variable validation
export const validateSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  return {
    isValid: missing.length === 0,
    missing,
    config: {
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceKey,
    }
  };
};

// Create Supabase client with service role (for server-side operations)
export const createSupabaseServiceClient = () => {
  const { isValid, missing, config } = validateSupabaseConfig();
  
  if (!isValid) {
    throw new Error(`Supabase configuration missing: ${missing.join(', ')}`);
  }

  return createClient(config.supabaseUrl!, config.supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Create Supabase client with anon key (for client-side operations)
export const createSupabaseAnonClient = () => {
  const { isValid, missing, config } = validateSupabaseConfig();
  
  if (!isValid) {
    throw new Error(`Supabase configuration missing: ${missing.join(', ')}`);
  }

  return createClient(config.supabaseUrl!, config.supabaseAnonKey!);
};

// Safe sync function that handles missing configuration gracefully
export const safeSyncToSupabase = async <T>(
  syncFunction: (client: ReturnType<typeof createSupabaseServiceClient>) => Promise<T>,
  fallbackValue?: T
): Promise<T | null> => {
  try {
    const client = createSupabaseServiceClient();
    return await syncFunction(client);
  } catch (error) {
    console.warn('Supabase sync failed:', error instanceof Error ? error.message : 'Unknown error');
    return fallbackValue || null;
  }
};

// Environment variable debug info
export const getSupabaseDebugInfo = () => {
  const { isValid, missing, config } = validateSupabaseConfig();
  
  return {
    isValid,
    missing,
    hasUrl: !!config.supabaseUrl,
    hasAnonKey: !!config.supabaseAnonKey,
    hasServiceKey: !!config.supabaseServiceKey,
    nodeEnv: process.env.NODE_ENV,
    allSupabaseKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
  };
};
