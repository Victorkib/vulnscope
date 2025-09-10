'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/auth-form';
import EnhancedAuthLoader from '@/components/auth/enhanced-auth-loader';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Add a small delay to show the loader
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <EnhancedAuthLoader 
        message="Initializing security session..."
        stage="authenticating"
        duration={3000}
        showFeatures={true}
      />
    );
  }

  if (user) {
    return (
      <EnhancedAuthLoader 
        message="Redirecting to dashboard..."
        stage="redirecting"
        duration={2000}
        showFeatures={true}
      />
    );
  }

  return <AuthForm />;
}