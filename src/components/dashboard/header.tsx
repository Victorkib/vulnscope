'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  Home,
  Database,
  BarChart3,
  BookOpen,
  HelpCircle,
  Moon,
} from 'lucide-react';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: 'Signed out successfully',
        description: 'You have been logged out of your account.',
      });

      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  const getUserRole = () => {
    // In a real app, this would come from user metadata
    return 'Security Analyst';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">VulnScope</h1>
                <p className="text-xs text-blue-200">Security Intelligence</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/user')}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <User className="h-4 w-4 mr-2" />
                My Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Database className="h-4 w-4 mr-2" />
                Database
              </Button>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <Moon className="h-4 w-4" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10 border-2 border-white/20">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                      {user?.email ? getInitials(user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                          {user?.email ? getInitials(user.email) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.email?.split('@')[0] || 'User'}
                        </p>
                        <Badge variant="secondary" className="text-xs w-fit">
                          {getUserRole()}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/user')}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>My Dashboard</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                  <Badge className="ml-auto bg-red-500 text-white">3</Badge>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Documentation</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white/80 hover:text-white hover:bg-white/10"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
