import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import type { AdminPermission } from '@/types/admin';

/**
 * Admin middleware for protecting admin routes
 */
export async function adminMiddleware(
  request: NextRequest,
  requiredPermissions: AdminPermission[] = []
): Promise<NextResponse | null> {
  try {
    // Check if user is admin with required permissions
    const adminUser = await adminAuthService.requireAdmin(requiredPermissions, request);
    
    // Add admin user info to request headers for use in API routes
    const response = NextResponse.next();
    response.headers.set('x-admin-user-id', adminUser.userId);
    response.headers.set('x-admin-role', adminUser.role);
    response.headers.set('x-admin-permissions', JSON.stringify(adminUser.permissions));
    
    return response;
  } catch (error) {
    console.error('Admin middleware error:', error);
    
    // Return 403 for admin access denied
    return NextResponse.json(
      { 
        error: 'Admin access required',
        message: error instanceof Error ? error.message : 'Unauthorized'
      },
      { status: 403 }
    );
  }
}

/**
 * Higher-order function to create admin-protected API handlers
 */
export function withAdminAuth(
  handler: (request: Request, adminUser: any) => Promise<Response>,
  requiredPermissions: AdminPermission[] = []
) {
  return async (request: Request): Promise<Response> => {
    try {
      const adminUser = await adminAuthService.requireAdmin(requiredPermissions, request);
      return await handler(request, adminUser);
    } catch (error) {
      console.error('Admin auth error:', error);
      
      return NextResponse.json(
        { 
          error: 'Admin access required',
          message: error instanceof Error ? error.message : 'Unauthorized'
        },
        { status: 403 }
      );
    }
  };
}

/**
 * Check if current user is admin (for client-side use)
 */
export async function checkAdminStatus(): Promise<{
  isAdmin: boolean;
  role?: string;
  permissions?: string[];
}> {
  try {
    const response = await fetch('/api/admin/status');
    
    if (!response.ok) {
      return { isAdmin: false };
    }
    
    const data = await response.json();
    return {
      isAdmin: data.isAdmin,
      role: data.role,
      permissions: data.permissions
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return { isAdmin: false };
  }
}

/**
 * Admin route matcher for middleware
 */
export const adminRouteMatcher = [
  '/admin/:path*',
  '/api/admin/:path*'
];

/**
 * Check if a path is an admin route
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}
