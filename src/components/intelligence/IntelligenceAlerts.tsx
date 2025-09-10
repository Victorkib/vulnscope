'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIntelligenceRealtime } from '@/hooks/use-intelligence-realtime';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  Eye, 
  Filter,
  MoreHorizontal,
  RefreshCw,
  Settings,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IntelligenceAlertsProps {
  className?: string;
  maxAlerts?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
}

export default function IntelligenceAlerts({ 
  className,
  maxAlerts = 10,
  showFilters = true,
  autoRefresh = true
}: IntelligenceAlertsProps) {
  const { toast } = useToast();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  const {
    alerts: realtimeAlerts,
    isConnected,
    connectionStatus,
    error: realtimeError,
    refreshData
  } = useIntelligenceRealtime({
    enableAlerts: true,
    autoReconnect: autoRefresh
  });

  // Filter alerts based on current filters
  const filteredAlerts = realtimeAlerts
    .filter(alert => {
      if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
      if (filterType !== 'all' && alert.type !== filterType) return false;
      if (acknowledgedAlerts.has(alert.id)) return false;
      return true;
    })
    .slice(0, maxAlerts);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'MEDIUM': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'LOW': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
    toast({
      title: 'Alert Acknowledged',
      description: 'Alert has been marked as acknowledged',
      variant: 'default'
    });
  };

  const handleViewAlert = (alert: any) => {
    // In a real implementation, this would open a detailed view
    toast({
      title: 'Viewing Alert',
      description: `Opening details for ${alert.title}`,
      variant: 'default'
    });
  };

  const handleRefresh = () => {
    refreshData();
    toast({
      title: 'Refreshing Alerts',
      description: 'Fetching latest intelligence alerts',
      variant: 'default'
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getUniqueTypes = () => {
    const types = new Set(realtimeAlerts.map(alert => alert.type));
    return Array.from(types);
  };

  const getUniqueSeverities = () => {
    const severities = new Set(realtimeAlerts.map(alert => alert.severity));
    return Array.from(severities);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Intelligence Alerts</span>
            {isConnected && (
              <Badge className="bg-green-100 text-green-800">
                Live
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={connectionStatus === 'connecting'}
            >
              <RefreshCw className={`h-4 w-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="flex items-center space-x-2 mt-4">
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                {getUniqueSeverities().map(severity => (
                  <SelectItem key={severity} value={severity}>
                    {severity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {getUniqueTypes().map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {realtimeError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              Connection error: {realtimeError}
            </p>
          </div>
        )}

        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {realtimeAlerts.length === 0 
                ? 'No intelligence alerts at this time'
                : 'No alerts match the current filters'
              }
            </p>
            {realtimeAlerts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setFilterSeverity('all');
                  setFilterType('all');
                  setAcknowledgedAlerts(new Set());
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {alert.title}
                          </h4>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        
                        {alert.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {alert.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(alert.createdAt)}</span>
                          </div>
                          {alert.source && (
                            <span>Source: {alert.source}</span>
                          )}
                          {alert.confidence && (
                            <span>Confidence: {alert.confidence}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewAlert(alert)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAcknowledgeAlert(alert.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Acknowledge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {filteredAlerts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredAlerts.length} of {realtimeAlerts.length} alerts
              </span>
              {acknowledgedAlerts.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAcknowledgedAlerts(new Set())}
                >
                  Show Acknowledged ({acknowledgedAlerts.size})
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

