'use client';

import type React from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import {
  UserCog,
  Shield,
  Database,
  BarChart3,
  Settings,
  FileText,
  Users,
  Lock,
  Activity,
  AlertTriangle,
  Bug,
} from 'lucide-react';

interface NavigationItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  children?: NavigationItem[];
  permission?: string;
}

export function getAdminNavigation(): NavigationItem[] {
  return [
    {
      title: 'Admin Dashboard',
      icon: UserCog,
      href: '/admin/dashboard',
      badge: 'admin',
    },
    {
      title: 'User Management',
      icon: Users,
      href: '/admin/users',
      permission: 'user_management',
      children: [
        {
          title: 'All Users',
          icon: Users,
          href: '/admin/users',
        },
        {
          title: 'Admin Users',
          icon: UserCog,
          href: '/admin/users/admins',
        },
        {
          title: 'User Roles',
          icon: Lock,
          href: '/admin/users/roles',
        },
      ],
    },
    {
      title: 'Vulnerability Management',
      icon: Bug,
      href: '/admin/vulnerabilities',
      permission: 'vulnerability_management',
      children: [
        {
          title: 'All Vulnerabilities',
          icon: Bug,
          href: '/admin/vulnerabilities',
        },
        {
          title: 'Analytics',
          icon: BarChart3,
          href: '/admin/vulnerabilities',
        },
        {
          title: 'Import/Export',
          icon: Database,
          href: '/admin/vulnerabilities',
        },
      ],
    },
    // TODO: Implement these pages in future phases
    // {
    //   title: 'Security & Audit',
    //   icon: Shield,
    //   href: '/admin/security',
    //   permission: 'security_audit',
    //   children: [
    //     {
    //       title: 'Audit Logs',
    //       icon: FileText,
    //       href: '/admin/security/audit',
    //     },
    //     {
    //       title: 'Active Sessions',
    //       icon: Activity,
    //       href: '/admin/security/sessions',
    //     },
    //     {
    //       title: 'Security Alerts',
    //       icon: AlertTriangle,
    //       href: '/admin/security/alerts',
    //     },
    //   ],
    // },
    // {
    //   title: 'System Management',
    //   icon: Settings,
    //   href: '/admin/system',
    //   permission: 'system_config',
    //   children: [
    //     {
    //       title: 'Configuration',
    //       icon: Settings,
    //       href: '/admin/system/config',
    //     },
    //     {
    //       title: 'Maintenance',
    //       icon: Database,
    //       href: '/admin/system/maintenance',
    //     },
    //     {
    //       title: 'Performance',
    //       icon: BarChart3,
    //       href: '/admin/system/performance',
    //     },
    //   ],
    // },
  ];
}

export function useAdminNavigation() {
  const { hasPermission, isAdmin } = useAdminAuth();
  
  const allNavigation = getAdminNavigation();
  
  // Filter navigation based on permissions
  const filteredNavigation = allNavigation.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  }).map(item => ({
    ...item,
    children: item.children?.filter(child => {
      if (!child.permission) return true;
      return hasPermission(child.permission);
    })
  }));
  
  
  return filteredNavigation;
}
