// Admin system types for VulnScope
export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'analyst';

export type AdminPermission = 
  | 'user_management'
  | 'user_suspend'
  | 'user_delete'
  | 'user_roles'
  | 'system_config'
  | 'database_maintenance'
  | 'security_audit'
  | 'content_moderation'
  | 'analytics_access'
  | 'system_alerts'
  | 'backup_management'
  | 'performance_monitoring'
  // Vulnerability Management Permissions
  | 'vulnerability_management'
  | 'vulnerability_import'
  | 'vulnerability_export'
  | 'vulnerability_moderation'
  | 'vulnerability_validation'
  | 'vulnerability_analytics';

export interface AdminUser {
  _id?: string;
  userId: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string | null;
  metadata?: {
    reason?: string;
    department?: string;
    notes?: string;
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  _id?: string;
  adminId: string;
  adminEmail: string;
  action: AdminAction;
  targetId?: string;
  targetType?: AdminTargetType;
  details: {
    oldValue?: any;
    newValue?: any;
    reason?: string;
    description?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export type AdminAction = 
  | 'admin_access'
  | 'admin_access_denied'
  | 'user_suspend'
  | 'user_activate'
  | 'user_delete'
  | 'user_update'
  | 'role_assignment'
  | 'permission_granted'
  | 'permission_revoked'
  | 'config_change'
  | 'system_alert'
  | 'data_export'
  | 'backup_created'
  | 'maintenance_run'
  | 'security_scan'
  | 'content_moderation'
  | 'performance_monitoring'
  // Vulnerability Management Actions
  | 'vulnerability_create'
  | 'vulnerability_update'
  | 'vulnerability_delete'
  | 'vulnerability_import'
  | 'vulnerability_export'
  | 'vulnerability_moderate'
  | 'vulnerability_validate';

export type AdminTargetType = 
  | 'user'
  | 'config'
  | 'vulnerability'
  | 'system'
  | 'notification'
  | 'comment'
  | 'team'
  | 'alert_rule';

export interface SystemConfig {
  _id?: string;
  key: string;
  value: any;
  category: 'security' | 'notifications' | 'features' | 'performance' | 'maintenance';
  description: string;
  isEditable: boolean;
  requiresRestart: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  totalVulnerabilities: number;
  newVulnerabilitiesToday: number;
  systemHealth: {
    databaseStatus: 'healthy' | 'warning' | 'error';
    apiResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  securityAlerts: {
    failedLogins: number;
    suspiciousActivity: number;
    policyViolations: number;
  };
  recentAdminActions: AdminAuditLog[];
  pendingSystemAlerts: number;
}

export interface UserManagementFilters {
  search?: string;
  role?: AdminRole;
  status?: 'active' | 'suspended' | 'pending';
  registrationDateFrom?: string;
  registrationDateTo?: string;
  lastActiveFrom?: string;
  lastActiveTo?: string;
  sortBy?: 'email' | 'createdAt' | 'lastLoginAt' | 'activity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdminUserFormData {
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  expiresAt?: string;
  metadata?: {
    reason?: string;
    department?: string;
    notes?: string;
  };
}

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'user_management',
    'user_suspend',
    'user_delete',
    'user_roles',
    'system_config',
    'database_maintenance',
    'security_audit',
    'content_moderation',
    'analytics_access',
    'system_alerts',
    'backup_management',
    'performance_monitoring',
    // Vulnerability Management Permissions
    'vulnerability_management',
    'vulnerability_import',
    'vulnerability_export',
    'vulnerability_moderation',
    'vulnerability_validation',
    'vulnerability_analytics'
  ],
  admin: [
    'user_management',
    'user_suspend',
    'user_roles',
    'system_config',
    'security_audit',
    'content_moderation',
    'analytics_access',
    'system_alerts',
    'performance_monitoring',
    // Vulnerability Management Permissions
    'vulnerability_management',
    'vulnerability_import',
    'vulnerability_export',
    'vulnerability_moderation',
    'vulnerability_analytics'
  ],
  moderator: [
    'user_management',
    'content_moderation',
    'analytics_access',
    // Vulnerability Management Permissions
    'vulnerability_moderation',
    'vulnerability_analytics'
  ],
  analyst: [
    'analytics_access',
    // Vulnerability Management Permissions
    'vulnerability_analytics'
  ]
};

// Default admin configuration
export const DEFAULT_ADMIN_CONFIG = {
  superAdminEmails: [
    'qinalexander56@gmail.com',
    'support@vulnscope.com'
  ],
  sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
  maxLoginAttempts: 5,
  auditLogRetentionDays: 90,
  backupRetentionDays: 30
};
