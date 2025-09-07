'use client';

import type React from 'react';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        if (!supabase) {
          console.warn('Supabase client not initialized. Skipping auth session check.');
          setUser(null);
          setLoading(false);
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_OUT' || !session) {
          router.push('/');
        } else if (event === 'SIGNED_IN' && pathname === '/') {
          router.push('/dashboard');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // If supabase is not available, just set loading to false
      setLoading(false);
    }
  }, [router, pathname]);

  const signOut = async () => {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized. Cannot sign out.');
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
