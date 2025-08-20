import { createServerSupabaseClient } from './supabase-server';

export async function debugAuth() {
  try {
    const supabase = await createServerSupabaseClient();

    // Check session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    console.log('Session check:', {
      hasSession: !!sessionData.session,
      sessionError: sessionError?.message,
      userId: sessionData.session?.user?.id,
    });

    // Check user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('User check:', {
      hasUser: !!userData.user,
      userError: userError?.message,
      userId: userData.user?.id,
    });

    return {
      session: sessionData.session,
      user: userData.user,
      errors: {
        session: sessionError?.message,
        user: userError?.message,
      },
    };
  } catch (error: any) {
    console.error('Debug auth error:', error.message);
    return {
      session: null,
      user: null,
      errors: {
        exception: error.message,
      },
    };
  }
}
