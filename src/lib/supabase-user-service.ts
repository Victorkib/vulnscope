import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SupabaseUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string | null;
  phone_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  is_super_admin: boolean | null;
  raw_user_meta_data: any;
  raw_app_meta_data: any;
  user_metadata: any;
  app_metadata: any;
  aud: string;
  role: string;
  providers: string[];
  is_anonymous: boolean;
  is_sso_user: boolean;
  deleted_at: string | null;
  banned_until: string | null;
}

export interface SanitizedUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  isActive: boolean;
  role: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  providers: string[];
  isAdmin: boolean;
  adminRole: string | null;
  adminPermissions: string[];
}

export class SupabaseUserService {
  /**
   * Get all users from Supabase Auth
   */
  static async getAllUsers(options: {
    search?: string;
    status?: 'active' | 'suspended' | 'all';
    role?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    users: SanitizedUser[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const { search, status, role, limit = 50, offset = 0 } = options;

      // Get users from Supabase Auth
      const { data: response, error } = await supabaseAdmin.auth.admin.listUsers({
        page: Math.floor(offset / limit) + 1,
        perPage: limit
      });

      if (error) {
        console.error('Error fetching users from Supabase:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      // Extract users array from the nested response structure
      const users = response?.users || [];
      const total = users.length; // Use users array length as total

      // Filter users based on criteria - ensure we have an array
      let filteredUsers = Array.isArray(users) ? users : [];

      // Apply search filter
      if (search && Array.isArray(filteredUsers)) {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user?.email?.toLowerCase().includes(searchLower) ||
          user?.user_metadata?.name?.toLowerCase().includes(searchLower) ||
          user?.user_metadata?.full_name?.toLowerCase().includes(searchLower)
        );
      }

      // Apply status filter
      if (status && Array.isArray(filteredUsers)) {
        if (status === 'active') {
          filteredUsers = filteredUsers.filter(user => !(user as any)?.banned_until);
        } else if (status === 'suspended') {
          filteredUsers = filteredUsers.filter(user => (user as any)?.banned_until);
        }
      }

      // Apply role filter
      if (role && Array.isArray(filteredUsers)) {
        filteredUsers = filteredUsers.filter(user => {
          const userRole = user?.user_metadata?.role || user?.user_metadata?.admin_role || 'user';
          return userRole === role;
        });
      }

      // Final safety check before mapping
      if (!Array.isArray(filteredUsers)) {
        console.error('filteredUsers is not an array:', filteredUsers);
        filteredUsers = [];
      }

      // Sanitize user data
      const sanitizedUsers = filteredUsers.map(user => this.sanitizeUser(user as any));

      return {
        users: sanitizedUsers,
        total: total,
        hasMore: (offset + limit) < total
      };
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  /**
   * Get a specific user by ID
   */
  static async getUserById(userId: string): Promise<SanitizedUser | null> {
    try {
      const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (error) {
        console.error('Error fetching user by ID:', error);
        return null;
      }

      if (!user.user) {
        return null;
      }

      return this.sanitizeUser(user.user as any);
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  }

  /**
   * Update user metadata
   */
  static async updateUserMetadata(userId: string, metadata: any): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metadata
      });

      if (error) {
        console.error('Error updating user metadata:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserMetadata:', error);
      return false;
    }
  }

  /**
   * Suspend a user (ban until a specific date)
   */
  static async suspendUser(userId: string, banUntil: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: banUntil
      });

      if (error) {
        console.error('Error suspending user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in suspendUser:', error);
      return false;
    }
  }

  /**
   * Activate a user (remove ban)
   */
  static async activateUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      });

      if (error) {
        console.error('Error activating user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in activateUser:', error);
      return false;
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        console.error('Error deleting user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return false;
    }
  }

  /**
   * Sanitize user data for admin display
   */
  private static sanitizeUser(user: SupabaseUser): SanitizedUser {
    const userMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    
    // Determine if user is admin
    const adminRole = userMetadata.role || userMetadata.admin_role || null;
    const isAdmin = adminRole && ['super_admin', 'admin', 'moderator', 'analyst'].includes(adminRole);
    
    // Get admin permissions
    const adminPermissions = userMetadata.admin_permissions || [];
    
    return {
      id: user.id,
      email: user.email || '',
      name: userMetadata.name || userMetadata.full_name || user.email?.split('@')[0] || 'Unknown',
      avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
      isActive: !user.banned_until,
      role: adminRole || 'user',
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      emailConfirmed: !!user.email_confirmed_at,
      providers: user.providers || [],
      isAdmin,
      adminRole,
      adminPermissions
    };
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    admins: number;
    newToday: number;
  }> {
    try {
      const { data: response, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000 // Get all users for stats
      });

      if (error) {
        console.error('Error fetching users for stats:', error);
        throw new Error(`Failed to fetch user stats: ${error.message}`);
      }

      // Extract users array from the nested response structure
      const users = response?.users || [];
      const allUsers = Array.isArray(users) ? users : [];
      const today = new Date().toISOString().split('T')[0];

      const stats = {
        total: allUsers.length,
        active: allUsers.filter(user => !(user as any)?.banned_until).length,
        suspended: allUsers.filter(user => (user as any)?.banned_until).length,
        admins: allUsers.filter(user => {
          const role = user?.user_metadata?.role || user?.user_metadata?.admin_role;
          return role && ['super_admin', 'admin', 'moderator', 'analyst'].includes(role);
        }).length,
        newToday: allUsers.filter(user => 
          user?.created_at?.startsWith(today)
        ).length
      };

      return stats;
    } catch (error) {
      console.error('Error in getUserStats:', error);
      throw error;
    }
  }
}
