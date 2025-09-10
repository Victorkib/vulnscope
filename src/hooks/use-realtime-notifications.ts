'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { usePreferences } from '@/contexts/preferences-context';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeNotification, Notification } from '@/types/notification';

interface UseRealtimeNotificationsOptions {
  enabled?: boolean;
  onNotification?: (notification: RealtimeNotification) => void;
  fallbackToPolling?: boolean; // Free tier optimization
  pollingInterval?: number; // Polling interval in ms
}

// Free tier connection manager
class RealtimeConnectionManager {
  private static instance: RealtimeConnectionManager;
  private connections = new Map<string, any>();
  private maxConnections = 2; // Free tier limit
  private connectionCount = 0;

  public static getInstance(): RealtimeConnectionManager {
    if (!RealtimeConnectionManager.instance) {
      RealtimeConnectionManager.instance = new RealtimeConnectionManager();
    }
    return RealtimeConnectionManager.instance;
  }

  public canConnect(): boolean {
    return this.connectionCount < this.maxConnections;
  }

  public addConnection(userId: string, subscription: any): boolean {
    if (!this.canConnect()) {
      return false;
    }
    
    this.connections.set(userId, subscription);
    this.connectionCount++;
    return true;
  }

  public removeConnection(userId: string): void {
    if (this.connections.has(userId)) {
      this.connections.delete(userId);
      this.connectionCount--;
    }
  }

  public getConnectionCount(): number {
    return this.connectionCount;
  }
}

export function useRealtimeNotifications({
  enabled = true,
  onNotification,
  fallbackToPolling = true, // Enable polling fallback for free tier
  pollingInterval = 30000, // 30 seconds
}: UseRealtimeNotificationsOptions = {}) {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const connectionManager = useRef(RealtimeConnectionManager.getInstance());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial notifications with bandwidth optimization
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping notification fetch');
      return;
    }

    try {
      console.log('Fetching notifications for user:', user.id);
      
      // Try the main API first for real notifications
      const response = await fetch('/api/users/notifications?minimal=true&limit=20', {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Notification fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched real notifications:', data.length, 'notifications');
        setNotifications(data);
        return;
      }
      
      // Fallback to test API only if main API fails
      console.error('Main API failed, using test notifications:', response.status, response.statusText);
      const testResponse = await fetch('/api/test/notifications', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('Fetched test notifications as fallback:', testData.length, 'notifications');
        setNotifications(testData);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  // Polling fallback for when real-time connections are maxed out
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Use user preference for polling interval, fallback to default
    const effectiveInterval = preferences?.refreshInterval || pollingInterval;
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, effectiveInterval);

    setUsePolling(true);
    setIsConnected(true);
    setConnectionError(null);
  }, [fetchNotifications, pollingInterval, preferences?.refreshInterval]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setUsePolling(false);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/users/notifications/${notificationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
      } else {
        // Fallback: just update local state for test notifications
        console.log('API failed, updating local state for notification:', notificationId);
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback: just update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/users/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
      } else {
        // Fallback: just update local state
        console.log('API failed, updating local state for all notifications');
        setNotifications(prev =>
          prev.map(notif => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Fallback: just update local state
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/users/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      } else {
        // Fallback: just update local state
        console.log('API failed, updating local state for notification deletion:', notificationId);
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Fallback: just update local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    }
  }, []);

  // Handle incoming real-time notifications
  const handleRealtimeNotification = useCallback((notification: RealtimeNotification) => {
    // Add to local state
    const newNotification: Notification = {
      ...notification,
      userId: user?.id || '',
      isRead: false,
      createdAt: notification.timestamp,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast notification
    const toastVariant = notification.priority === 'critical' ? 'destructive' : 'default';
    toast({
      title: notification.title,
      description: notification.message,
      variant: toastVariant,
    });

    // Call custom handler if provided
    onNotification?.(notification);
  }, [user, toast, onNotification]);

  // Setup Supabase realtime subscription with free tier optimizations
  useEffect(() => {
    if (!enabled || !user || !supabase) return;

    let subscription: { unsubscribe: () => void } | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        // Check if we can establish a real-time connection
        if (!connectionManager.current.canConnect()) {
          console.warn('Max real-time connections reached, falling back to polling');
          if (fallbackToPolling) {
            startPolling();
            return;
          } else {
            setConnectionError('Max real-time connections reached');
            setIsConnected(false);
            return;
          }
        }

        // Subscribe to notifications for this user
        subscription = supabase
          .channel(`notifications:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const notification = payload.new as RealtimeNotification;
              handleRealtimeNotification(notification);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // Register connection with manager
              if (connectionManager.current.addConnection(user.id, subscription)) {
                setIsConnected(true);
                setConnectionError(null);
                setUsePolling(false);
                stopPolling();
              } else {
                // Connection failed, fallback to polling
                if (fallbackToPolling) {
                  startPolling();
                } else {
                  setConnectionError('Failed to register real-time connection');
                  setIsConnected(false);
                }
              }
            } else if (status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              setConnectionError('Failed to connect to real-time notifications');
              // Fallback to polling on error
              if (fallbackToPolling) {
                startPolling();
              }
            }
          });
      } catch (error) {
        console.error('Error setting up realtime subscription:', error);
        setConnectionError('Failed to setup real-time notifications');
        setIsConnected(false);
        // Fallback to polling on error
        if (fallbackToPolling) {
          startPolling();
        }
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        connectionManager.current.removeConnection(user.id);
      }
      stopPolling();
    };
  }, [enabled, user, handleRealtimeNotification, fallbackToPolling, startPolling, stopPolling]);

  // Page Visibility API - pause polling when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      if (isVisible && usePolling) {
        // Resume polling when tab becomes visible
        startPolling();
      } else if (!isVisible && usePolling) {
        // Pause polling when tab is hidden
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [usePolling, startPolling, stopPolling]);

  // Fetch initial notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, fetchNotifications]);

  return {
    notifications,
    isConnected,
    connectionError,
    unreadCount: notifications.filter(n => !n.isRead).length,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
    // Free tier specific properties
    usePolling,
    connectionCount: connectionManager.current.getConnectionCount(),
    maxConnections: 2, // Free tier limit
    // Page visibility properties
    isPageVisible,
    isPaused: !isPageVisible && usePolling,
  };
}
