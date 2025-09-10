// Threat Actor Intelligence Types

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  type: 'APT' | 'Cybercriminal' | 'Hacktivist' | 'Insider' | 'Nation-State' | 'Unknown';
  country?: string;
  region?: string;
  description: string;
  motivation: string[];
  capabilities: ThreatActorCapabilities;
  tactics: string[]; // MITRE ATT&CK tactics
  techniques: string[]; // MITRE ATT&CK techniques
  tools: string[];
  infrastructure: ThreatActorInfrastructure;
  targets: ThreatActorTargets;
  timeline: ThreatActorTimeline;
  attribution: ThreatActorAttribution;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-100
  lastSeen: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DORMANT' | 'DISRUPTED';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ThreatActorCapabilities {
  technical: {
    level: 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    specialties: string[];
    tools: string[];
    languages: string[];
  };
  operational: {
    persistence: number; // 0-100
    stealth: number; // 0-100
    sophistication: number; // 0-100
    resources: number; // 0-100
  };
  intelligence: {
    reconnaissance: number; // 0-100
    socialEngineering: number; // 0-100
    targetSelection: number; // 0-100
    operationalSecurity: number; // 0-100
  };
}

export interface ThreatActorInfrastructure {
  domains: string[];
  ipAddresses: string[];
  emailAddresses: string[];
  socialMediaAccounts: string[];
  cryptocurrencyWallets: string[];
  cloudServices: string[];
  hostingProviders: string[];
  registrars: string[];
  certificates: string[];
  malwareFamilies: string[];
  c2Servers: string[];
  lastUpdated: string;
}

export interface ThreatActorTargets {
  sectors: string[];
  countries: string[];
  organizations: string[];
  technologies: string[];
  attackVectors: string[];
  timePatterns: {
    preferredHours: number[];
    preferredDays: string[];
    timezone: string;
  };
  geographicFocus: {
    primary: string[];
    secondary: string[];
    excluded: string[];
  };
}

export interface ThreatActorTimeline {
  firstSeen: string;
  lastSeen: string;
  activityPeriods: ActivityPeriod[];
  campaigns: string[]; // Campaign IDs
  incidents: string[]; // Incident IDs
  milestones: TimelineMilestone[];
}

export interface ActivityPeriod {
  startDate: string;
  endDate?: string;
  activity: string;
  description: string;
  confidence: number;
  sources: string[];
}

export interface TimelineMilestone {
  date: string;
  event: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sources: string[];
}

export interface ThreatActorAttribution {
  confidence: number; // 0-100
  evidence: AttributionEvidence[];
  assessments: AttributionAssessment[];
  lastAssessed: string;
  assessor: string;
}

export interface AttributionEvidence {
  type: 'TECHNICAL' | 'BEHAVIORAL' | 'LINGUISTIC' | 'TEMPORAL' | 'GEOGRAPHIC';
  description: string;
  confidence: number;
  source: string;
  date: string;
  details: Record<string, any>;
}

export interface AttributionAssessment {
  assessor: string;
  assessment: string;
  confidence: number;
  date: string;
  methodology: string;
  evidence: string[];
}

// APT Campaign Types
export interface APTCampaign {
  id: string;
  name: string;
  aliases: string[];
  threatActors: string[]; // Threat actor IDs
  description: string;
  objectives: string[];
  targets: CampaignTargets;
  timeline: CampaignTimeline;
  techniques: CampaignTechniques;
  infrastructure: CampaignInfrastructure;
  indicators: CampaignIndicators;
  attribution: CampaignAttribution;
  impact: CampaignImpact;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'DISRUPTED';
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignTargets {
  sectors: string[];
  countries: string[];
  organizations: string[];
  individuals: string[];
  technologies: string[];
  attackVectors: string[];
  geographicScope: 'GLOBAL' | 'REGIONAL' | 'NATIONAL' | 'LOCAL';
}

export interface CampaignTimeline {
  startDate: string;
  endDate?: string;
  phases: CampaignPhase[];
  keyEvents: CampaignEvent[];
  milestones: CampaignMilestone[];
}

export interface CampaignPhase {
  name: string;
  startDate: string;
  endDate?: string;
  description: string;
  objectives: string[];
  techniques: string[];
  tools: string[];
  infrastructure: string[];
}

export interface CampaignEvent {
  date: string;
  event: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sources: string[];
  affectedTargets: string[];
}

export interface CampaignMilestone {
  date: string;
  milestone: string;
  description: string;
  significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string[];
}

export interface CampaignTechniques {
  initialAccess: string[];
  execution: string[];
  persistence: string[];
  privilegeEscalation: string[];
  defenseEvasion: string[];
  credentialAccess: string[];
  discovery: string[];
  lateralMovement: string[];
  collection: string[];
  commandAndControl: string[];
  exfiltration: string[];
  impact: string[];
}

export interface CampaignInfrastructure {
  domains: string[];
  ipAddresses: string[];
  emailAddresses: string[];
  socialMediaAccounts: string[];
  cloudServices: string[];
  hostingProviders: string[];
  c2Servers: string[];
  malwareFamilies: string[];
  tools: string[];
  certificates: string[];
}

export interface CampaignIndicators {
  iocs: IndicatorOfCompromise[];
  ttps: string[]; // Tactics, Techniques, and Procedures
  behaviors: string[];
  patterns: string[];
  signatures: string[];
}

export interface IndicatorOfCompromise {
  type: 'IP' | 'DOMAIN' | 'URL' | 'EMAIL' | 'FILE_HASH' | 'CERTIFICATE' | 'REGISTRY_KEY' | 'MUTEX';
  value: string;
  context: string;
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  sources: string[];
  tags: string[];
}

export interface CampaignAttribution {
  threatActors: string[];
  confidence: number;
  evidence: AttributionEvidence[];
  assessments: AttributionAssessment[];
  lastAssessed: string;
}

export interface CampaignImpact {
  affectedOrganizations: number;
  affectedIndividuals: number;
  dataBreached: {
    records: number;
    types: string[];
  };
  financialLoss: {
    estimated: number;
    currency: string;
  };
  operationalImpact: string[];
  reputationalImpact: string[];
}

// Threat Attribution Types
export interface ThreatAttribution {
  id: string;
  incidentId: string;
  threatActorId?: string;
  campaignId?: string;
  confidence: number;
  evidence: AttributionEvidence[];
  assessments: AttributionAssessment[];
  methodology: AttributionMethodology;
  timeline: AttributionTimeline;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';
  assessor: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttributionMethodology {
  name: string;
  version: string;
  description: string;
  steps: string[];
  tools: string[];
  dataSources: string[];
  validationCriteria: string[];
}

export interface AttributionTimeline {
  startDate: string;
  endDate?: string;
  phases: AttributionPhase[];
  milestones: AttributionMilestone[];
}

export interface AttributionPhase {
  name: string;
  startDate: string;
  endDate?: string;
  description: string;
  activities: string[];
  evidence: string[];
  confidence: number;
}

export interface AttributionMilestone {
  date: string;
  milestone: string;
  description: string;
  evidence: string[];
  confidence: number;
}

// Threat Actor Intelligence Response Types
export interface ThreatActorIntelligenceResponse {
  success: boolean;
  data: ThreatActorIntelligenceData;
  lastUpdated: string;
  metadata?: {
    totalActors: number;
    activeActors: number;
    highThreatActors: number;
    recentActivity: number;
  };
}

export interface ThreatActorIntelligenceData {
  threatActors: ThreatActor[];
  campaigns: APTCampaign[];
  attributions: ThreatAttribution[];
  statistics: ThreatActorStatistics;
  trends: ThreatActorTrends;
  correlations: ThreatActorCorrelations;
}

export interface ThreatActorStatistics {
  totalActors: number;
  activeActors: number;
  dormantActors: number;
  disruptedActors: number;
  byType: Record<string, number>;
  byCountry: Record<string, number>;
  byThreatLevel: Record<string, number>;
  bySector: Record<string, number>;
  averageCapability: number;
  topTechniques: Array<{ technique: string; count: number }>;
  topTools: Array<{ tool: string; count: number }>;
  recentActivity: number;
  attributionAccuracy: number;
}

export interface ThreatActorTrends {
  activityOverTime: Array<{ date: string; count: number }>;
  capabilityEvolution: Array<{ date: string; average: number }>;
  techniqueAdoption: Array<{ technique: string; trend: 'INCREASING' | 'DECREASING' | 'STABLE' }>;
  targetEvolution: Array<{ sector: string; trend: 'INCREASING' | 'DECREASING' | 'STABLE' }>;
  geographicShifts: Array<{ region: string; trend: 'INCREASING' | 'DECREASING' | 'STABLE' }>;
}

export interface ThreatActorCorrelations {
  actorRelationships: Array<{
    actor1: string;
    actor2: string;
    relationship: 'COLLABORATION' | 'COMPETITION' | 'SUCCESSION' | 'UNKNOWN';
    confidence: number;
    evidence: string[];
  }>;
  campaignOverlaps: Array<{
    campaign1: string;
    campaign2: string;
    overlap: number; // 0-100
    sharedTechniques: string[];
    sharedInfrastructure: string[];
  }>;
  techniqueCorrelations: Array<{
    technique1: string;
    technique2: string;
    correlation: number; // 0-100
    frequency: number;
  }>;
}

// Filters and Search Types
export interface ThreatActorFilters {
  type?: string[];
  country?: string[];
  threatLevel?: string[];
  status?: string[];
  sectors?: string[];
  techniques?: string[];
  tools?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  confidence?: {
    min: number;
    max: number;
  };
}

export interface ThreatActorSearchOptions {
  query?: string;
  filters?: ThreatActorFilters;
  sortBy?: 'name' | 'threatLevel' | 'lastSeen' | 'confidence';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
