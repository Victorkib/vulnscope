'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { VulnerabilityManagementTab } from '@/components/admin/vulnerability-management-tab';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';

export default function AdminVulnerabilitiesPage() {
  const { isAdmin, loading: adminLoading, hasPermission } = useAdminAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state while checking admin status
  if (!mounted || adminLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg">Loading vulnerability management...</span>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Check if user is admin
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Alert className="max-w-2xl mx-auto">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to access vulnerability management. 
                Please contact your administrator if you believe this is an error.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Check if user has vulnerability management permission
  if (!hasPermission('vulnerability_management')) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Alert className="max-w-2xl mx-auto">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to access vulnerability management features. 
                Your role may not include vulnerability management permissions.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Render the vulnerability management interface
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Vulnerability Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage vulnerabilities, view analytics, and perform bulk operations.
            </p>
          </div>
          
          <VulnerabilityManagementTab />
        </div>
      </div>
    </AppLayout>
  );
}
