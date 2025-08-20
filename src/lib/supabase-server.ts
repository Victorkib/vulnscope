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
          } catch (error) {
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
      console.error('No session found');
      return { user: null, error: 'No active session' };
    }

    // If we have a session, get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('User error:', userError.message);
      return { user: null, error: userError.message };
    }

    if (!user) {
      console.error('No user found in session');
      return { user: null, error: 'User not found' };
    }

    return { user, error: null };
  } catch (error: any) {
    console.error('Server auth exception:', error.message);
    return { user: null, error: error.message };
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
  } catch (error: any) {
    console.error('Server session exception:', error.message);
    return { session: null, user: null, error: error.message };
  }
};
