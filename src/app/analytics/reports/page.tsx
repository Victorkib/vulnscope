'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIntelligenceData } from '@/hooks/use-intelligence-data';
import { 
  Download, 
  FileText, 
  BarChart3, 
  PieChart, 
  Calendar,
  Loader2,
  RefreshCw,
  Eye,
  Share2,
  Mail,
  Printer
} from 'lucide-react';

export default function IntelligenceReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('threat-landscape');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState('30d');

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

  const reportTemplates = [
    {
      id: 'threat-landscape',
      title: 'Threat Landscape Analysis',
      description: 'Comprehensive analysis of global threat landscape and trends',
      icon: BarChart3,
      sections: ['Global Threats', 'Geographic Distribution', 'Sector Analysis', 'Temporal Trends'],
      estimatedPages: 8
    },
    {
      id: 'security-posture',
      title: 'Security Posture Assessment',
      description: 'Detailed security posture evaluation and risk assessment',
      icon: PieChart,
      sections: ['Risk Score', 'Vulnerability Exposure', 'Compliance Status', 'Recommendations'],
      estimatedPages: 6
    },
    {
      id: 'predictive-analytics',
      title: 'Predictive Security Analytics',
      description: 'AI-powered threat forecasting and security investment analysis',
      icon: Calendar,
      sections: ['Vulnerability Forecast', 'Risk Trends', 'Attack Surface Evolution', 'ROI Analysis'],
      estimatedPages: 10
    },
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      description: 'High-level security intelligence summary for leadership',
      icon: FileText,
      sections: ['Key Metrics', 'Critical Findings', 'Strategic Recommendations', 'Investment Priorities'],
      estimatedPages: 4
    }
  ];

  const handleGenerateReport = async (templateId: string) => {
    // In a real implementation, this would generate and download the report
    console.log(`Generating ${templateId} report in ${reportFormat} format for ${dateRange}`);
    // Mock implementation - would call API to generate report
  };

  const handlePreviewReport = (templateId: string) => {
    // In a real implementation, this would open a preview modal
    console.log(`Previewing ${templateId} report`);
  };

  const handleShareReport = (templateId: string) => {
    // In a real implementation, this would open sharing options
    console.log(`Sharing ${templateId} report`);
  };

  if (loading || isLoading || intelligenceLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading intelligence reports...</p>
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
              <h1 className="text-3xl font-bold">Intelligence Reports</h1>
              <p className="text-muted-foreground">
                Generate comprehensive security intelligence reports and analytics
              </p>
            </div>
            <Button onClick={() => refreshData()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <p className="text-red-600">Error loading intelligence data: {error}</p>
              </CardContent>
            </Card>
          )}

          {/* Report Generation Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Report Generation Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Format</label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="powerpoint">PowerPoint Presentation</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Actions</label>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleGenerateReport(selectedReport)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Templates */}
          <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="threat-landscape">Threat Landscape</TabsTrigger>
              <TabsTrigger value="security-posture">Security Posture</TabsTrigger>
              <TabsTrigger value="predictive-analytics">Predictive Analytics</TabsTrigger>
              <TabsTrigger value="executive-summary">Executive Summary</TabsTrigger>
            </TabsList>

            {reportTemplates.map((template) => (
              <TabsContent key={template.id} value={template.id} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Report Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <template.icon className="h-5 w-5" />
                        <span>{template.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">{template.description}</p>
                        
                        <div>
                          <h4 className="font-medium mb-2">Report Sections</h4>
                          <div className="space-y-2">
                            {template.sections.map((section, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                                <span className="text-sm">{section}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Estimated Pages</span>
                          <Badge variant="outline">{template.estimatedPages} pages</Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Data Freshness</span>
                          <Badge className="bg-green-100 text-green-800">
                            {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'Current'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Report Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Report Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button 
                          onClick={() => handleGenerateReport(template.id)}
                          className="w-full"
                          size="lg"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => handlePreviewReport(template.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleShareReport(template.id)}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                          <Button variant="outline" size="sm">
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Report Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Report Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {template.id === 'threat-landscape' && threatLandscapeData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Global Threat Overview</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Total Threats</span>
                                <span className="font-bold">{threatLandscapeData.global.totalThreats}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Active Threats</span>
                                <span className="font-bold">{threatLandscapeData.global.activeThreats}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Threat Level</span>
                                <Badge className={threatLandscapeData.global.threatLevel === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}>
                                  {threatLandscapeData.global.threatLevel}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Geographic Distribution</h4>
                            <div className="space-y-2">
                              {threatLandscapeData.geographic.slice(0, 3).map((region, index) => (
                                <div key={index} className="flex justify-between">
                                  <span className="text-sm">{region.region}</span>
                                  <span className="font-bold">{region.threatCount}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {template.id === 'security-posture' && securityPosture && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Security Metrics</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Risk Score</span>
                                <span className="font-bold">{securityPosture.riskScore}/100</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Patch Compliance</span>
                                <span className="font-bold">{securityPosture.patchCompliance}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Security Maturity</span>
                                <span className="font-bold">{securityPosture.securityMaturity}/100</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Compliance Status</h4>
                            <div className="space-y-2">
                              {Object.entries(securityPosture.complianceStatus).map(([framework, compliant]) => (
                                <div key={framework} className="flex justify-between">
                                  <span className="text-sm capitalize">{framework}</span>
                                  <Badge className={compliant ? 'bg-green-500' : 'bg-red-500'}>
                                    {compliant ? 'Compliant' : 'Non-Compliant'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {template.id === 'predictive-analytics' && stats && (
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Prediction Accuracy</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Model Accuracy</span>
                              <span className="font-bold">{stats.predictionAccuracy}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Total Threats Analyzed</span>
                              <span className="font-bold">{stats.totalThreats}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Active Threats</span>
                              <span className="font-bold">{stats.activeThreats}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {template.id === 'executive-summary' && (
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Executive Summary Preview</h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>• Comprehensive threat landscape analysis with {threatLandscapeData?.global.totalThreats || 0} total threats identified</p>
                            <p>• Security posture assessment showing {securityPosture?.riskScore || 0}/100 risk score</p>
                            <p>• {securityPosture?.recommendations.length || 0} strategic recommendations for security improvement</p>
                            <p>• Predictive analytics with {stats?.predictionAccuracy || 0}% accuracy in threat forecasting</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
