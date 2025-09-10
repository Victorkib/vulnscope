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
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
          ? 'Set'
          : 'Missing',
        nodeEnv: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
      },
    };

    console.log('Auth debug result:', result);
    console.log('=== AUTH DEBUG END ===');

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Auth debug failed:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
