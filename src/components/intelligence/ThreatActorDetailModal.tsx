'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractTechniques, extractTactics, extractTools, extractAliases, extractMotivation } from '@/lib/threat-actor-utils';
import type { ThreatActor } from '@/types/threat-actor';
import {
  Users,
  Target,
  Shield,
  Globe,
  MapPin,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Network,
  Zap,
  Eye,
  Database,
  BarChart3,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePreferences } from '@/contexts/preferences-context';

interface ThreatActorDetailModalProps {
  actor: ThreatActor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ThreatActorDetailModal({ actor, isOpen, onClose }: ThreatActorDetailModalProps) {
  const { toast } = useToast();
  const { preferences, isDarkMode } = usePreferences();
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  if (!actor) return null;

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
      case 'ACTIVE': return 'bg-green-500 text-white';
      case 'INACTIVE': return 'bg-gray-500 text-white';
      case 'DORMANT': return 'bg-yellow-500 text-black';
      case 'DISRUPTED': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-3 w-3" />;
      case 'INACTIVE': return <XCircle className="h-3 w-3" />;
      case 'DORMANT': return <Clock className="h-3 w-3" />;
      case 'DISRUPTED': return <AlertTriangle className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${label} copied successfully`,
    });
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf' = exportFormat) => {
    if (!actor) return;

    setIsExporting(true);
    try {
      let exportData: any;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        exportData = JSON.stringify(actor, null, 2);
        filename = `threat-actor-${actor.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.json`;
        mimeType = 'application/json';
      } else if (format === 'csv') {
        // Create CSV format for threat actor data
        const csvData = [
          ['Field', 'Value'],
          ['Name', actor.name],
          ['Type', actor.type],
          ['Country', actor.country || ''],
          ['Region', actor.region || ''],
          ['Threat Level', actor.threatLevel],
          ['Status', actor.status],
          ['Confidence', actor.confidence],
          ['Description', actor.description],
          ['Aliases', actor.aliases?.join('; ') || ''],
          ['Motivation', actor.motivation?.join('; ') || ''],
          ['Tools', actor.tools?.join('; ') || ''],
          ['Tactics', actor.tactics?.join('; ') || ''],
          ['Techniques', techniques.join('; ')],
          ['Primary Targets', actor.targets?.primary?.join('; ') || ''],
          ['Secondary Targets', actor.targets?.secondary?.join('; ') || ''],
          ['Geographic Targets', actor.targets?.geographic?.join('; ') || ''],
          ['Domains', actor.infrastructure?.domains?.join('; ') || ''],
          ['IP Addresses', actor.infrastructure?.ips?.join('; ') || ''],
          ['C2 Servers', actor.infrastructure?.servers?.join('; ') || ''],
          ['Campaigns', actor.timeline?.campaigns?.join('; ') || ''],
          ['First Seen', actor.timeline?.first_seen || ''],
          ['Last Seen', actor.lastSeen],
          ['Created At', actor.createdAt],
          ['Updated At', actor.updatedAt]
        ];

        exportData = csvData.map(row => 
          row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        filename = `threat-actor-${actor.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.csv`;
        mimeType = 'text/csv';
      } else {
        // PDF format - create a comprehensive report
        const pdfContent = `
THREAT ACTOR INTELLIGENCE REPORT
================================

Name: ${actor.name}
Type: ${actor.type}
Country: ${actor.country || 'Unknown'}
Region: ${actor.region || 'Unknown'}
Threat Level: ${actor.threatLevel}
Status: ${actor.status}
Confidence: ${actor.confidence}%

DESCRIPTION
-----------
${actor.description}

ALIASES
-------
${actor.aliases?.join(', ') || 'None'}

MOTIVATION
----------
${actor.motivation?.join(', ') || 'Unknown'}

CAPABILITIES
------------
Technical Skills: ${actor.capabilities?.technical_skills || 'Unknown'}
Stealth Level: ${actor.capabilities?.stealth || 'Unknown'}
Persistence: ${actor.capabilities?.persistence || 'Unknown'}
Social Engineering: ${actor.capabilities?.social_engineering || 'Unknown'}
Custom Tools: ${actor.capabilities?.custom_tools ? 'Yes' : 'No'}
Zero-Day Access: ${actor.capabilities?.zero_day_access ? 'Yes' : 'No'}

TOOLS & TECHNIQUES
------------------
Tools: ${actor.tools?.join(', ') || 'None'}
Tactics: ${actor.tactics?.join(', ') || 'None'}
Techniques: ${techniques.join(', ')}

TARGETS
-------
Primary: ${actor.targets?.primary?.join(', ') || 'None'}
Secondary: ${actor.targets?.secondary?.join(', ') || 'None'}
Geographic: ${actor.targets?.geographic?.join(', ') || 'None'}

INFRASTRUCTURE
--------------
Domains: ${actor.infrastructure?.domains?.join(', ') || 'None'}
IP Addresses: ${actor.infrastructure?.ips?.join(', ') || 'None'}
C2 Servers: ${actor.infrastructure?.servers?.join(', ') || 'None'}
Cloud Infrastructure: ${actor.infrastructure?.cloud_infrastructure?.join(', ') || 'None'}

TIMELINE
--------
First Seen: ${actor.timeline?.first_seen || 'Unknown'}
Last Seen: ${actor.lastSeen}
Campaigns: ${actor.timeline?.campaigns?.join(', ') || 'None'}

ATTRIBUTION
-----------
Methodology: ${actor.attribution?.attribution_methodology || 'Unknown'}
Confidence Factors: ${actor.attribution?.confidence_factors?.join(', ') || 'None'}
Sources: ${actor.attribution?.attribution_sources?.join(', ') || 'None'}

Report Generated: ${new Date().toLocaleString()}
        `;

        exportData = pdfContent;
        filename = `threat-actor-${actor.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.txt`;
        mimeType = 'text/plain';
      }

      // Create and download the file
      const blob = new Blob([exportData], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export Complete',
        description: `Threat actor data exported as ${format.toUpperCase()}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export threat actor data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Extract data from the actual API response structure
  const techniques = Array.isArray(actor.techniques) ? actor.techniques : 
    (typeof actor.techniques === 'object' ? Object.values(actor.techniques).flat() : []);
  const tactics = Array.isArray(actor.tactics) ? actor.tactics : [];
  const tools = Array.isArray(actor.tools) ? actor.tools : [];
  const aliases = Array.isArray(actor.aliases) ? actor.aliases : [];
  const motivation = Array.isArray(actor.motivation) ? actor.motivation : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center space-x-3">
                <Users className="h-6 w-6" />
                <span>{actor.name}</span>
                <Badge className={getThreatLevelColor(actor.threatLevel)}>
                  {actor.threatLevel}
                </Badge>
                <Badge className={getStatusColor(actor.status)}>
                  {getStatusIcon(actor.status)}
                  <span className="ml-1">{actor.status}</span>
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-base">
                {actor.type} • {actor.country || 'Unknown Country'} • Confidence: {actor.confidence}%
              </DialogDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(actor.id, 'Actor ID')}>
                <Copy className="h-4 w-4 mr-1" />
                Copy ID
              </Button>
              <Select value={exportFormat} onValueChange={(value: 'json' | 'csv' | 'pdf') => setExportFormat(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport()}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-1" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="attribution">Attribution</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm mt-1">{actor.description}</p>
                  </div>
                  
                  {aliases.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Aliases</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {aliases.map((alias, index) => (
                          <Badge key={index} variant="outline">{alias}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {motivation.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Motivation</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {motivation.map((mot, index) => (
                          <Badge key={index} variant="secondary">{mot}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="text-sm font-medium">{actor.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Country</label>
                      <p className="text-sm font-medium">{actor.country || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Region</label>
                      <p className="text-sm font-medium">{actor.region || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Confidence</label>
                      <p className="text-sm font-medium">{actor.confidence}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Activity Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">First Seen</label>
                    <p className="text-sm font-medium">{formatDate(actor.timeline?.first_seen || actor.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Seen</label>
                    <p className="text-sm font-medium">{formatDate(actor.lastSeen || actor.updatedAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Campaigns</label>
                    <p className="text-sm font-medium">{actor.timeline?.campaigns?.length || 0} campaigns</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Recent Activity</label>
                    <p className="text-sm font-medium">{actor.timeline?.recent_activity || 'Unknown'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Techniques and Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {techniques.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Techniques ({techniques.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {techniques.slice(0, 10).map((technique, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {technique}
                        </Badge>
                      ))}
                      {techniques.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{techniques.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {tools.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Tools ({tools.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tools.slice(0, 10).map((tool, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                      {tools.length > 10 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tools.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{aliases.length}</div>
                    <div className="text-sm text-muted-foreground">Aliases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{techniques.length}</div>
                    <div className="text-sm text-muted-foreground">Techniques</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{tools.length}</div>
                    <div className="text-sm text-muted-foreground">Tools</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{actor.timeline?.campaigns?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Campaigns</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Technical Capabilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Technical Capabilities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {actor.capabilities && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Technical Skills</label>
                        <Badge variant="outline" className="ml-2">
                          {actor.capabilities.technical_skills || 'Unknown'}
                        </Badge>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Stealth Level</label>
                        <Badge variant="outline" className="ml-2">
                          {actor.capabilities.stealth || 'Unknown'}
                        </Badge>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Persistence</label>
                        <Badge variant="outline" className="ml-2">
                          {actor.capabilities.persistence || 'Unknown'}
                        </Badge>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Social Engineering</label>
                        <Badge variant="outline" className="ml-2">
                          {actor.capabilities.social_engineering || 'Unknown'}
                        </Badge>
                      </div>

                      {actor.capabilities.custom_tools && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Custom Tools</label>
                          <Badge variant="secondary" className="ml-2">Yes</Badge>
                        </div>
                      )}

                      {actor.capabilities.zero_day_access && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Zero-Day Access</label>
                          <Badge variant="destructive" className="ml-2">Yes</Badge>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Operational Capabilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Operational Capabilities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {actor.capabilities?.operational && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Persistence</label>
                        <Progress value={actor.capabilities.operational.persistence} className="mt-1" />
                        <span className="text-xs text-muted-foreground">{actor.capabilities.operational.persistence}%</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Stealth</label>
                        <Progress value={actor.capabilities.operational.stealth} className="mt-1" />
                        <span className="text-xs text-muted-foreground">{actor.capabilities.operational.stealth}%</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Sophistication</label>
                        <Progress value={actor.capabilities.operational.sophistication} className="mt-1" />
                        <span className="text-xs text-muted-foreground">{actor.capabilities.operational.sophistication}%</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Resources</label>
                        <Progress value={actor.capabilities.operational.resources} className="mt-1" />
                        <span className="text-xs text-muted-foreground">{actor.capabilities.operational.resources}%</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Intelligence Capabilities */}
            {actor.capabilities?.intelligence && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>Intelligence Capabilities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reconnaissance</label>
                      <Progress value={actor.capabilities.intelligence.reconnaissance} className="mt-1" />
                      <span className="text-xs text-muted-foreground">{actor.capabilities.intelligence.reconnaissance}%</span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Social Engineering</label>
                      <Progress value={actor.capabilities.intelligence.socialEngineering} className="mt-1" />
                      <span className="text-xs text-muted-foreground">{actor.capabilities.intelligence.socialEngineering}%</span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Target Selection</label>
                      <Progress value={actor.capabilities.intelligence.targetSelection} className="mt-1" />
                      <span className="text-xs text-muted-foreground">{actor.capabilities.intelligence.targetSelection}%</span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Operational Security</label>
                      <Progress value={actor.capabilities.intelligence.operationalSecurity} className="mt-1" />
                      <span className="text-xs text-muted-foreground">{actor.capabilities.intelligence.operationalSecurity}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Network Infrastructure */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Network className="h-5 w-5" />
                    <span>Network Infrastructure</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {actor.infrastructure?.domains?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Domains ({actor.infrastructure.domains.length})</label>
                      <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                        {actor.infrastructure.domains.slice(0, 5).map((domain, index) => (
                          <div key={index} className={`flex items-center justify-between text-xs p-2 rounded border ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <span className="font-mono">{domain}</span>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(domain, 'Domain')}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {actor.infrastructure.domains.length > 5 && (
                          <p className="text-xs text-muted-foreground">+{actor.infrastructure.domains.length - 5} more domains</p>
                        )}
                      </div>
                    </div>
                  )}

                  {actor.infrastructure?.ips?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">IP Addresses ({actor.infrastructure.ips.length})</label>
                      <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                        {actor.infrastructure.ips.slice(0, 5).map((ip, index) => (
                          <div key={index} className={`flex items-center justify-between text-xs p-2 rounded border ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <span className="font-mono">{ip}</span>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(ip, 'IP Address')}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {actor.infrastructure.ips.length > 5 && (
                          <p className="text-xs text-muted-foreground">+{actor.infrastructure.ips.length - 5} more IPs</p>
                        )}
                      </div>
                    </div>
                  )}

                  {actor.infrastructure?.servers?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">C2 Servers ({actor.infrastructure.servers.length})</label>
                      <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                        {actor.infrastructure.servers.slice(0, 5).map((server, index) => (
                          <div key={index} className={`flex items-center justify-between text-xs p-2 rounded border ${
                            isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                          }`}>
                            <span className="font-mono">{server}</span>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(server, 'C2 Server')}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {actor.infrastructure.servers.length > 5 && (
                          <p className="text-xs text-muted-foreground">+{actor.infrastructure.servers.length - 5} more servers</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Malware and Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Malware & Tools</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {actor.infrastructure?.cloud_infrastructure?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cloud Infrastructure</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {actor.infrastructure.cloud_infrastructure.map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{service}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {actor.infrastructure?.cryptocurrency_wallets?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cryptocurrency Wallets</label>
                      <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                        {actor.infrastructure.cryptocurrency_wallets.slice(0, 5).map((wallet, index) => (
                          <div key={index} className={`flex items-center justify-between text-xs p-2 rounded border ${
                            isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
                          }`}>
                            <span className="font-mono">{wallet}</span>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(wallet, 'Crypto Wallet')}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {actor.infrastructure.cryptocurrency_wallets.length > 5 && (
                          <p className="text-xs text-muted-foreground">+{actor.infrastructure.cryptocurrency_wallets.length - 5} more wallets</p>
                        )}
                      </div>
                    </div>
                  )}

                  {actor.infrastructure?.card_shops?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Card Shops</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {actor.infrastructure.card_shops.map((shop, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">{shop}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="targets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Target Sectors and Countries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Target Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {actor.targets?.primary?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Primary Targets</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {actor.targets.primary.map((target, index) => (
                          <Badge key={index} variant="destructive">{target}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {actor.targets?.secondary?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Secondary Targets</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {actor.targets.secondary.map((target, index) => (
                          <Badge key={index} variant="outline">{target}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {actor.targets?.geographic?.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Geographic Targets</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {actor.targets.geographic.map((location, index) => (
                          <Badge key={index} variant="secondary">{location}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attack Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Attack Patterns</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Attack Vectors</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {tactics.map((tactic, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">{tactic}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Techniques</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {techniques.slice(0, 10).map((technique, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{technique}</Badge>
                      ))}
                      {techniques.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{techniques.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Activity Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {actor.timeline?.milestones?.length > 0 ? (
                  <div className="space-y-4">
                    {actor.timeline.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{milestone}</span>
                            <Badge variant="outline" className="text-xs">
                              {actor.timeline.first_seen}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No timeline milestones available</p>
                )}

                {actor.timeline?.campaigns?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Known Campaigns</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {actor.timeline.campaigns.map((campaign, index) => (
                        <Badge key={index} variant="secondary">{campaign}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attribution" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Attribution Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {actor.attribution ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Attribution Methodology</label>
                      <p className="text-sm mt-1">{actor.attribution.attribution_methodology || 'Not specified'}</p>
                    </div>
                    
                    {actor.attribution.confidence_factors?.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Confidence Factors</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {actor.attribution.confidence_factors.map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">{factor}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {actor.attribution.attribution_sources?.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Attribution Sources</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {actor.attribution.attribution_sources.map((source, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{source}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No attribution information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
