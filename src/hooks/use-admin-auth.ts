'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import type { AdminUser, AdminPermission } from '@/types/admin';
import { ROLE_PERMISSIONS } from '@/types/admin';

interface AdminAuthState {
  isAdmin: boolean;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
}

// Cache for admin status to prevent repeated API calls
const adminStatusCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useAdminAuth() {
  const { user } = useAuth();
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    adminUser: null,
    loading: true,
    error: null
  });

  // Check if user has admin role from Supabase metadata first
  const isAdminFromMetadata = useMemo(() => {
    if (!user?.user_metadata) return false;
    
    // Check for admin role in user metadata (Supabase stores it in user_metadata)
    const role = user.user_metadata.role || user.user_metadata.admin_role;
    const isAdmin = role && ['super_admin', 'admin', 'moderator', 'analyst'].includes(role);
    
    return isAdmin;
  }, [user?.user_metadata]);

  // Get admin role from metadata
  const adminRoleFromMetadata = useMemo(() => {
    if (!user?.user_metadata) return null;
    return user.user_metadata.role || user.user_metadata.admin_role || null;
  }, [user?.user_metadata]);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setState({
        isAdmin: false,
        adminUser: null,
        loading: false,
        error: null
      });
      return;
    }

    // Check cache first
    const cacheKey = user.id;
    const cached = adminStatusCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      // Use cached data
      if (cached.data.isAdmin) {
        setState({
          isAdmin: true,
          adminUser: cached.data.adminUser,
          loading: false,
          error: null
        });
      } else {
        setState({
          isAdmin: false,
          adminUser: null,
          loading: false,
          error: cached.data.error || 'Not an admin'
        });
      }
      return;
    }

    // If we have admin role in metadata, use it directly
    if (isAdminFromMetadata && adminRoleFromMetadata) {
      const adminUser: AdminUser = {
        userId: user.id,
        email: user.email || '',
        role: adminRoleFromMetadata as any,
        permissions: getPermissionsForRole(adminRoleFromMetadata) as AdminPermission[],
        isActive: true,
        grantedBy: 'system',
        grantedAt: user.created_at || new Date().toISOString(),
        expiresAt: null,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setState({
        isAdmin: true,
        adminUser,
        loading: false,
        error: null
      });

      // Cache the result
      adminStatusCache.set(cacheKey, {
        data: { isAdmin: true, adminUser },
        timestamp: now
      });
      return;
    }

    // Fallback to API call only if no metadata
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/admin/status');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.isAdmin === true) {
        const adminUser: AdminUser = {
          userId: user.id,
          email: data.email,
          role: data.role,
          permissions: data.permissions,
          isActive: true,
          grantedBy: 'system',
          grantedAt: data.grantedAt,
          expiresAt: data.expiresAt,
          createdAt: data.grantedAt,
          updatedAt: data.grantedAt
        };

        setState({
          isAdmin: true,
          adminUser,
          loading: false,
          error: null
        });

        // Cache the result
        adminStatusCache.set(cacheKey, {
          data: { isAdmin: true, adminUser },
          timestamp: now
        });
      } else {
        setState({
          isAdmin: false,
          adminUser: null,
          loading: false,
          error: data.error || 'Not an admin'
        });

        // Cache the result
        adminStatusCache.set(cacheKey, {
          data: { isAdmin: false, error: data.error || 'Not an admin' },
          timestamp: now
        });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setState({
        isAdmin: false,
        adminUser: null,
        loading: false,
        error: 'Failed to check admin status'
      });
    }
  }, [user, isAdminFromMetadata, adminRoleFromMetadata]);

  // Helper function to get permissions for a role
  const getPermissionsForRole = (role: string): string[] => {
    return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.isAdmin || !state.adminUser) {
      return false;
    }
    return state.adminUser.permissions.includes(permission as any);
  }, [state.isAdmin, state.adminUser]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!state.isAdmin || !state.adminUser) {
      return false;
    }
    return permissions.some(permission => 
      state.adminUser!.permissions.includes(permission as any)
    );
  }, [state.isAdmin, state.adminUser]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!state.isAdmin || !state.adminUser) {
      return false;
    }
    return permissions.every(permission => 
      state.adminUser!.permissions.includes(permission as any)
    );
  }, [state.isAdmin, state.adminUser]);

  const isRole = useCallback((role: string): boolean => {
    if (!state.isAdmin || !state.adminUser) {
      return false;
    }
    return state.adminUser.role === role;
  }, [state.isAdmin, state.adminUser]);

  const isSuperAdmin = useCallback((): boolean => {
    return isRole('super_admin');
  }, [isRole]);

  const isAdmin = useCallback((): boolean => {
    return isRole('admin') || isSuperAdmin();
  }, [isRole, isSuperAdmin]);

  const isModerator = useCallback((): boolean => {
    return isRole('moderator') || isAdmin();
  }, [isRole, isAdmin]);

  const isAnalyst = useCallback((): boolean => {
    return isRole('analyst') || isModerator();
  }, [isRole, isModerator]);

  // Check admin status when user changes, but only once per user
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user?.id]); // Only depend on user ID, not the entire checkAdminStatus function

  return {
    ...state,
    checkAdminStatus,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
    isSuperAdmin,
    isModerator,
    isAnalyst
  };
}
