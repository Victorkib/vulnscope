import { getServerUser } from '@/lib/supabase-server';
import { getDatabase } from '@/lib/mongodb';
import type { AdminUser, AdminRole, AdminPermission, AdminAuditLog, AdminAction, AdminTargetType } from '@/types/admin';
import { ROLE_PERMISSIONS, DEFAULT_ADMIN_CONFIG } from '@/types/admin';

export class AdminAuthService {
  private static instance: AdminAuthService;

  public static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  /**
   * Check if a user is an admin and has the required permissions
   */
  async requireAdmin(
    requiredPermissions: AdminPermission[] = [],
    request?: Request
  ): Promise<AdminUser> {
    const { user, error } = await getServerUser();
    
    if (error || !user) {
      throw new Error('Authentication required');
    }

    const adminUser = await this.getAdminUser(user.id);
    if (!adminUser || !adminUser.isActive) {
      throw new Error('Admin access required');
    }

    // Check if admin role has expired
    if (adminUser.expiresAt && new Date(adminUser.expiresAt) < new Date()) {
      throw new Error('Admin access has expired');
    }

    // Check permissions
    for (const permission of requiredPermissions) {
      if (!adminUser.permissions.includes(permission)) {
        await this.logAdminAction(adminUser.userId, 'admin_access_denied', {
          permissions: [permission],
          endpoint: request?.url,
          reason: 'Insufficient permissions'
        });
        throw new Error(`Permission denied: ${permission}`);
      }
    }

    // Log successful admin access
    await this.logAdminAction(adminUser.userId, 'admin_access', {
      endpoint: request?.url,
      permissions: requiredPermissions,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent')
    });

    return adminUser;
  }

  /**
   * Get admin user by user ID
   */
  async getAdminUser(userId: string): Promise<AdminUser | null> {
    try {
      const db = await getDatabase();
      const adminUsersCollection = db.collection('admin_users');
      
      const adminUser = await adminUsersCollection.findOne({ userId });
      return adminUser as unknown as AdminUser | null;
    } catch (error) {
      console.error('Error fetching admin user:', error);
      return null;
    }
  }

  /**
   * Check if user is admin (simple check)
   */
  async isAdmin(userId: string): Promise<boolean> {
    const adminUser = await this.getAdminUser(userId);
    return adminUser !== null && adminUser.isActive;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permission: AdminPermission): Promise<boolean> {
    const adminUser = await this.getAdminUser(userId);
    if (!adminUser || !adminUser.isActive) {
      return false;
    }
    return adminUser.permissions.includes(permission);
  }

  /**
   * Create or update admin user
   */
  async createAdminUser(
    userId: string,
    email: string,
    role: AdminRole,
    grantedBy: string,
    metadata?: any
  ): Promise<AdminUser> {
    try {
      const db = await getDatabase();
      const adminUsersCollection = db.collection('admin_users');
      
      const permissions = ROLE_PERMISSIONS[role];
      const now = new Date().toISOString();
      
      const adminUser: AdminUser = {
        userId,
        email,
        role,
        permissions,
        isActive: true,
        grantedBy,
        grantedAt: now,
        metadata,
        createdAt: now,
        updatedAt: now
      };

      // Check if admin user already exists
      const existingAdmin = await adminUsersCollection.findOne({ userId });
      
      if (existingAdmin) {
        // Update existing admin
        await adminUsersCollection.updateOne(
          { userId },
          {
            $set: {
              role,
              permissions,
              grantedBy,
              grantedAt: now,
              metadata,
              updatedAt: now
            }
          }
        );
      } else {
        // Create new admin
        await adminUsersCollection.insertOne(adminUser as any);
      }

      // Log the admin creation/update
      await this.logAdminAction(grantedBy, 'permission_granted', {
        targetId: userId,
        targetType: 'user',
        newValue: { role, permissions },
        reason: 'Admin user created/updated'
      });

      return adminUser;
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw new Error('Failed to create admin user');
    }
  }

  /**
   * Deactivate admin user
   */
  async deactivateAdminUser(userId: string, deactivatedBy: string, reason?: string): Promise<void> {
    try {
      const db = await getDatabase();
      const adminUsersCollection = db.collection('admin_users');
      
      await adminUsersCollection.updateOne(
        { userId },
        {
          $set: {
            isActive: false,
            updatedAt: new Date().toISOString()
          }
        }
      );

      // Log the deactivation
      await this.logAdminAction(deactivatedBy, 'permission_revoked', {
        targetId: userId,
        targetType: 'user',
        reason: reason || 'Admin access revoked'
      });
    } catch (error) {
      console.error('Error deactivating admin user:', error);
      throw new Error('Failed to deactivate admin user');
    }
  }

  /**
   * Get all admin users
   */
  async getAllAdminUsers(): Promise<AdminUser[]> {
    try {
      const db = await getDatabase();
      const adminUsersCollection = db.collection('admin_users');
      
      const adminUsers = await adminUsersCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      return adminUsers as unknown as AdminUser[];
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  }

  /**
   * Log admin action for audit trail
   */
  async logAdminAction(
    adminId: string,
    action: AdminAction,
    details: {
      targetId?: string;
      targetType?: AdminTargetType;
      oldValue?: any;
      newValue?: any;
      reason?: string;
      description?: string;
      endpoint?: string;
      permissions?: string[];
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      const db = await getDatabase();
      const auditLogsCollection = db.collection('admin_audit_logs');
      
      // Get admin email for logging
      const adminUser = await this.getAdminUser(adminId);
      const adminEmail = adminUser?.email || 'unknown';
      
      const auditLog: AdminAuditLog = {
        adminId,
        adminEmail,
        action,
        targetId: details.targetId,
        targetType: details.targetType,
        details: {
          oldValue: details.oldValue,
          newValue: details.newValue,
          reason: details.reason,
          description: details.description
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        timestamp: new Date().toISOString(),
        success: true
      };

      await auditLogsCollection.insertOne(auditLog as any);
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw error for audit logging failures
    }
  }

  /**
   * Get admin audit logs
   */
  async getAuditLogs(
    filters: {
      adminId?: string;
      action?: AdminAction;
      targetType?: AdminTargetType;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AdminAuditLog[]> {
    try {
      const db = await getDatabase();
      const auditLogsCollection = db.collection('admin_audit_logs');
      
      const query: any = {};
      
      if (filters.adminId) {
        query.adminId = filters.adminId;
      }
      
      if (filters.action) {
        query.action = filters.action;
      }
      
      if (filters.targetType) {
        query.targetType = filters.targetType;
      }
      
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.timestamp.$lte = filters.endDate;
        }
      }
      
      const auditLogs = await auditLogsCollection
        .find(query)
        .sort({ timestamp: -1 })
        .skip(filters.offset || 0)
        .limit(filters.limit || 50)
        .toArray();
      
      return auditLogs as unknown as AdminAuditLog[];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  /**
   * Initialize default admin users
   */
  async initializeDefaultAdmins(): Promise<void> {
    try {
      const db = await getDatabase();
      const adminUsersCollection = db.collection('admin_users');
      
      // Check if any admin users exist
      const existingAdmins = await adminUsersCollection.countDocuments();
      
      if (existingAdmins === 0) {
        console.log('No admin users found. Initializing default admins...');
        
        // Create default super admin
        const defaultAdmin: AdminUser = {
          userId: 'system', // This will be updated when the first admin logs in
          email: DEFAULT_ADMIN_CONFIG.superAdminEmails[0],
          role: 'super_admin',
          permissions: ROLE_PERMISSIONS.super_admin,
          isActive: true,
          grantedBy: 'system',
          grantedAt: new Date().toISOString(),
          metadata: {
            reason: 'Default system administrator',
            department: 'IT Security'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await adminUsersCollection.insertOne(defaultAdmin as any);
        console.log('Default admin user created');
      }
    } catch (error) {
      console.error('Error initializing default admins:', error);
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(request?: Request): string | undefined {
    if (!request) return undefined;
    
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return undefined;
  }
}

// Export singleton instance
export const adminAuthService = AdminAuthService.getInstance();
