'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Shield, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setRedirecting(true);
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleAuth = async (
    email: string,
    password: string,
    isSignUp: boolean
  ) => {
    setAuthLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({
          type: 'success',
          text: 'Check your email for the confirmation link!',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setAuthLoading(false);
    }
  };

  const AuthForm = ({ isSignUp }: { isSignUp: boolean }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAuth(email, password, isSignUp);
        }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={authLoading}>
          {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
      </form>
    );
  };

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading VulnScope...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            VulnScope
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Enterprise Security Intelligence Platform
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold">
              Welcome to VulnScope
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <AuthForm isSignUp={false} />
              </TabsContent>
              <TabsContent value="signup">
                <AuthForm isSignUp={true} />
              </TabsContent>
            </Tabs>

            {message && (
              <Alert
                className={`mt-4 ${
                  message.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}
              >
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Features preview */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-gray-600 dark:text-gray-300">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p>Advanced Security</p>
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                <div className="w-4 h-4 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
              </div>
              <p>Real-time Alerts</p>
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                <div className="w-4 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
              </div>
              <p>Smart Analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
