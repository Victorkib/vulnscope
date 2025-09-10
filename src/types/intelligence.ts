/**
 * Threat Intelligence and Security Posture Types
 * 
 * This file defines the TypeScript interfaces for the Threat Landscape Analysis Dashboard
 * including threat intelligence, security posture assessment, and predictive analytics.
 */

export interface ThreatIntelligence {
  id: string;
  source: string;
  threatActor: string;
  attackVector: string;
  indicators: string[];
  confidence: number;
  lastSeen: string;
  geographicRegion: string;
  sector: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tags: string[];
  description?: string;
  references: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SecurityPosture {
  id: string;
  organizationId: string;
  riskScore: number;
  vulnerabilityExposure: number;
  patchCompliance: number;
  securityMaturity: number;
  lastAssessed: string;
  improvementAreas: string[];
  complianceStatus: {
    gdpr: boolean;
    sox: boolean;
    hipaa: boolean;
    pci: boolean;
    iso27001: boolean;
    nist: boolean;
  };
  metrics: {
    totalVulnerabilities: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    mediumVulnerabilities: number;
    lowVulnerabilities: number;
    patchedVulnerabilities: number;
    averagePatchTime: number;
    exposureScore: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  recommendations: SecurityRecommendation[];
  trends: {
    riskTrend: 'improving' | 'stable' | 'declining';
    patchTrend: 'improving' | 'stable' | 'declining';
    exposureTrend: 'improving' | 'stable' | 'declining';
  };
}

export interface SecurityRecommendation {
  id: string;
  category: 'patch' | 'configuration' | 'monitoring' | 'training' | 'policy';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  impact: string;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  resources: string[];
  relatedVulnerabilities: string[];
}

export interface PredictiveAnalytics {
  id: string;
  vulnerabilityId: string;
  predictedRisk: number;
  confidence: number;
  factors: string[];
  timeframe: string;
  statisticalModel: string;
  predictionDate: string;
  actualRisk?: number;
  accuracy?: number;
  trends: {
    riskIncrease: number;
    probabilityOfExploit: number;
    expectedImpact: number;
  };
}

export interface ThreatLandscapeData {
  global: {
    totalThreats: number;
    activeThreats: number;
    newThreats: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  geographic: {
    region: string;
    threatCount: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    topThreatActors: string[];
    topAttackVectors: string[];
  }[];
  sector: {
    sector: string;
    threatCount: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    vulnerabilities: number;
    avgPatchTime: number;
  }[];
  temporal: {
    date: string;
    threatCount: number;
    newThreats: number;
    resolvedThreats: number;
  }[];
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  type: 'APT' | 'Cybercriminal' | 'Hacktivist' | 'Insider' | 'Nation-State' | 'Unknown';
  country: string;
  motivation: string[];
  techniques: string[];
  targets: string[];
  activity: {
    firstSeen: string;
    lastSeen: string;
    frequency: 'LOW' | 'MEDIUM' | 'HIGH';
    sophistication: 'LOW' | 'MEDIUM' | 'HIGH' | 'ADVANCED';
  };
  relatedVulnerabilities: string[];
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AttackVector {
  id: string;
  name: string;
  category: 'Network' | 'Web' | 'Mobile' | 'Social' | 'Physical' | 'Supply Chain';
  technique: string;
  description: string;
  prevalence: number;
  effectiveness: number;
  difficulty: 'LOW' | 'MEDIUM' | 'HIGH';
  detection: 'EASY' | 'MEDIUM' | 'HARD';
  mitigation: string[];
  examples: string[];
  relatedVulnerabilities: string[];
  threatActors: string[];
}

export interface ZeroDayTracking {
  id: string;
  vulnerabilityId: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedSoftware: string[];
  discoveryDate: string;
  disclosureDate?: string;
  patchDate?: string;
  exploitAvailable: boolean;
  exploitInTheWild: boolean;
  threatActors: string[];
  attackVectors: string[];
  indicators: string[];
  status: 'ACTIVE' | 'PATCHED' | 'MITIGATED' | 'RESOLVED';
  confidence: number;
  sources: string[];
}

export interface IntelligenceAlert {
  id: string;
  type: 'THREAT_ACTOR' | 'ATTACK_VECTOR' | 'ZERO_DAY' | 'SECURITY_POSTURE' | 'COMPLIANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  source: string;
  confidence: number;
  affectedSystems?: string[];
  recommendedActions: string[];
  relatedIntelligence: string[];
  createdAt: string;
  expiresAt?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface IntelligencePreferences {
  threatLandscapeView: 'global' | 'regional' | 'sector' | 'temporal';
  threatActorFocus: string[];
  attackVectorFilter: string[];
  intelligenceAlerts: boolean;
  threatHeatMapStyle: 'geographic' | 'sector' | 'temporal';
  securityPostureMetrics: string[];
  complianceTracking: string[];
  predictiveAnalytics: boolean;
  zeroDayTracking: boolean;
  alertFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  notificationChannels: ('email' | 'push' | 'webhook')[];
  customFilters: {
    severity: string[];
    sectors: string[];
    regions: string[];
    threatActors: string[];
  };
}

export interface IntelligenceStats {
  totalThreats: number;
  activeThreats: number;
  newThreats: number;
  resolvedThreats: number;
  threatActors: number;
  attackVectors: number;
  zeroDays: number;
  securityPostureScore: number;
  complianceScore: number;
  predictionAccuracy: number;
  lastUpdated: string;
}

export interface IntelligenceDashboardData {
  threatLandscape: ThreatLandscapeData;
  securityPosture: SecurityPosture;
  threatActors: ThreatActor[];
  attackVectors: AttackVector[];
  zeroDayTracking: ZeroDayTracking[];
  predictiveAnalytics: PredictiveAnalytics[];
  intelligenceAlerts: IntelligenceAlert[];
  stats: IntelligenceStats;
  lastUpdated: string;
}

// API Response Types
export interface ThreatLandscapeResponse {
  success: boolean;
  data: ThreatLandscapeData;
  lastUpdated: string;
  error?: string;
}

export interface SecurityPostureResponse {
  success: boolean;
  data: SecurityPosture;
  lastUpdated: string;
  error?: string;
}

export interface IntelligenceAlertsResponse {
  success: boolean;
  data: IntelligenceAlert[];
  total: number;
  lastUpdated: string;
  error?: string;
}

export interface PredictiveAnalyticsResponse {
  success: boolean;
  data: PredictiveAnalytics[];
  accuracy: number;
  lastUpdated: string;
  error?: string;
}

// Filter and Query Types
export interface IntelligenceFilters {
  severity?: string[];
  sectors?: string[];
  regions?: string[];
  threatActors?: string[];
  attackVectors?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  confidence?: {
    min: number;
    max: number;
  };
}

export interface IntelligenceQuery {
  filters?: IntelligenceFilters;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
