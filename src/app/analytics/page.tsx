'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import ThreatLandscapeDashboard from '@/components/intelligence/ThreatLandscapeDashboard';
import ThreatActorIntelligenceDashboard from '@/components/intelligence/ThreatActorIntelligenceDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUnifiedIntelligence } from '@/hooks/use-unified-intelligence';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Clock,
  Users,
  Database,
  Loader2,
  BarChart3,
  Eye,
  Brain,
  FileText
} from 'lucide-react';

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const { 
    securityPosture, 
    threatLandscape,
    threatActors,
    predictiveAnalytics,
    loading: intelligenceLoading, 
    error,
    refreshData,
    getAggregatedStats
  } = useUnifiedIntelligence({ includeRecommendations: true, autoRefresh: true });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else {
        setIsLoading(false);
      }
    }
  }, [user, loading, router]);

  const getThreatLevelColor = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading threat intelligence dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Threat Intelligence Center</h1>
              <p className="text-muted-foreground">
                Comprehensive threat landscape analysis and security intelligence
              </p>
            </div>
            <Button onClick={() => refreshData()} variant="outline">
              Refresh Data
            </Button>
          </div>

          {/* Quick Stats Overview */}
          {securityPosture && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                      <p className="text-2xl font-bold">{securityPosture.riskScore}/100</p>
                    </div>
                    <Shield className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    <Progress value={securityPosture.riskScore} className="h-2" />
                  </div>
                  <div className="mt-2">
                    <Badge className={getThreatLevelColor(securityPosture.metrics.threatLevel)}>
                      {securityPosture.metrics.threatLevel}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vulnerability Exposure</p>
                      <p className="text-2xl font-bold">{securityPosture.vulnerabilityExposure}/100</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="mt-2">
                    <Progress value={securityPosture.vulnerabilityExposure} className="h-2" />
                  </div>
                  <div className="mt-2 flex items-center space-x-1">
                    {getTrendIcon(securityPosture.trends.exposureTrend)}
                    <span className="text-xs text-muted-foreground capitalize">
                      {securityPosture.trends.exposureTrend}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Patch Compliance</p>
                      <p className="text-2xl font-bold">{securityPosture.patchCompliance}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    <Progress value={securityPosture.patchCompliance} className="h-2" />
                  </div>
                  <div className="mt-2 flex items-center space-x-1">
                    {getTrendIcon(securityPosture.trends.patchTrend)}
                    <span className="text-xs text-muted-foreground capitalize">
                      {securityPosture.trends.patchTrend}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Security Maturity</p>
                      <p className="text-2xl font-bold">{securityPosture.securityMaturity}/100</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="mt-2">
                    <Progress value={securityPosture.securityMaturity} className="h-2" />
                  </div>
                  <div className="mt-2 flex items-center space-x-1">
                    {getTrendIcon(securityPosture.trends.riskTrend)}
                    <span className="text-xs text-muted-foreground capitalize">
                      {securityPosture.trends.riskTrend}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Intelligence Tabs */}
          <Tabs defaultValue="landscape" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="landscape" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Threat Landscape</span>
              </TabsTrigger>
              <TabsTrigger value="threat-actors" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Threat Actors</span>
              </TabsTrigger>
              <TabsTrigger value="posture" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Security Posture</span>
              </TabsTrigger>
              <TabsTrigger value="predictive" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Predictive Analytics</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="landscape" className="space-y-6">
              <ThreatLandscapeDashboard />
            </TabsContent>
            
            <TabsContent value="threat-actors" className="space-y-6">
              <ThreatActorIntelligenceDashboard />
            </TabsContent>
            
            <TabsContent value="posture" className="space-y-6">
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <p className="text-red-600">Error loading security posture data: {error}</p>
                  </CardContent>
                </Card>
              )}

              {securityPosture && (
                <>
                  {/* Detailed Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Database className="h-5 w-5" />
                          <span>Vulnerability Metrics</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Vulnerabilities</span>
                            <span className="font-bold">{securityPosture.metrics.totalVulnerabilities}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Critical Vulnerabilities</span>
                            <Badge className="bg-red-500 text-white">
                              {securityPosture.metrics.criticalVulnerabilities}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">High Vulnerabilities</span>
                            <Badge className="bg-orange-500 text-white">
                              {securityPosture.metrics.highVulnerabilities}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Medium Vulnerabilities</span>
                            <Badge className="bg-yellow-500 text-black">
                              {securityPosture.metrics.mediumVulnerabilities}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Low Vulnerabilities</span>
                            <Badge className="bg-green-500 text-white">
                              {securityPosture.metrics.lowVulnerabilities}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Patched Vulnerabilities</span>
                            <span className="font-bold text-green-600">
                              {securityPosture.metrics.patchedVulnerabilities}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Average Patch Time</span>
                            <span className="font-bold">
                              {securityPosture.metrics.averagePatchTime} days
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>Compliance Status</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(securityPosture.complianceStatus).map(([framework, compliant]) => (
                            <div key={framework} className="flex items-center justify-between">
                              <span className="text-sm font-medium capitalize">{framework}</span>
                              <Badge 
                                className={compliant ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                              >
                                {compliant ? 'Compliant' : 'Non-Compliant'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Security Recommendations */}
                  {securityPosture.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Target className="h-5 w-5" />
                          <span>Security Recommendations</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {securityPosture.recommendations.map((recommendation) => (
                            <div key={recommendation.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                              <div className="flex-shrink-0">
                                <Badge 
                                  className={getThreatLevelColor(recommendation.priority)}
                                >
                                  {recommendation.priority}
                                </Badge>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{recommendation.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {recommendation.description}
                                </p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    Impact: {recommendation.impact}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Effort: {recommendation.effort}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Timeframe: {recommendation.timeframe}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Improvement Areas */}
                  {securityPosture.improvementAreas.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5" />
                          <span>Areas for Improvement</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {securityPosture.improvementAreas.map((area, index) => (
                            <div key={index} className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">{area}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="predictive" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>Predictive Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Predictive Analytics Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Advanced threat forecasting and predictive security analytics will be available here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
