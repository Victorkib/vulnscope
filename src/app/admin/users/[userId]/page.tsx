'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { usePreferences } from '@/contexts/preferences-context';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Activity, 
  Settings,
  UserCheck,
  UserX,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface User {
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

interface UserResponse {
  success: boolean;
  data: User;
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAdmin, loading: adminLoading, hasPermission } = useAdminAuth();
  const { preferences } = usePreferences();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    isActive: true,
    reason: ''
  });

  const userId = params.userId as string;

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, adminLoading, router]);

  // Fetch user details
  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/regular-users/${userId}`);
      const data: UserResponse = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      setUser(data.data);
      setFormData({
        name: data.data.name,
        role: data.data.role,
        isActive: data.data.isActive,
        reason: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && userId) {
      fetchUser();
    }
  }, [isAdmin, userId]);

  // Handle form submission
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/regular-users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          isActive: formData.isActive,
          reason: formData.reason || `User updated by admin`
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      setEditMode(false);
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  // Handle user actions
  const handleUserAction = async (action: 'suspend' | 'activate' | 'delete') => {
    try {
      setSaving(true);
      setError(null);

      if (action === 'delete') {
        const response = await fetch(`/api/admin/regular-users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete user');
        }

        router.push('/admin/users');
        return;
      }

      const response = await fetch(`/api/admin/regular-users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: action === 'activate',
          reason: `User ${action} by admin`
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      case 'analyst': return 'outline';
      default: return 'outline';
    }
  };

  if (adminLoading || loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              {/* Header Skeleton */}
              <div className="animate-pulse">
                <div className="h-9 bg-muted rounded w-32 mb-6"></div>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-8 bg-muted rounded w-48"></div>
                      <div className="h-5 bg-muted rounded w-64"></div>
                      <div className="h-4 bg-muted rounded w-32"></div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-6 bg-muted rounded w-20"></div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </div>
              
              {/* Content Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="animate-pulse">
                    <div className="h-12 bg-muted rounded mb-4"></div>
                    <div className="space-y-4">
                      <div className="h-32 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="animate-pulse">
                    <div className="h-24 bg-muted rounded"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-32 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Check permissions after all hooks are called
  if (!hasPermission('user_management')) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                  <p className="text-muted-foreground">
                    You don't have permission to manage users.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={fetchUser} variant="outline">
                      Try Again
                    </Button>
                    <Button onClick={() => router.push('/admin/users')} variant="outline">
                      Back to Users
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
                  <p className="text-muted-foreground mb-4">
                    The user you're looking for doesn't exist or has been deleted.
                  </p>
                  <Button onClick={() => router.push('/admin/users')} variant="outline">
                    Back to Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/users')}
                className="h-9"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback className="text-xl font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h1 className={`text-3xl font-bold mb-2 ${preferences?.fontSize === 'large' ? 'text-4xl' : preferences?.fontSize === 'small' ? 'text-2xl' : 'text-3xl'}`}>
                    {user.name}
                  </h1>
                  <p className="text-muted-foreground text-lg">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span className={`text-sm ${user.emailConfirmed ? 'text-green-600' : 'text-orange-600'}`}>
                        {user.emailConfirmed ? 'Email Verified' : 'Email Unverified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-sm px-3 py-1">
                  {user.role.replace('_', ' ')}
                </Badge>
                <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-sm px-3 py-1">
                  {user.isActive ? 'Active' : 'Suspended'}
                </Badge>
                {user.isAdmin && (
                  <Badge variant="destructive" className="text-sm px-3 py-1">
                    Admin User
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="mb-8 border-destructive bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Details</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Activity</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                </TabsList>
            
                <TabsContent value="details" className="space-y-6">
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    User Information
                  </CardTitle>
                  <CardDescription>
                    Basic information and account details for this user
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.email}</span>
                        <Badge variant={user.emailConfirmed ? 'default' : 'secondary'} className="ml-auto">
                          {user.emailConfirmed ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">User Role</label>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-sm">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Last Sign In</label>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDate(user.lastSignInAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {user.isAdmin && (
                    <div className="pt-6 border-t space-y-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-lg">Admin Information</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Admin Role</label>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <Badge variant="destructive" className="text-sm">
                              {user.adminRole}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Permissions</label>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex flex-wrap gap-2">
                              {user.adminPermissions.map((permission) => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
                <TabsContent value="activity" className="space-y-6">
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Activity History</CardTitle>
                      <CardDescription>
                        Recent activity and actions for this user
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        Activity history will be implemented in a future update.
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
            
                <TabsContent value="settings" className="space-y-6">
                  <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        User Settings
                      </CardTitle>
                      <CardDescription>
                        Manage user settings and permissions
                      </CardDescription>
                    </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!editMode}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                        disabled={!editMode}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="analyst">Analyst</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={formData.isActive ? 'active' : 'suspended'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'active' }))}
                      disabled={!editMode}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {editMode && (
                    <div>
                      <label className="text-sm font-medium">Reason for Change</label>
                      <Textarea
                        value={formData.reason}
                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Enter reason for this change..."
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {editMode ? (
                      <>
                        <Button onClick={handleSave} disabled={saving}>
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditMode(false);
                            setFormData({
                              name: user.name,
                              role: user.role,
                              isActive: user.isActive,
                              reason: ''
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setEditMode(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit User
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Manage this user's account status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
              {user.isActive ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <UserX className="h-4 w-4 mr-2" />
                      Suspend User
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Suspend User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to suspend this user? They will not be able to access the system.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUserAction('suspend')}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Suspend User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleUserAction('activate')}
                  disabled={saving}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate User
                </Button>
              )}
              
              {hasPermission('user_delete') && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUserAction('delete')}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
          
              <Card className="border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Account Status
                  </CardTitle>
                  <CardDescription>
                    Current status and verification details
                  </CardDescription>
                </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium">Account Status</span>
                  </div>
                  <Badge variant={user.isActive ? 'default' : 'destructive'}>
                    {user.isActive ? 'Active' : 'Suspended'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email Verified</span>
                  </div>
                  <Badge variant={user.emailConfirmed ? 'default' : 'secondary'}>
                    {user.emailConfirmed ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Admin User</span>
                  </div>
                  <Badge variant={user.isAdmin ? 'destructive' : 'outline'}>
                    {user.isAdmin ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
