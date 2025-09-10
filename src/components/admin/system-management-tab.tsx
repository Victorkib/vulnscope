'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Database,
  BarChart3,
  Search,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Monitor,
  HardDrive,
  Cpu,
  MemoryStick,
  Network
} from 'lucide-react';

interface SystemConfig {
  _id?: string;
  key: string;
  value: any;
  category: string;
  description: string;
  isEditable: boolean;
  requiresRestart: boolean;
  updatedBy: string;
  updatedAt: string;
}

interface MaintenanceResult {
  operation: string;
  timestamp: string;
  performedBy: string;
  results: any;
}

interface PerformanceMetrics {
  system: {
    memory: {
      used: number;
      total: number;
      external: number;
      rss: number;
    };
    uptime: number;
    cpu: {
      usage: any;
    };
    platform: string;
    nodeVersion: string;
    timestamp: string;
  };
  database: {
    stats: any;
    collections: any[];
  };
  trends: {
    responseTime: {
      average: number;
      p95: number;
      p99: number;
      trend: string;
    };
    throughput: {
      requestsPerSecond: number;
      trend: string;
    };
    errorRate: {
      percentage: number;
      trend: string;
    };
    database: {
      queryTime: number;
      connectionPool: {
        active: number;
        idle: number;
        total: number;
      };
    };
  };
  alerts: any[];
  timeRange: string;
  timestamp: string;
}

export function SystemManagementTab() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [maintenanceResults, setMaintenanceResults] = useState<MaintenanceResult[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [runningMaintenance, setRunningMaintenance] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
    fetchPerformanceMetrics();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/system/config');
      const data = await response.json();
      
      if (data.success) {
        setConfigs(data.data);
      } else {
        setError(data.error || 'Failed to fetch system configuration');
      }
    } catch (err) {
      setError('Failed to fetch system configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch('/api/admin/system/performance');
      const data = await response.json();
      
      if (data.success) {
        setPerformanceMetrics(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch performance metrics:', err);
    }
  };

  const handleConfigUpdate = async (config: SystemConfig) => {
    try {
      const response = await fetch('/api/admin/system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: config.key,
          value: config.value,
          category: config.category,
          description: config.description,
          isEditable: config.isEditable,
          requiresRestart: config.requiresRestart
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchConfigs();
        setShowConfigDialog(false);
        setEditingConfig(null);
      } else {
        setError(data.error || 'Failed to update configuration');
      }
    } catch (err) {
      setError('Failed to update configuration');
    }
  };

  const handleConfigDelete = async (key: string) => {
    try {
      const response = await fetch(`/api/admin/system/config?key=${key}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchConfigs();
      } else {
        setError(data.error || 'Failed to delete configuration');
      }
    } catch (err) {
      setError('Failed to delete configuration');
    }
  };

  const handleMaintenanceOperation = async (operation: string) => {
    try {
      setRunningMaintenance(operation);
      const response = await fetch('/api/admin/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation })
      });

      const data = await response.json();
      
      if (data.success) {
        setMaintenanceResults(prev => [data.data, ...prev.slice(0, 9)]);
        await fetchPerformanceMetrics();
      } else {
        setError(data.error || 'Maintenance operation failed');
      }
    } catch (err) {
      setError('Maintenance operation failed');
    } finally {
      setRunningMaintenance(null);
    }
  };

  const filteredConfigs = configs.filter(config => {
    const matchesSearch = config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || config.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: string) => {
    const colors = {
      security: 'bg-red-100 text-red-800',
      notifications: 'bg-blue-100 text-blue-800',
      features: 'bg-green-100 text-green-800',
      performance: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          {/* Configuration Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>System Configuration</span>
                </div>
                <Button onClick={() => setShowConfigDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Config
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search configurations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="notifications">Notifications</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Editable</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigs.map((config) => (
                    <TableRow key={config.key}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{config.key}</p>
                          {config.requiresRestart && (
                            <Badge variant="outline" className="text-xs">
                              Requires Restart
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {typeof config.value === 'string' ? config.value : JSON.stringify(config.value)}
                        </code>
                      </TableCell>
                      <TableCell>{getCategoryBadge(config.category)}</TableCell>
                      <TableCell>
                        <p className="text-sm">{config.description}</p>
                      </TableCell>
                      <TableCell>
                        {config.isEditable ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{new Date(config.updatedAt).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">by {config.updatedBy}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingConfig(config);
                              setShowConfigDialog(true);
                            }}
                            disabled={!config.isEditable}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfigDelete(config.key)}
                            disabled={!config.isEditable}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          {/* Maintenance Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>System Maintenance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleMaintenanceOperation('health_check')}
                  disabled={runningMaintenance === 'health_check'}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  {runningMaintenance === 'health_check' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <CheckCircle className="h-6 w-6" />
                  )}
                  <span>Health Check</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleMaintenanceOperation('cleanup_old_logs')}
                  disabled={runningMaintenance === 'cleanup_old_logs'}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  {runningMaintenance === 'cleanup_old_logs' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Trash2 className="h-6 w-6" />
                  )}
                  <span>Cleanup Logs</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleMaintenanceOperation('reindex_collections')}
                  disabled={runningMaintenance === 'reindex_collections'}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  {runningMaintenance === 'reindex_collections' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <RefreshCw className="h-6 w-6" />
                  )}
                  <span>Reindex DB</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleMaintenanceOperation('compact_database')}
                  disabled={runningMaintenance === 'compact_database'}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  {runningMaintenance === 'compact_database' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <HardDrive className="h-6 w-6" />
                  )}
                  <span>Compact DB</span>
                </Button>
              </div>

              {/* Recent Maintenance Results */}
              {maintenanceResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Maintenance Results</h3>
                  <div className="space-y-2">
                    {maintenanceResults.map((result, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{result.operation}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(result.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Metrics */}
          {performanceMetrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatBytes(performanceMetrics.system.memory.used)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      of {formatBytes(performanceMetrics.system.memory.total)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(performanceMetrics.system.uptime / 3600)}h
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(performanceMetrics.system.uptime / 60)} minutes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceMetrics.trends.responseTime.average}ms
                    </div>
                    <p className="text-xs text-muted-foreground">
                      P95: {performanceMetrics.trends.responseTime.p95}ms
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceMetrics.trends.errorRate.percentage}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Trend: {performanceMetrics.trends.errorRate.trend}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Database Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Database Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Data Size:</span>
                          <span>{formatBytes(performanceMetrics.database.stats.dataSize || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Collections:</span>
                          <span>{performanceMetrics.database.stats.collections || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Indexes:</span>
                          <span>{performanceMetrics.database.stats.indexes || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Connection Pool</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Active:</span>
                          <span>{performanceMetrics.trends.database.connectionPool.active}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Idle:</span>
                          <span>{performanceMetrics.trends.database.connectionPool.idle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>{performanceMetrics.trends.database.connectionPool.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit Configuration' : 'Add Configuration'}
            </DialogTitle>
            <DialogDescription>
              {editingConfig ? 'Update the system configuration' : 'Create a new system configuration'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Configuration management functionality will be implemented here.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowConfigDialog(false);
              setEditingConfig(null);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
