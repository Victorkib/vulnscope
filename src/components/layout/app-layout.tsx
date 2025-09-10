'use client';

import type React from 'react';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';
import { usePreferences } from '@/contexts/preferences-context';
import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useAdminNavigation } from './admin-navigation';
import SessionTimeoutWarning from '@/components/auth/session-timeout-warning';
import NotificationBell from '@/components/notifications/notification-bell';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  Home,
  Database,
  User,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  BookOpen,
  AlertTriangle,
  Star,
  Activity,
  Download,
  HelpCircle,
  Zap,
  Globe,
  TrendingUp,
  Users,
  UserCog,
} from 'lucide-react';

interface NavigationItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    badge: 'main',
  },
  {
    title: 'Vulnerabilities',
    icon: Database,
    href: '/vulnerabilities',
    children: [
      {
        title: 'All Vulnerabilities',
        icon: Database,
        href: '/vulnerabilities',
      },
      {
        title: 'Critical',
        icon: AlertTriangle,
        href: '/vulnerabilities?severity=CRITICAL',
      },
      { title: 'High', icon: Zap, href: '/vulnerabilities?severity=HIGH' },
    ],
  },
  {
    title: 'Threat Intelligence',
    icon: Shield,
    href: '/analytics',
    children: [
      { title: 'Threat Landscape', icon: Globe, href: '/analytics' },
      { title: 'Threat Actors', icon: Users, href: '/analytics/threat-actors' },
      { title: 'Security Posture', icon: Shield, href: '/analytics/posture' },
      { title: 'Predictive Analytics', icon: TrendingUp, href: '/analytics/predictive' },
      { title: 'Intelligence Reports', icon: Download, href: '/analytics/reports' },
    ],
  },
  {
    title: 'My Profile',
    icon: User,
    href: '/dashboard/user',
    children: [
      { title: 'Dashboard', icon: User, href: '/dashboard/user' },
      { title: 'Bookmarks', icon: Star, href: '/dashboard/user?tab=bookmarks' },
      {
        title: 'Activity',
        icon: Activity,
        href: '/dashboard/user?tab=activity',
      },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
  {
    title: 'Documentation',
    icon: BookOpen,
    href: '/documentation',
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { preferences, updatePreference, isDarkMode, loading } = usePreferences();
  const { isAdmin, loading: adminLoading, error: adminError } = useAdminAuth();
  const adminNavigation = useAdminNavigation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);



  const isCollapsed = preferences?.sidebarCollapsed || false;

  const toggleSidebar = () => {
    updatePreference('sidebarCollapsed', !isCollapsed);
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    updatePreference('theme', newTheme);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Session timeout handling
  const { extendSession, timeUntilTimeout } = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    onWarning: () => setShowTimeoutWarning(true),
    onTimeout: () => {
      setShowTimeoutWarning(false);
      handleSignOut();
    },
    enabled: !!user, // Only enable when user is logged in
  });

  const handleExtendSession = async () => {
    const success = await extendSession();
    if (success) {
      setShowTimeoutWarning(false);
    }
    return success;
  };

  const handleLogoutNow = () => {
    setShowTimeoutWarning(false);
    handleSignOut();
  };

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75" />
          </div>
        )}

        {/* Sidebar */}
        <div
          className={cn(
            'fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out',
            isCollapsed ? 'w-16' : 'w-64',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div
              className={cn(
                'flex items-center space-x-3',
                isCollapsed && 'justify-center'
              )}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    VulnScope
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Security Intelligence
                  </p>
                </div>
              )}
            </div>
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {/* Regular Navigation */}
            {navigation.map((item) => (
              <div key={item.title}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive(item.href) ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start',
                        isCollapsed ? 'px-2' : 'px-3',
                        isActive(item.href) &&
                          'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      )}
                      onClick={() => router.push(item.href)}
                    >
                      <item.icon
                        className={cn('w-5 h-5', !isCollapsed && 'mr-3')}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                {/* Sub-navigation */}
                {!isCollapsed && item.children && isActive(item.href) && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.title}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm text-gray-600 dark:text-gray-400"
                        onClick={() => router.push(child.href)}
                      >
                        <child.icon className="w-4 h-4 mr-3" />
                        {child.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Admin Navigation Separator - Only show if explicitly admin and not loading */}
            {!adminLoading && isAdmin === true && (
              <>
                <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
                <div className="px-2">
                  {!isCollapsed && (
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Administration
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Admin Navigation - Only show if explicitly admin and not loading */}
            {!adminLoading && isAdmin === true && adminNavigation.map((item) => (
              <div key={item.title}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive(item.href) ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start',
                        isCollapsed ? 'px-2' : 'px-3',
                        isActive(item.href) &&
                          'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                      )}
                      onClick={() => router.push(item.href)}
                    >
                      <item.icon
                        className={cn('w-5 h-5', !isCollapsed && 'mr-3')}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant="destructive"
                              className="ml-auto text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                {/* Admin Sub-navigation */}
                {!isCollapsed && item.children && isActive(item.href) && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.title}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm text-gray-600 dark:text-gray-400"
                        onClick={() => router.push(child.href)}
                      >
                        <child.icon className="w-4 h-4 mr-3" />
                        {child.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Collapse Toggle */}
          <div className="hidden lg:flex items-center justify-center p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="w-full"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Collapse
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          )}
        >
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 backdrop-blur supports-[backdrop-filter]:bg-white/95 dark:supports-[backdrop-filter]:bg-gray-800/95">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vulnerabilities..."
                    className="w-64 pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Theme toggle */}
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {isDarkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </Button>

                {/* Notifications */}
                <NotificationBell />

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                    >
                      <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-600">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push('/dashboard/user')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push('/dashboard/settings')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Help & Support
                    </DropdownMenuItem> */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">{children}</main>
        </div>

        {/* Session Timeout Warning */}
        {showTimeoutWarning && (
          <SessionTimeoutWarning
            timeRemaining={timeUntilTimeout}
            onExtendSession={handleExtendSession}
            onLogout={handleLogoutNow}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
