import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import type { AdminRole, AdminUserFormData } from '@/types/admin';
import { ROLE_PERMISSIONS } from '@/types/admin';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET /api/admin/users/[userId] - Get specific admin user
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['user_management'], request);
    const { userId } = await params;
    
    const targetAdminUser = await adminAuthService.getAdminUser(userId);
    
    if (!targetAdminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: targetAdminUser
    });
  } catch (error) {
    console.error('Error fetching admin user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch admin user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[userId] - Update admin user
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['user_roles'], request);
    const { userId } = await params;
    
    const body = await request.json();
    const { role, expiresAt, metadata }: Partial<AdminUserFormData> = body;
    
    // Get current admin user
    const currentAdminUser = await adminAuthService.getAdminUser(userId);
    if (!currentAdminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }
    
    // Validate role if provided
    if (role && !Object.keys(ROLE_PERMISSIONS).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }
    
    // Update admin user
    const updatedAdminUser = await adminAuthService.createAdminUser(
      userId,
      currentAdminUser.email,
      (role as AdminRole) || currentAdminUser.role,
      adminUser.userId,
      metadata || currentAdminUser.metadata
    );
    
    return NextResponse.json({
      success: true,
      data: updatedAdminUser,
      message: 'Admin user updated successfully'
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update admin user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Deactivate admin user
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['user_roles'], request);
    const { userId } = await params;
    
    // Prevent self-deactivation
    if (userId === adminUser.userId) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own admin account' },
        { status: 400 }
      );
    }
    
    const body = await request.json().catch(() => ({}));
    const { reason } = body;
    
    await adminAuthService.deactivateAdminUser(userId, adminUser.userId, reason);
    
    return NextResponse.json({
      success: true,
      message: 'Admin user deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating admin user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to deactivate admin user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
