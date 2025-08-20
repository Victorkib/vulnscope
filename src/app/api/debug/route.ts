import { NextResponse } from 'next/server';
import { debugAuth } from '@/lib/auth-debug';
import { getServerUser, getServerSession } from '@/lib/supabase-server';

export async function GET() {
  try {
    console.log('=== AUTH DEBUG START ===');

    // Test different auth methods
    const debugResult = await debugAuth();
    const serverUserResult = await getServerUser();
    const serverSessionResult = await getServerSession();

    const result = {
      timestamp: new Date().toISOString(),
      debug: debugResult,
      serverUser: {
        user: serverUserResult.user?.id || null,
        error: serverUserResult.error,
      },
      serverSession: {
        user: serverSessionResult.user?.id || null,
        session: !!serverSessionResult.session,
        error: serverSessionResult.error,
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? 'Set'
          : 'Missing',
      },
    };

    console.log('Auth debug result:', result);
    console.log('=== AUTH DEBUG END ===');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Auth debug failed:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
