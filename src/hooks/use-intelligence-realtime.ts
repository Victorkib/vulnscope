import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import type { 
  ThreatLandscapeData, 
  SecurityPosture,
  IntelligenceStats,
  IntelligenceAlert 
} from '@/types/intelligence';

interface RealtimeIntelligenceData {
  threatLandscape: ThreatLandscapeData | null;
  securityPosture: SecurityPosture | null;
  stats: IntelligenceStats | null;
  alerts: IntelligenceAlert[];
  lastUpdate: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

interface UseIntelligenceRealtimeOptions {
  enableThreatLandscape?: boolean;
  enableSecurityPosture?: boolean;
  enableStats?: boolean;
  enableAlerts?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useIntelligenceRealtime(options: UseIntelligenceRealtimeOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    enableThreatLandscape = true,
    enableSecurityPosture = true,
    enableStats = true,
    enableAlerts = true,
    autoReconnect = true,
    reconnectInterval = 5000
  } = options;

  const [data, setData] = useState<RealtimeIntelligenceData>({
    threatLandscape: null,
    securityPosture: null,
    stats: null,
    alerts: [],
    lastUpdate: new Date().toISOString(),
    connectionStatus: 'disconnected'
  });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelsRef = useRef<Map<string, any>>(new Map());

  // Initialize Supabase client
  const initializeSupabase = useCallback(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured for real-time intelligence');
      return null;
    }

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    );
  }, []);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((channel: string, payload: any) => {
    console.log(`Real-time update received on ${channel}:`, payload);
    
    setData(prevData => {
      const newData = { ...prevData };
      newData.lastUpdate = new Date().toISOString();

      switch (channel) {
        case 'threat-landscape':
          if (enableThreatLandscape && payload.data) {
            newData.threatLandscape = payload.data;
          }
          break;
        
        case 'security-posture':
          if (enableSecurityPosture && payload.data) {
            newData.securityPosture = payload.data;
          }
          break;
        
        case 'intelligence-stats':
          if (enableStats && payload.data) {
            newData.stats = payload.data;
          }
          break;
        
        case 'intelligence-alerts':
          if (enableAlerts && payload.data) {
            newData.alerts = payload.data;
            
            // Show toast notification for new alerts
            if (payload.data.length > 0) {
              const latestAlert = payload.data[0];
              toast({
                title: 'New Intelligence Alert',
                description: latestAlert.title,
                variant: latestAlert.severity === 'CRITICAL' ? 'destructive' : 'default'
              });
            }
          }
          break;
      }

      return newData;
    });
  }, [enableThreatLandscape, enableSecurityPosture, enableStats, enableAlerts, toast]);

  // Subscribe to real-time channels
  const subscribeToChannels = useCallback((supabase: any) => {
    if (!user?.id) return;

    const channels = [
      { name: 'threat-landscape', table: 'intelligence_threat_landscape' },
      { name: 'security-posture', table: 'intelligence_security_posture' },
      { name: 'intelligence-stats', table: 'intelligence_stats' },
      { name: 'intelligence-alerts', table: 'intelligence_alerts' }
    ];

    channels.forEach(({ name, table }) => {
      // Skip if channel is disabled
      if (
        (name === 'threat-landscape' && !enableThreatLandscape) ||
        (name === 'security-posture' && !enableSecurityPosture) ||
        (name === 'intelligence-stats' && !enableStats) ||
        (name === 'intelligence-alerts' && !enableAlerts)
      ) {
        return;
      }

      // Subscribe to global intelligence data (demo data accessible to all users)
      const channel = supabase
        .channel(`intelligence-${name}-global`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `user_id=eq.00000000-0000-0000-0000-000000000001`
          },
          (payload: any) => {
            handleRealtimeUpdate(name, payload);
          }
        )
        .subscribe((status: string) => {
          console.log(`Intelligence ${name} channel status:`, status);
          
          if (status === 'SUBSCRIBED') {
            setData(prevData => ({
              ...prevData,
              connectionStatus: 'connected'
            }));
            setIsConnected(true);
            setError(null);
          } else if (status === 'CHANNEL_ERROR') {
            setData(prevData => ({
              ...prevData,
              connectionStatus: 'error'
            }));
            setIsConnected(false);
            setError(`Failed to subscribe to ${name} channel`);
          }
        });

      channelsRef.current.set(name, channel);
    });
  }, [user?.id, enableThreatLandscape, enableSecurityPosture, enableStats, enableAlerts, handleRealtimeUpdate]);

  // Unsubscribe from channels
  const unsubscribeFromChannels = useCallback(() => {
    channelsRef.current.forEach((channel, name) => {
      console.log(`Unsubscribing from intelligence ${name} channel`);
      channel.unsubscribe();
    });
    channelsRef.current.clear();
    setIsConnected(false);
  }, []);

  // Connect to real-time
  const connect = useCallback(() => {
    if (!user?.id) return;

    setData(prevData => ({
      ...prevData,
      connectionStatus: 'connecting'
    }));

    const supabase = initializeSupabase();
    if (!supabase) {
      setError('Supabase not configured for real-time intelligence');
      setData(prevData => ({
        ...prevData,
        connectionStatus: 'error'
      }));
      return;
    }

    supabaseRef.current = supabase;
    subscribeToChannels(supabase);
  }, [user?.id, initializeSupabase, subscribeToChannels]);

  // Disconnect from real-time
  const disconnect = useCallback(() => {
    unsubscribeFromChannels();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setData(prevData => ({
      ...prevData,
      connectionStatus: 'disconnected'
    }));
  }, [unsubscribeFromChannels]);

  // Auto-reconnect logic
  const scheduleReconnect = useCallback(() => {
    if (!autoReconnect || !user?.id) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect to intelligence real-time...');
      connect();
    }, reconnectInterval);
  }, [autoReconnect, user?.id, connect, reconnectInterval]);

  // Handle connection errors
  const handleConnectionError = useCallback((error: string) => {
    setError(error);
    setData(prevData => ({
      ...prevData,
      connectionStatus: 'error'
    }));
    setIsConnected(false);
    
    toast({
      title: 'Intelligence Connection Error',
      description: error,
      variant: 'destructive'
    });

    scheduleReconnect();
  }, [toast, scheduleReconnect]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    if (supabaseRef.current && user?.id) {
      // Trigger a manual refresh by sending a ping
      supabaseRef.current
        .channel('intelligence-refresh')
        .send({
          type: 'broadcast',
          event: 'refresh',
          payload: { userId: user.id, timestamp: new Date().toISOString() }
        });
    }
  }, [user?.id]);

  // Initialize connection on mount
  useEffect(() => {
    if (user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, connect, disconnect]);

  // Handle connection status changes
  useEffect(() => {
    if (data.connectionStatus === 'error' && autoReconnect) {
      scheduleReconnect();
    }
  }, [data.connectionStatus, autoReconnect, scheduleReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // Data
    threatLandscape: data.threatLandscape,
    securityPosture: data.securityPosture,
    stats: data.stats,
    alerts: data.alerts,
    lastUpdate: data.lastUpdate,
    
    // Connection status
    isConnected,
    connectionStatus: data.connectionStatus,
    error,
    
    // Actions
    connect,
    disconnect,
    refreshData,
    
    // Utilities
    hasData: !!(data.threatLandscape || data.securityPosture || data.stats),
    isError: !!error,
    isConnecting: data.connectionStatus === 'connecting'
  };
}

export default useIntelligenceRealtime;

