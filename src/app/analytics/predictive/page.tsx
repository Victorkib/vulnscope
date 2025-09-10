'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntelligenceData } from '@/hooks/use-intelligence-data';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  Calendar
} from 'lucide-react';

export default function PredictiveAnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const { 
    threatLandscapeData,
    securityPosture, 
    stats,
    loading: intelligenceLoading, 
    error,
    refreshData 
  } = useIntelligenceData({ includeRecommendations: true });

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

  // Mock predictive analytics data (in real implementation, this would come from ML models)
  const predictiveData = {
    vulnerabilityForecast: {
      nextWeek: { count: 45, confidence: 85, trend: 'increasing' },
      nextMonth: { count: 180, confidence: 78, trend: 'stable' },
      nextQuarter: { count: 520, confidence: 72, trend: 'increasing' }
    },
    riskTrends: {
      criticalRisk: { current: 12, predicted: 18, change: 50 },
      highRisk: { current: 35, predicted: 42, change: 20 },
      mediumRisk: { current: 120, predicted: 115, change: -4 },
      lowRisk: { current: 200, predicted: 195, change: -2.5 }
    },
    attackSurfaceEvolution: {
      current: 45,
      predicted: 52,
      growth: 15.6,
      newVectors: ['API', 'Cloud', 'IoT'],
      decliningVectors: ['Legacy Systems']
    },
    securityInvestmentROI: {
      currentInvestment: 150000,
      predictedSavings: 450000,
      roi: 200,
      topInvestments: [
        { area: 'Patch Management', roi: 350, impact: 'High' },
        { area: 'Security Training', roi: 280, impact: 'Medium' },
        { area: 'Monitoring Tools', roi: 220, impact: 'High' }
      ]
    }
  };

  if (loading || isLoading || intelligenceLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading predictive analytics...</p>
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
              <h1 className="text-3xl font-bold">Predictive Security Analytics</h1>
              <p className="text-muted-foreground">
                AI-powered threat forecasting and security investment optimization
              </p>
            </div>
            <Button onClick={() => refreshData()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Predictions
            </Button>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <p className="text-red-600">Error loading predictive analytics: {error}</p>
              </CardContent>
            </Card>
          )}

          {/* Prediction Accuracy */}
          {stats && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Prediction Accuracy</h3>
                    <p className="text-sm text-muted-foreground">
                      Current model accuracy based on historical data
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{stats.predictionAccuracy}%</div>
                    <Badge className="bg-green-100 text-green-800">High Accuracy</Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={stats.predictionAccuracy} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="forecasting" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="forecasting" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Vulnerability Forecasting</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Risk Trends</span>
              </TabsTrigger>
              <TabsTrigger value="attack-surface" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Attack Surface</span>
              </TabsTrigger>
              <TabsTrigger value="roi" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Investment ROI</span>
              </TabsTrigger>
            </TabsList>

            {/* Vulnerability Forecasting */}
            <TabsContent value="forecasting" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Next Week</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {predictiveData.vulnerabilityForecast.nextWeek.count}
                        </div>
                        <p className="text-sm text-muted-foreground">Predicted Vulnerabilities</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Confidence</span>
                        <Badge className="bg-green-100 text-green-800">
                          {predictiveData.vulnerabilityForecast.nextWeek.confidence}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Trend</span>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600 capitalize">
                            {predictiveData.vulnerabilityForecast.nextWeek.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Next Month</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          {predictiveData.vulnerabilityForecast.nextMonth.count}
                        </div>
                        <p className="text-sm text-muted-foreground">Predicted Vulnerabilities</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Confidence</span>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {predictiveData.vulnerabilityForecast.nextMonth.confidence}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Trend</span>
                        <div className="flex items-center space-x-1">
                          <div className="h-4 w-4 bg-gray-400 rounded-full" />
                          <span className="text-sm text-gray-600 capitalize">
                            {predictiveData.vulnerabilityForecast.nextMonth.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Next Quarter</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {predictiveData.vulnerabilityForecast.nextQuarter.count}
                        </div>
                        <p className="text-sm text-muted-foreground">Predicted Vulnerabilities</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Confidence</span>
                        <Badge className="bg-orange-100 text-orange-800">
                          {predictiveData.vulnerabilityForecast.nextQuarter.confidence}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Trend</span>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600 capitalize">
                            {predictiveData.vulnerabilityForecast.nextQuarter.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Risk Trends */}
            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(predictiveData.riskTrends).map(([risk, data]) => (
                  <Card key={risk}>
                    <CardHeader>
                      <CardTitle className="text-sm capitalize">
                        {risk.replace(/([A-Z])/g, ' $1').trim()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current</span>
                          <span className="font-bold">{data.current}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Predicted</span>
                          <span className="font-bold">{data.predicted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Change</span>
                          <div className="flex items-center space-x-1">
                            {data.change > 0 ? (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-sm font-medium ${data.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {data.change > 0 ? '+' : ''}{data.change}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Attack Surface Evolution */}
            <TabsContent value="attack-surface" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Attack Surface Growth</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current Attack Vectors</span>
                        <span className="font-bold">{predictiveData.attackSurfaceEvolution.current}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Predicted Attack Vectors</span>
                        <span className="font-bold">{predictiveData.attackSurfaceEvolution.predicted}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Growth Rate</span>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium text-orange-600">
                            +{predictiveData.attackSurfaceEvolution.growth}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Emerging Attack Vectors</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-600 mb-2">New Vectors</h4>
                        <div className="space-y-2">
                          {predictiveData.attackSurfaceEvolution.newVectors.map((vector, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-green-500 rounded-full" />
                              <span className="text-sm">{vector}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-600 mb-2">Declining Vectors</h4>
                        <div className="space-y-2">
                          {predictiveData.attackSurfaceEvolution.decliningVectors.map((vector, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-red-500 rounded-full" />
                              <span className="text-sm">{vector}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Investment ROI */}
            <TabsContent value="roi" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Security Investment ROI</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current Investment</span>
                        <span className="font-bold">
                          ${predictiveData.securityInvestmentROI.currentInvestment.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Predicted Savings</span>
                        <span className="font-bold text-green-600">
                          ${predictiveData.securityInvestmentROI.predictedSavings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">ROI</span>
                        <Badge className="bg-green-100 text-green-800">
                          {predictiveData.securityInvestmentROI.roi}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Top Investment Areas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {predictiveData.securityInvestmentROI.topInvestments.map((investment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{investment.area}</h4>
                            <p className="text-sm text-muted-foreground">Impact: {investment.impact}</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">
                            {investment.roi}% ROI
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
