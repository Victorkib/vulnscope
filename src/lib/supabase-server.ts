import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const createServerSupabaseClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (_error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
});

export const getServerUser = async () => {
  try {
    const supabase = await createServerSupabaseClient();

    // First try to get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError.message);
      return { user: null, error: sessionError.message };
    }

    if (!session) {
      console.log('No session found - user not authenticated');
      return { user: null, error: 'No active session' };
    }

    // Try to get the user from the session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('User error:', userError.message);
      return { user: null, error: userError.message };
    }

    if (!user) {
      console.log('No user found in session - user not authenticated');
      return { user: null, error: 'No active session' };
    }

    console.log('Server user found:', user.email);
    return { user, error: null };
  } catch (error: unknown) {
    console.error('Server auth exception:', error instanceof Error ? error.message : 'Unknown error');
    return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Alternative method that returns both session and user
export const getServerSession = async () => {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Server session error:', error.message);
      return { session: null, user: null, error: error.message };
    }

    return {
      session,
      user: session?.user || null,
      error: null,
    };
  } catch (error: unknown) {
    console.error('Server session exception:', error instanceof Error ? error.message : 'Unknown error');
    return { session: null, user: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Export a function that returns the supabase client
export const supabase = async () => {
  return await createServerSupabaseClient();
};