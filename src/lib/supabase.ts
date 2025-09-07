import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create the client if we have valid environment variables
export const supabase = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper functions for common auth operations
export const auth = {
  signUp: async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your environment variables.');
    }
    return await supabase.auth.signUp({ email, password });
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your environment variables.');
    }
    return await supabase.auth.signInWithPassword({ email, password });
  },

  signOut: async () => {
    if (!supabase) {
      return { error: null };
    }
    return await supabase.auth.signOut();
  },

  resetPassword: async (email: string) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your environment variables.');
    }
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  },

  updatePassword: async (newPassword: string) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your environment variables.');
    }
    return await supabase.auth.updateUser({ password: newPassword });
  },

  resendVerification: async (email: string) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your environment variables.');
    }
    return await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
  },

  signInWithGoogle: async () => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your environment variables.');
    }
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  },

  signInWithGitHub: async () => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check your environment variables.');
    }
    return await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  },

  getUser: async () => {
    if (!supabase) {
      return null;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  getSession: async () => {
    if (!supabase) {
      return { data: { session: null }, error: null };
    }
    return await supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default supabase;
