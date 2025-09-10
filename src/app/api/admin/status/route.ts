import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { adminAuthService } from '@/lib/admin-auth';

export async function GET() {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ 
        isAdmin: false,
        error: 'Not authenticated'
      });
    }

    const adminUser = await adminAuthService.getAdminUser(user.id);
    
    if (!adminUser || !adminUser.isActive) {
      return NextResponse.json({ 
        isAdmin: false,
        error: 'Not an admin'
      });
    }

    // Check if admin role has expired
    if (adminUser.expiresAt && new Date(adminUser.expiresAt) < new Date()) {
      return NextResponse.json({ 
        isAdmin: false,
        error: 'Admin access expired'
      });
    }

    return NextResponse.json({
      isAdmin: true,
      role: adminUser.role,
      permissions: adminUser.permissions,
      email: adminUser.email,
      grantedAt: adminUser.grantedAt,
      expiresAt: adminUser.expiresAt
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { 
        isAdmin: false,
        error: 'Failed to check admin status'
      },
      { status: 500 }
    );
  }
}
