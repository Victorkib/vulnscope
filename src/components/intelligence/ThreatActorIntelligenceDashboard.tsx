'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { extractTechniques } from '@/lib/threat-actor-utils';
import ThreatActorDetailModal from './ThreatActorDetailModal';
import type { 
  ThreatActor,
  ThreatActorIntelligenceData,
  ThreatActorStatistics
} from '@/types/threat-actor';
import {
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Shield,
  Globe,
  Activity,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Network,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';

interface ThreatActorIntelligenceDashboardProps {
  className?: string;
}

export default function ThreatActorIntelligenceDashboard({ className }: ThreatActorIntelligenceDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [intelligenceData, setIntelligenceData] = useState<ThreatActorIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterThreatLevel, setFilterThreatLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('last_seen');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [selectedActor, setSelectedActor] = useState<ThreatActor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchThreatActorIntelligence = useCallback(async () => {
    try {
      setRefreshing(true);
      
      const params = new URLSearchParams({
        limit: '100',
        sortBy,
        sortOrder,
        ...(searchQuery && { query: searchQuery }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterThreatLevel !== 'all' && { threatLevel: filterThreatLevel }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      const response = await apiClient.get(`/api/intelligence/threat-actors?${params}`);

      if (response.success) {
        setIntelligenceData(response.data);
      } else {
        throw new Error('Failed to fetch threat actor intelligence');
      }

    } catch (error) {
      console.error('Error fetching threat actor intelligence:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch threat actor intelligence',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterType, filterThreatLevel, filterStatus, sortBy, sortOrder, toast]);

  useEffect(() => {
    fetchThreatActorIntelligence();
  }, [fetchThreatActorIntelligence]);

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'DORMANT': return 'bg-yellow-100 text-yellow-800';
      case 'DISRUPTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Play className="h-4 w-4 text-green-500" />;
      case 'INACTIVE': return <Pause className="h-4 w-4 text-gray-500" />;
      case 'DORMANT': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'DISRUPTED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRefresh = () => {
    fetchThreatActorIntelligence();
  };

  const handleViewDetails = (actor: ThreatActor) => {
    setSelectedActor(actor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActor(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!intelligenceData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Failed to load threat actor intelligence</p>
      </div>
    );
  }

  const { threatActors, statistics } = intelligenceData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Threat Actor Intelligence</h1>
          <p className="text-muted-foreground">
            Advanced threat actor tracking, APT campaign analysis, and attribution
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Threat Actors</p>
                <p className="text-2xl font-bold">{statistics.totalActors}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {statistics.activeActors} active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Threat Actors</p>
                <p className="text-2xl font-bold">
                  {(statistics.byThreatLevel['HIGH'] || 0) + (statistics.byThreatLevel['CRITICAL'] || 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {statistics.byThreatLevel['CRITICAL'] || 0} critical
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Activity</p>
                <p className="text-2xl font-bold">{statistics.recentActivity}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Last 30 days
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attribution Accuracy</p>
                <p className="text-2xl font-bold">{statistics.attributionAccuracy}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Confidence score
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search threat actors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="APT">APT</SelectItem>
                <SelectItem value="Cybercriminal">Cybercriminal</SelectItem>
                <SelectItem value="Hacktivist">Hacktivist</SelectItem>
                <SelectItem value="Nation-State">Nation-State</SelectItem>
                <SelectItem value="Insider">Insider</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterThreatLevel} onValueChange={setFilterThreatLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Threat Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="DORMANT">Dormant</SelectItem>
                <SelectItem value="DISRUPTED">Disrupted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_seen-desc">Last Seen (Newest)</SelectItem>
                <SelectItem value="last_seen-asc">Last Seen (Oldest)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="threat_level-desc">Threat Level (High-Low)</SelectItem>
                <SelectItem value="threat_level-asc">Threat Level (Low-High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="actors" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Threat Actors</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="attribution" className="flex items-center space-x-2">
            <Network className="h-4 w-4" />
            <span>Attribution</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Threat Actor Types</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count as number / statistics.totalActors) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Geographic Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics.byCountry).slice(0, 5).map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{country}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(count as number / statistics.totalActors) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actors" className="space-y-6">
          {/* Threat Actors List */}
          <div className="grid grid-cols-1 gap-4">
            {threatActors.map((actor) => (
              <Card key={actor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{actor.name}</h3>
                        <Badge className={getThreatLevelColor((actor as any).threat_level)}>
                          {(actor as any).threat_level}
                        </Badge>
                        <Badge className={getStatusColor(actor.status)}>
                          {getStatusIcon(actor.status)}
                          <span className="ml-1">{actor.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{actor.type}</span>
                        </div>
                        {actor.country && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{actor.country}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Last seen: {formatDate((actor as any).last_seen)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Target className="h-4 w-4" />
                          <span>Confidence: {actor.confidence}%</span>
                        </div>
                      </div>

                      {actor.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {actor.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const techniquesArray = extractTechniques(actor.techniques);
                          return techniquesArray.slice(0, 3).map((technique) => (
                            <Badge key={technique} variant="outline" className="text-xs">
                              {technique}
                            </Badge>
                          ));
                        })()}
                        {(() => {
                          const techniquesArray = extractTechniques(actor.techniques);
                          return techniquesArray.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{techniquesArray.length - 3} more
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(actor)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>APT Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Campaign analysis and tracking will be implemented in the next phase.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Threat Attribution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced attribution analysis and correlation will be implemented in the next phase.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Threat Actor Detail Modal */}
      <ThreatActorDetailModal
        actor={selectedActor}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
