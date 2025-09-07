export interface AlertRule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  conditions: AlertConditions;
  actions: AlertActions;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggerCount: number;
  cooldownMinutes: number; // Prevent spam
}

export interface AlertConditions {
  severity?: ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')[];
  affectedSoftware?: string[];
  cvssScore?: {
    min: number;
    max: number;
  };
  sources?: string[];
  tags?: string[];
  cweId?: string[];
  exploitAvailable?: boolean;
  patchAvailable?: boolean;
  kev?: boolean;
  trending?: boolean;
  publishedAfter?: string; // ISO date
  publishedBefore?: string; // ISO date
}

export interface AlertActions {
  email: boolean;
  push: boolean;
  webhook?: {
    url: string;
    method: 'POST' | 'PUT';
    headers?: Record<string, string>;
    template?: string;
  };
  slack?: {
    webhookUrl: string;
    channel?: string;
    username?: string;
  };
  discord?: {
    webhookUrl: string;
    username?: string;
  };
}

export interface AlertTrigger {
  id: string;
  alertRuleId: string;
  userId: string;
  vulnerabilityId: string;
  triggeredAt: string;
  conditions: AlertConditions;
  actions: AlertActions;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertTemplate {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'slack' | 'discord';
  subject?: string;
  template: string;
  variables: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertHistory {
  id: string;
  alertRuleId: string;
  userId: string;
  vulnerabilityId: string;
  triggeredAt: string;
  status: 'sent' | 'failed';
  actionType: 'email' | 'push' | 'webhook' | 'slack' | 'discord';
  error?: string;
  metadata?: Record<string, unknown>;
}
