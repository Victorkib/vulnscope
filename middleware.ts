import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Check if Supabase environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not set. Skipping auth middleware.');
    // If no auth is configured, allow access to dashboard for development
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    // IMPORTANT: You *must* call one of the Supabase Auth methods to trigger the refresh
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (error) {
    console.error('Error in middleware auth check:', error);
    // If auth fails, allow access for development
  }

  // Don't protect user API routes here - let them handle their own auth
  // This prevents double auth checks

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
