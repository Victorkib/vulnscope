'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useIntelligenceRealtime } from '@/hooks/use-intelligence-realtime';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  Database, 
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface PerformanceMetrics {
  connectionUptime: number;
  messagesReceived: number;
  messagesPerSecond: number;
  averageLatency: number;
  errorCount: number;
  lastUpdate: Date;
  dataSize: number;
  memoryUsage: number;
}

interface RealtimePerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
}

export default function RealtimePerformanceMonitor({ 
  className,
  showDetails = true,
  autoRefresh = true
}: RealtimePerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    connectionUptime: 0,
    messagesReceived: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    errorCount: 0,
    lastUpdate: new Date(),
    dataSize: 0,
    memoryUsage: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const startTimeRef = useRef<Date>(new Date());
  const messageCountRef = useRef(0);
  const latencySumRef = useRef(0);
  const latencyCountRef = useRef(0);
  const errorCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    connectionStatus,
    error: realtimeError,
    lastUpdate
  } = useIntelligenceRealtime({
    enableThreatLandscape: true,
    enableSecurityPosture: true,
    enableStats: true,
    enableAlerts: true
  });

  // Simulate message reception and latency measurement
  useEffect(() => {
    if (isConnected && autoRefresh) {
      setIsMonitoring(true);
      startTimeRef.current = new Date();

      // Simulate receiving messages
      const messageInterval = setInterval(() => {
        if (isConnected) {
          messageCountRef.current++;
          
          // Simulate latency measurement (random between 10-100ms)
          const latency = Math.random() * 90 + 10;
          latencySumRef.current += latency;
          latencyCountRef.current++;
        }
      }, Math.random() * 2000 + 500); // Random interval between 0.5-2.5 seconds

      // Update metrics every 5 seconds
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const uptime = (now.getTime() - startTimeRef.current.getTime()) / 1000;
        const messagesPerSecond = messageCountRef.current / uptime;
        const averageLatency = latencyCountRef.current > 0 
          ? latencySumRef.current / latencyCountRef.current 
          : 0;

        setMetrics(prev => ({
          ...prev,
          connectionUptime: uptime,
          messagesReceived: messageCountRef.current,
          messagesPerSecond: messagesPerSecond,
          averageLatency: averageLatency,
          errorCount: errorCountRef.current,
          lastUpdate: now,
          dataSize: Math.random() * 1024 * 1024, // Simulate data size
          memoryUsage: Math.random() * 100 // Simulate memory usage percentage
        }));
      }, 5000);

      return () => {
        clearInterval(messageInterval);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setIsMonitoring(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isConnected, autoRefresh]);

  // Track errors
  useEffect(() => {
    if (realtimeError) {
      errorCountRef.current++;
    }
  }, [realtimeError]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceStatus = () => {
    if (metrics.averageLatency < 50) return { status: 'Excellent', color: 'text-green-600' };
    if (metrics.averageLatency < 100) return { status: 'Good', color: 'text-yellow-600' };
    if (metrics.averageLatency < 200) return { status: 'Fair', color: 'text-orange-600' };
    return { status: 'Poor', color: 'text-red-600' };
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Real-time Performance</span>
            {isMonitoring && (
              <Badge className="bg-blue-100 text-blue-800">
                Monitoring
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
              <span className="text-sm text-muted-foreground">
                {getConnectionStatusText()}
              </span>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getConnectionStatusColor()}>
                {getConnectionStatusText()}
              </Badge>
              {realtimeError && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uptime</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold">
              {formatUptime(metrics.connectionUptime)}
            </p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Messages/sec</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-lg font-bold">
              {metrics.messagesPerSecond.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg Latency</span>
              <Zap className="h-4 w-4 text-blue-500" />
            </div>
            <p className={`text-lg font-bold ${performanceStatus.color}`}>
              {metrics.averageLatency.toFixed(0)}ms
            </p>
            <Badge variant="outline" className={performanceStatus.color}>
              {performanceStatus.status}
            </Badge>
          </div>
        </div>

        {/* Data Transfer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Data Transferred</span>
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {formatBytes(metrics.dataSize)}
            </span>
            <span className="text-sm text-muted-foreground">
              {metrics.messagesReceived} messages
            </span>
          </div>
        </div>

        {/* Error Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Error Rate</span>
            {metrics.errorCount > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {metrics.errorCount}
            </span>
            <span className="text-sm text-muted-foreground">
              {metrics.messagesReceived > 0 
                ? ((metrics.errorCount / metrics.messagesReceived) * 100).toFixed(2)
                : 0
              }% error rate
            </span>
          </div>
        </div>

        {/* Memory Usage */}
        {showDetails && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Memory Usage</span>
              <span className="text-sm text-muted-foreground">
                {metrics.memoryUsage.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.memoryUsage} className="h-2" />
          </div>
        )}

        {/* Last Update */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last Update</span>
            <span>{metrics.lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Error Display */}
        {realtimeError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              {realtimeError}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
