import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { SupabaseUserService } from '@/lib/supabase-user-service';
import { getDatabase } from '@/lib/mongodb';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET /api/admin/regular-users/[userId] - Get specific regular user
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['user_management'], request);
    const { userId } = await params;
    
    const user = await SupabaseUserService.getUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching regular user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch regular user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/regular-users/[userId] - Update regular user
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['user_management'], request);
    const { userId } = await params;
    
    const body = await request.json();
    const { name, role, isActive, metadata, reason } = body;
    
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
    const action = isActive === false ? 'user_suspend' : 'user_activate';
    await adminAuthService.logAdminAction(
      adminUser.userId,
      action,
      {
        targetId: userId,
        targetType: 'user',
        oldValue: currentUser,
        newValue: { ...currentUser, ...updates, isActive },
        reason: reason || `User ${action} by admin`,
        description: `User ${currentUser.email} ${action} by admin`
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating regular user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update regular user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/regular-users/[userId] - Delete regular user
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['user_delete'], request);
    const { userId } = await params;
    
    const body = await request.json().catch(() => ({}));
    const { reason } = body;
    
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    
    // Get current user
    const currentUser = await usersCollection.findOne({ id: userId });
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Soft delete - mark as deleted
    await usersCollection.updateOne(
      { id: userId },
      { 
        $set: { 
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: adminUser.userId,
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    // Log the action
    await adminAuthService.logAdminAction(
      adminUser.userId,
      'user_delete',
      {
        targetId: userId,
        targetType: 'user',
        oldValue: currentUser,
        newValue: { ...currentUser, isDeleted: true },
        reason: reason || 'User deleted by admin',
        description: `User ${currentUser.email} deleted by admin`
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting regular user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete regular user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
