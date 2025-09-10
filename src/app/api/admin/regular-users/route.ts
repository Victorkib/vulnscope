import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { SupabaseUserService } from '@/lib/supabase-user-service';

// GET /api/admin/regular-users - List all regular users
export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['user_management'], request);
    
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status'); // 'active', 'suspended', 'all'
    const role = url.searchParams.get('role');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Get users from Supabase
    const result = await SupabaseUserService.getAllUsers({
      search: search || undefined,
      status: (status as 'active' | 'suspended' | 'all') || 'all',
      role: role || undefined,
      limit,
      offset
    });
    
    return NextResponse.json({
      success: true,
      data: result.users,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching regular users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch regular users',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/regular-users - Create or update regular user
export async function POST(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['user_management'], request);
    
    const body = await request.json();
    const { userId, email, name, role, isActive, metadata } = body;
    
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }
    
    // Get current user from Supabase
    const currentUser = await SupabaseUserService.getUserById(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prepare metadata updates
    const updates: any = {};
    
    if (name !== undefined) {
      updates.name = name;
    }
    if (role !== undefined) {
      updates.role = role;
    }
    if (metadata !== undefined) {
      updates.metadata = { ...currentUser, ...metadata };
    }
    
    // Update user metadata in Supabase
    const success = await SupabaseUserService.updateUserMetadata(userId, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    // Handle user suspension/activation
    if (isActive !== undefined) {
      if (isActive === false) {
        // Suspend user (ban for 1 year)
        const banUntil = new Date();
        banUntil.setFullYear(banUntil.getFullYear() + 1);
        await SupabaseUserService.suspendUser(userId, banUntil.toISOString());
      } else {
        // Activate user (remove ban)
        await SupabaseUserService.activateUser(userId);
      }
    }
    
    // Log the action
    await adminAuthService.logAdminAction(
      adminUser.userId,
      'user_update',
      {
        targetId: userId,
        targetType: 'user',
        oldValue: currentUser,
        newValue: { ...currentUser, ...updates, isActive },
        reason: 'User updated by admin',
        description: `User ${currentUser.email} updated by admin`
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error managing regular user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage regular user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
