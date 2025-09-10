import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { getDatabase } from '@/lib/mongodb';
import type { AdminUser, AdminRole, AdminUserFormData } from '@/types/admin';
import { ROLE_PERMISSIONS } from '@/types/admin';

// GET /api/admin/users - List all admin users
export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['user_management'], request);
    
    const adminUsers = await adminAuthService.getAllAdminUsers();
    
    return NextResponse.json({
      success: true,
      data: adminUsers,
      count: adminUsers.length
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch admin users',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new admin user
export async function POST(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['user_roles'], request);
    
    const body = await request.json();
    const { email, role, expiresAt, metadata }: AdminUserFormData = body;
    const userId = body.userId; // Extract userId separately
    
    if (!userId || !email || !role) {
      return NextResponse.json(
        { error: 'userId, email, and role are required' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!Object.keys(ROLE_PERMISSIONS).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }
    
    // Check if user already exists as admin
    const existingAdmin = await adminAuthService.getAdminUser(userId);
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'User is already an admin' },
        { status: 400 }
      );
    }
    
    // Create admin user
    const newAdminUser = await adminAuthService.createAdminUser(
      userId,
      email,
      role as AdminRole,
      adminUser.userId,
      metadata
    );
    
    return NextResponse.json({
      success: true,
      data: newAdminUser,
      message: 'Admin user created successfully'
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create admin user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
