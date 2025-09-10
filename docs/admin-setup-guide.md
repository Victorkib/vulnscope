# 🛡️ VulnScope Admin System Setup Guide

This guide will walk you through setting up the enhanced admin system for VulnScope with role-based access control, audit logging, and comprehensive admin features.

## 📋 Prerequisites

Before setting up the admin system, ensure you have:

1. **VulnScope Application Running**: The main application should be running with MongoDB and Supabase configured
2. **Environment Variables**: All required environment variables should be set
3. **Database Access**: MongoDB connection should be working
4. **Supabase Auth**: User authentication should be functional

## 🚀 Step 1: Initialize Admin System

### 1.1 Database Setup

The admin system will automatically create the required MongoDB collections:

- `admin_users` - Stores admin user information and roles
- `admin_audit_logs` - Stores audit trail of all admin actions
- `system_config` - Stores system configuration settings

### 1.2 Initialize Admin Collections

Run the admin initialization script:

```bash
# Navigate to your project directory
cd vulnscope

# Run the admin initialization
npm run admin:init
```

Or manually initialize via API:

```bash
curl -X POST http://localhost:3000/api/admin/initialize
```

### 1.3 Verify Initialization

Check if the admin system is properly initialized:

```bash
curl -X GET http://localhost:3000/api/admin/initialize
```

Expected response:
```json
{
  "success": true,
  "status": {
    "initialized": true,
    "adminCount": 1,
    "message": "Admin system is properly initialized"
  }
}
```

## 👤 Step 2: Create Default Admin User

### 2.1 Default Admin Configuration

The system comes with default admin emails configured in `src/types/admin.ts`:

```typescript
export const DEFAULT_ADMIN_CONFIG = {
  superAdminEmails: [
    'admin@vulnscope.com',
    'support@vulnscope.com'
  ],
  // ... other config
};
```

### 2.2 Create Your First Admin User

You need to create an admin user for your email address. You can do this in several ways:

#### Option A: Via API (Recommended)

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -d '{
    "userId": "your-supabase-user-id",
    "email": "your-email@example.com",
    "role": "super_admin",
    "metadata": {
      "reason": "Initial system administrator",
      "department": "IT Security"
    }
  }'
```

#### Option B: Via Database Script

Create a script to add your admin user:

```typescript
// scripts/create-admin-user.ts
import { createDefaultAdmin } from '@/scripts/initialize-admin';

async function createMyAdmin() {
  await createDefaultAdmin(
    'your-supabase-user-id', // Get this from Supabase Auth
    'your-email@example.com',
    'super_admin'
  );
}

createMyAdmin();
```

### 2.3 Get Your Supabase User ID

To get your Supabase user ID:

1. Log into your VulnScope application
2. Open browser developer tools (F12)
3. Go to Application/Storage tab
4. Look for Supabase session data
5. Copy the `user.id` value

Or use the Supabase dashboard:
1. Go to your Supabase project
2. Navigate to Authentication > Users
3. Find your user and copy the UUID

## 🔐 Step 3: Admin Roles and Permissions

### 3.1 Available Roles

The admin system includes four roles with different permission levels:

#### Super Admin (`super_admin`)
- **Full system access**
- Can manage all other admins
- All permissions included
- Cannot be deactivated by other admins

#### Admin (`admin`)
- **Most administrative functions**
- User management, system config, security audit
- Cannot manage super admins
- Cannot access database maintenance

#### Moderator (`moderator`)
- **Content and user management**
- User management, content moderation
- Limited system access

#### Analyst (`analyst`)
- **Read-only analytics access**
- View analytics and reports only
- No administrative functions

### 3.2 Permission Matrix

| Permission | Super Admin | Admin | Moderator | Analyst |
|------------|-------------|-------|-----------|---------|
| `user_management` | ✅ | ✅ | ✅ | ❌ |
| `user_suspend` | ✅ | ✅ | ❌ | ❌ |
| `user_delete` | ✅ | ❌ | ❌ | ❌ |
| `user_roles` | ✅ | ✅ | ❌ | ❌ |
| `system_config` | ✅ | ✅ | ❌ | ❌ |
| `database_maintenance` | ✅ | ❌ | ❌ | ❌ |
| `security_audit` | ✅ | ✅ | ❌ | ❌ |
| `content_moderation` | ✅ | ✅ | ✅ | ❌ |
| `analytics_access` | ✅ | ✅ | ✅ | ✅ |
| `system_alerts` | ✅ | ✅ | ❌ | ❌ |
| `backup_management` | ✅ | ❌ | ❌ | ❌ |
| `performance_monitoring` | ✅ | ✅ | ❌ | ❌ |

## 🎯 Step 4: Access Admin Dashboard

### 4.1 Login as Admin

1. **Log into VulnScope** with your admin email
2. **Check Admin Status**: The system will automatically detect your admin role
3. **Access Admin Dashboard**: Navigate to `/admin/dashboard`

### 4.2 Admin Navigation

Once logged in as an admin, you'll see:

- **Admin Dashboard**: Overview of system metrics and recent activity
- **User Management**: Manage users, roles, and permissions
- **Security & Audit**: View audit logs and security events
- **System Management**: Configure system settings and maintenance
- **Analytics**: Access admin-level analytics and reports

### 4.3 Conditional Rendering

The admin navigation only appears for users with admin privileges:

```typescript
// Admin navigation is conditionally rendered
{isAdmin && adminNavigation.map((item) => (
  // Admin navigation items
))}
```

## 🔧 Step 5: Configure Supabase (Optional)

### 5.1 Row Level Security (RLS)

For enhanced security, you can set up RLS policies in Supabase:

```sql
-- Enable RLS on admin-related tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );
```

### 5.2 Admin User Metadata

You can store additional admin metadata in Supabase:

```sql
-- Add admin role to user metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"admin_role": "super_admin"}'
WHERE email = 'your-admin@example.com';
```

## 🛠 Step 6: Customization

### 6.1 Custom Admin Emails

Update the default admin emails in `src/types/admin.ts`:

```typescript
export const DEFAULT_ADMIN_CONFIG = {
  superAdminEmails: [
    'admin@yourcompany.com',
    'support@yourcompany.com',
    'security@yourcompany.com'
  ],
  // ... rest of config
};
```

### 6.2 Custom Permissions

Add new permissions by updating the `AdminPermission` type:

```typescript
export type AdminPermission = 
  | 'user_management'
  | 'custom_permission'  // Add your custom permission
  | // ... existing permissions
```

### 6.3 Custom Roles

Create custom roles by updating the `AdminRole` type and permission mapping:

```typescript
export type AdminRole = 
  | 'super_admin' 
  | 'admin'
  | 'custom_role';  // Add your custom role

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  // ... existing roles
  custom_role: ['analytics_access', 'custom_permission']
};
```

## 🔍 Step 7: Testing Admin System

### 7.1 Test Admin Authentication

```bash
# Test admin status endpoint
curl -X GET http://localhost:3000/api/admin/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7.2 Test Admin Dashboard

1. **Login as admin user**
2. **Navigate to `/admin/dashboard`**
3. **Verify admin navigation appears**
4. **Check dashboard metrics load**

### 7.3 Test Permission System

```bash
# Test admin users endpoint (requires user_management permission)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Admin access required" Error

**Cause**: User is not recognized as admin
**Solution**: 
- Verify user exists in `admin_users` collection
- Check if `isActive` is `true`
- Ensure role is not expired

#### 2. "Permission denied" Error

**Cause**: User doesn't have required permission
**Solution**:
- Check user's role and permissions
- Verify permission is included in role
- Update user's role if needed

#### 3. Admin Navigation Not Showing

**Cause**: `useAdminAuth` hook not detecting admin status
**Solution**:
- Check browser console for errors
- Verify `/api/admin/status` endpoint works
- Ensure user is properly authenticated

#### 4. Database Connection Issues

**Cause**: MongoDB connection problems
**Solution**:
- Verify MongoDB connection string
- Check if admin collections exist
- Run initialization script again

### Debug Commands

```bash
# Check admin system status
curl -X GET http://localhost:3000/api/admin/initialize

# List all admin users
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check audit logs
curl -X GET http://localhost:3000/api/admin/audit-logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📚 Next Steps

After setting up the basic admin system:

1. **Configure System Settings**: Set up system-wide configuration
2. **Set Up Monitoring**: Configure performance monitoring
3. **Create User Policies**: Define user management policies
4. **Set Up Alerts**: Configure admin notification alerts
5. **Backup Strategy**: Implement admin data backup procedures

## 🔒 Security Best Practices

1. **Regular Audit Reviews**: Review audit logs regularly
2. **Principle of Least Privilege**: Assign minimum required permissions
3. **Role Expiration**: Set expiration dates for admin roles
4. **Multi-Factor Authentication**: Enable MFA for admin accounts
5. **Regular Access Reviews**: Periodically review admin access

## 📞 Support

If you encounter issues:

1. **Check the logs**: Look for error messages in console
2. **Verify configuration**: Ensure all environment variables are set
3. **Test endpoints**: Use the debug commands above
4. **Review documentation**: Check the API documentation

The admin system is now ready for use! 🎉
