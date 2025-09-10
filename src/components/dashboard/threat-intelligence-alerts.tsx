'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIntelligenceData } from '@/hooks/use-intelligence-data';
import type { IntelligenceAlert } from '@/types/intelligence';
import {
  Bell,
  AlertTriangle,
  Shield,
  Target,
  Users,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Filter,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';

interface ThreatIntelligenceAlertsProps {
  className?: string;
  maxAlerts?: number;
  showAcknowledged?: boolean;
}

export default function ThreatIntelligenceAlerts({ 
  className = '', 
  maxAlerts = 5,
  showAcknowledged = false
}: ThreatIntelligenceAlertsProps) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical' | 'high'>('unacknowledged');

  const {
    fetchIntelligenceStats
  } = useIntelligenceData();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll create mock alerts based on the intelligence data
      // In a real implementation, this would fetch from the intelligence alerts API
      const mockAlerts: IntelligenceAlert[] = [
        {
          id: '1',
          type: 'THREAT_ACTOR',
          severity: 'HIGH',
          title: 'New APT Activity Detected',
          description: 'Suspicious activity patterns matching known APT group techniques detected in your environment.',
          source: 'Threat Intelligence Feed',
          confidence: 85,
          affectedSystems: ['Web Server', 'Database Server'],
          recommendedActions: ['Review network logs', 'Update security policies', 'Deploy additional monitoring'],
          relatedIntelligence: ['APT29', 'SolarWinds Campaign'],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          acknowledged: false
        },
        {
          id: '2',
          type: 'ZERO_DAY',
          severity: 'CRITICAL',
          title: 'Zero-Day Vulnerability Exploited',
          description: 'A previously unknown vulnerability is being actively exploited in the wild.',
          source: 'Security Research Team',
          confidence: 95,
          affectedSystems: ['Application Server'],
          recommendedActions: ['Apply emergency patches', 'Isolate affected systems', 'Monitor for indicators'],
          relatedIntelligence: ['CVE-2024-XXXX', 'Exploit Kit'],
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          acknowledged: false
        },
        {
          id: '3',
          type: 'SECURITY_POSTURE',
          severity: 'MEDIUM',
          title: 'Security Posture Degradation',
          description: 'Your security posture score has decreased due to new vulnerabilities.',
          source: 'Security Assessment',
          confidence: 90,
          recommendedActions: ['Review new vulnerabilities', 'Update patch management', 'Enhance monitoring'],
          relatedIntelligence: ['Security Posture Report'],
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          acknowledged: true,
          acknowledgedBy: 'user@example.com',
          acknowledgedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          type: 'ATTACK_VECTOR',
          severity: 'HIGH',
          title: 'New Attack Vector Identified',
          description: 'A new attack vector has been identified targeting your technology stack.',
          source: 'Threat Research',
          confidence: 80,
          affectedSystems: ['Web Application', 'API Gateway'],
          recommendedActions: ['Update security controls', 'Review access policies', 'Implement additional monitoring'],
          relatedIntelligence: ['Attack Vector Analysis'],
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          acknowledged: false
        }
      ];

      setAlerts(mockAlerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getSeverityColor = (severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'THREAT_ACTOR': return <Users className="h-4 w-4" />;
      case 'ZERO_DAY': return <AlertTriangle className="h-4 w-4" />;
      case 'SECURITY_POSTURE': return <Shield className="h-4 w-4" />;
      case 'ATTACK_VECTOR': return <Target className="h-4 w-4" />;
      case 'COMPLIANCE': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 dark:text-green-400';
    if (confidence >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (!showAcknowledged && alert.acknowledged) return false;
    
    switch (filter) {
      case 'unacknowledged': return !alert.acknowledged;
      case 'critical': return alert.severity === 'CRITICAL';
      case 'high': return alert.severity === 'HIGH' || alert.severity === 'CRITICAL';
      default: return true;
    }
  }).slice(0, maxAlerts);

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;
  const criticalCount = alerts.filter(alert => alert.severity === 'CRITICAL' && !alert.acknowledged).length;

  if (loading) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-red-600" />
            <span>Threat Intelligence Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-red-600" />
            <span>Threat Intelligence Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Alerts Unavailable
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button 
              variant="outline" 
              onClick={fetchAlerts}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-red-600" />
            <span>Threat Intelligence Alerts</span>
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="bg-red-500">
                {criticalCount} Critical
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAlerts}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex space-x-1">
            {[
              { key: 'unacknowledged', label: 'Unread', count: unacknowledgedCount },
              { key: 'critical', label: 'Critical', count: criticalCount },
              { key: 'all', label: 'All', count: alerts.length }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(key as any)}
                className="text-xs"
              >
                {label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <ScrollArea className="h-80">
          <div className="space-y-3 pr-2">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Alerts
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'unacknowledged' 
                    ? 'All alerts have been acknowledged'
                    : 'No alerts match the current filter'
                  }
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                    alert.acknowledged 
                      ? 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
                      : 'bg-gradient-to-r from-red-50/30 to-orange-50/30 dark:from-red-900/10 dark:to-orange-900/10 border-red-200 dark:border-red-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        alert.severity === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/20' :
                        alert.severity === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/20' :
                        alert.severity === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                        'bg-green-100 dark:bg-green-900/20'
                      }`}>
                        {getTypeIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                            {alert.title}
                          </h4>
                          <Badge className={`${getSeverityColor(alert.severity)} text-xs`}>
                            {alert.severity}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(alert.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Confidence:</span>
                            <span className={`font-medium ${getConfidenceColor(alert.confidence)}`}>
                              {alert.confidence}%
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Source:</span>
                            <span className="font-medium truncate">{alert.source}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Affected Systems */}
                  {alert.affectedSystems && alert.affectedSystems.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Affected Systems:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {alert.affectedSystems.slice(0, 3).map((system, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            {system}
                          </Badge>
                        ))}
                        {alert.affectedSystems.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            +{alert.affectedSystems.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recommended Actions:
                      </div>
                      <div className="space-y-1">
                        {alert.recommendedActions.slice(0, 2).map((action, index) => (
                          <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <span className="leading-relaxed">{action}</span>
                          </div>
                        ))}
                        {alert.recommendedActions.length > 2 && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            +{alert.recommendedActions.length - 2} more actions
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center space-x-2">
                      {!alert.acknowledged && (
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                    {alert.acknowledged && alert.acknowledgedBy && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Acknowledged by {alert.acknowledgedBy}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/analytics')}
          >
            View All Alerts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
