import type { AlertRule, AlertTrigger, AlertConditions, Vulnerability } from '@/types/alert';
import type { Vulnerability as VulnType } from '@/types/vulnerability';
import { getDatabase } from './mongodb';

export class AlertService {
  private static instance: AlertService;

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  /**
   * Check if we're running in a server context
   */
  private isServerContext(): boolean {
    return typeof window === 'undefined';
  }

  /**
   * Check if a vulnerability matches alert conditions
   */
  matchesConditions(vulnerability: VulnType, conditions: AlertConditions): boolean {
    // Check severity
    if (conditions.severity && !conditions.severity.includes(vulnerability.severity)) {
      return false;
    }

    // Check CVSS score
    if (conditions.cvssScore) {
      if (vulnerability.cvssScore < conditions.cvssScore.min || 
          vulnerability.cvssScore > conditions.cvssScore.max) {
        return false;
      }
    }

    // Check affected software
    if (conditions.affectedSoftware && conditions.affectedSoftware.length > 0) {
      const hasMatchingSoftware = vulnerability.affectedSoftware.some(software =>
        conditions.affectedSoftware!.some(condition =>
          software.toLowerCase().includes(condition.toLowerCase())
        )
      );
      if (!hasMatchingSoftware) {
        return false;
      }
    }

    // Check tags
    if (conditions.tags && conditions.tags.length > 0) {
      const hasMatchingTag = vulnerability.tags.some(tag =>
        conditions.tags!.some(condition =>
          tag.toLowerCase().includes(condition.toLowerCase())
        )
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Check exploit availability
    if (conditions.exploitAvailable !== undefined && 
        vulnerability.exploitAvailable !== conditions.exploitAvailable) {
      return false;
    }

    // Check patch availability
    if (conditions.patchAvailable !== undefined && 
        vulnerability.patchAvailable !== conditions.patchAvailable) {
      return false;
    }

    // Check KEV status
    if (conditions.kev !== undefined && 
        vulnerability.kev !== conditions.kev) {
      return false;
    }

    // Check published date range
    if (conditions.publishedAfter) {
      const publishedDate = new Date(vulnerability.publishedDate);
      const afterDate = new Date(conditions.publishedAfter);
      if (publishedDate < afterDate) {
        return false;
      }
    }

    if (conditions.publishedBefore) {
      const publishedDate = new Date(vulnerability.publishedDate);
      const beforeDate = new Date(conditions.publishedBefore);
      if (publishedDate > beforeDate) {
        return false;
      }
    }

    return true;
  }

  /**
   * Process a new vulnerability against all active alert rules
   */
  async processVulnerability(vulnerability: VulnType): Promise<void> {
    try {
      let alertRules: AlertRule[] = [];

      if (this.isServerContext()) {
        // Server-side: directly query the database
        const db = await getDatabase();
        const collection = db.collection<AlertRule>('alert_rules');
        alertRules = await collection.find({ isActive: true }).toArray();
      } else {
        // Client-side: make HTTP request
        const response = await fetch('/api/alerts/rules?isActive=true');
        if (!response.ok) return;
        alertRules = await response.json();
      }

      // Limit the number of rules to process to prevent system overload
      const maxRules = 10;
      const rulesToProcess = alertRules.slice(0, maxRules);

      // Check each rule
      for (const rule of rulesToProcess) {
        if (this.matchesConditions(vulnerability, rule.conditions)) {
          await this.triggerAlert(rule, vulnerability);
        }
      }
    } catch (error) {
      console.error('Error processing vulnerability for alerts:', error);
    }
  }

  /**
   * Trigger an alert for a matching vulnerability
   */
  async triggerAlert(rule: AlertRule, vulnerability: VulnType): Promise<void> {
    try {
      // Check cooldown
      if (rule.lastTriggered) {
        const lastTriggered = new Date(rule.lastTriggered);
        const cooldownEnd = new Date(lastTriggered.getTime() + (rule.cooldownMinutes * 60 * 1000));
        if (new Date() < cooldownEnd) {
          return; // Still in cooldown
        }
      }

      // Create alert trigger record
      const trigger: AlertTrigger = {
        id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertRuleId: rule.id,
        userId: rule.userId,
        vulnerabilityId: vulnerability.cveId,
        triggeredAt: new Date().toISOString(),
        conditions: rule.conditions,
        actions: rule.actions,
        status: 'pending',
        attempts: 0,
      };

      // Save trigger record
      if (this.isServerContext()) {
        // Server-side: directly save to database
        const db = await getDatabase();
        const triggersCollection = db.collection<AlertTrigger>('alert_triggers');
        const rulesCollection = db.collection<AlertRule>('alert_rules');
        
        await triggersCollection.insertOne(trigger);
        
        // Update rule trigger count and last triggered
        await rulesCollection.updateOne(
          { id: rule.id },
          {
            $set: {
              lastTriggered: new Date().toISOString(),
              triggerCount: rule.triggerCount + 1,
            }
          }
        );
      } else {
        // Client-side: make HTTP requests
        await fetch('/api/alerts/triggers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trigger),
        });

        await fetch(`/api/alerts/rules/${rule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastTriggered: new Date().toISOString(),
            triggerCount: rule.triggerCount + 1,
          }),
        });
      }

      // Execute alert actions
      await this.executeAlertActions(trigger, vulnerability);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  /**
   * Execute alert actions (email, webhook, etc.)
   */
  async executeAlertActions(trigger: AlertTrigger, vulnerability: VulnType): Promise<void> {
    const actions = trigger.actions;

    // Send email notification
    if (actions.email) {
      await this.sendEmailAlert(trigger, vulnerability);
    }

    // Send push notification
    if (actions.push) {
      await this.sendPushAlert(trigger, vulnerability);
    }

    // Send webhook
    if (actions.webhook) {
      await this.sendWebhookAlert(trigger, vulnerability, actions.webhook);
    }

    // Send Slack notification
    if (actions.slack) {
      await this.sendSlackAlert(trigger, vulnerability, actions.slack);
    }

    // Send Discord notification
    if (actions.discord) {
      await this.sendDiscordAlert(trigger, vulnerability, actions.discord);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(trigger: AlertTrigger, vulnerability: VulnType): Promise<void> {
    try {
      // Get alert rule name for email template
      let alertRuleName = 'Custom Alert Rule';
      try {
        if (this.isServerContext()) {
          const db = await getDatabase();
          const rulesCollection = db.collection<AlertRule>('alert_rules');
          const rule = await rulesCollection.findOne({ id: trigger.alertRuleId });
          if (rule) {
            alertRuleName = rule.name;
          }
        }
      } catch (ruleError) {
        console.error('Error fetching alert rule name:', ruleError);
      }

      // Always make HTTP request for external services
      const baseUrl = this.isServerContext() ? process.env.NEXTAUTH_URL || 'http://localhost:3000' : '';
      await fetch(`${baseUrl}/api/alerts/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerId: trigger.id,
          vulnerability,
          userId: trigger.userId,
          alertRuleName,
        }),
      });
    } catch (error) {
      console.error('Error sending email alert:', error);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushAlert(trigger: AlertTrigger, vulnerability: VulnType): Promise<void> {
    try {
      const baseUrl = this.isServerContext() ? process.env.NEXTAUTH_URL || 'http://localhost:3000' : '';
      await fetch(`${baseUrl}/api/alerts/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerId: trigger.id,
          vulnerability,
          userId: trigger.userId,
        }),
      });
    } catch (error) {
      console.error('Error sending push alert:', error);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(
    trigger: AlertTrigger, 
    vulnerability: VulnType, 
    webhook: { url: string; method: string; headers?: Record<string, string>; template?: string }
  ): Promise<void> {
    try {
      const baseUrl = this.isServerContext() ? process.env.NEXTAUTH_URL || 'http://localhost:3000' : '';
      await fetch(`${baseUrl}/api/alerts/send-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerId: trigger.id,
          vulnerability,
          webhook,
        }),
      });
    } catch (error) {
      console.error('Error sending webhook alert:', error);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(
    trigger: AlertTrigger, 
    vulnerability: VulnType, 
    slack: { webhookUrl: string; channel?: string; username?: string }
  ): Promise<void> {
    try {
      const baseUrl = this.isServerContext() ? process.env.NEXTAUTH_URL || 'http://localhost:3000' : '';
      await fetch(`${baseUrl}/api/alerts/send-slack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerId: trigger.id,
          vulnerability,
          slack,
        }),
      });
    } catch (error) {
      console.error('Error sending Slack alert:', error);
    }
  }

  /**
   * Send Discord alert
   */
  private async sendDiscordAlert(
    trigger: AlertTrigger, 
    vulnerability: VulnType, 
    discord: { webhookUrl: string; username?: string }
  ): Promise<void> {
    try {
      const baseUrl = this.isServerContext() ? process.env.NEXTAUTH_URL || 'http://localhost:3000' : '';
      await fetch(`${baseUrl}/api/alerts/send-discord`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerId: trigger.id,
          vulnerability,
          discord,
        }),
      });
    } catch (error) {
      console.error('Error sending Discord alert:', error);
    }
  }
}

// Export singleton instance
export const alertService = AlertService.getInstance();
