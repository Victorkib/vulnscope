import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type { Vulnerability } from '@/types/vulnerability';

export interface EmailConfig {
  primaryProvider: 'resend' | 'smtp' | 'none';
  secondaryProvider: 'resend' | 'smtp' | 'none';
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
  enableFallback: boolean;
  maxRetries: number;
  retryDelayMs: number;
  rateLimitPerSecond: number; // Maximum emails per second
  batchSize: number; // Maximum emails to send in one batch
  batchDelayMs: number; // Delay between batches
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  provider: 'primary' | 'secondary' | 'none';
  error?: string;
  retryCount?: number;
  deliveryTime?: number;
}

export interface EmailQueueItem {
  id: string;
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  lastAttempt?: string;
  errors: string[];
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private static instance: EmailService;
  private config: EmailConfig;
  private primaryResend?: Resend;
  private secondaryResend?: Resend;
  private primarySmtpTransporter?: nodemailer.Transporter;
  private secondarySmtpTransporter?: nodemailer.Transporter;
  private emailQueue: EmailQueueItem[] = [];
  private isProcessingQueue = false;
  private deliveryStats = {
    primary: { success: 0, failed: 0, lastUsed: null as Date | null },
    secondary: { success: 0, failed: 0, lastUsed: null as Date | null },
  };
  private rateLimiter = {
    lastSent: 0,
    sentCount: 0,
    windowStart: Date.now(),
  };

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  constructor() {
    this.config = this.loadConfig();
    this.initializeProviders();
    this.startQueueProcessor();
  }

  private loadConfig(): EmailConfig {
    return {
      primaryProvider: (process.env.EMAIL_PRIMARY_PROVIDER as 'resend' | 'smtp' | 'none') || 
                      (process.env.EMAIL_PROVIDER as 'resend' | 'smtp' | 'none') || 'none',
      secondaryProvider: (process.env.EMAIL_SECONDARY_PROVIDER as 'resend' | 'smtp' | 'none') || 'none',
      resendApiKey: process.env.RESEND_API_KEY,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER,
      smtpPassword: process.env.SMTP_PASSWORD,
      fromEmail: process.env.FROM_EMAIL || 'noreply@vulnscope.com',
      fromName: process.env.FROM_NAME || 'VulnScope',
      enableFallback: process.env.EMAIL_ENABLE_FALLBACK !== 'false',
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3'),
      retryDelayMs: parseInt(process.env.EMAIL_RETRY_DELAY_MS || '5000'),
      rateLimitPerSecond: parseInt(process.env.EMAIL_RATE_LIMIT_PER_SECOND || '1'), // Default 1 email per second
      batchSize: parseInt(process.env.EMAIL_BATCH_SIZE || '5'), // Default 5 emails per batch
      batchDelayMs: parseInt(process.env.EMAIL_BATCH_DELAY_MS || '1000'), // Default 1 second between batches
    };
  }

  private initializeProviders(): void {
    try {
      // Initialize primary provider
      if (this.config.primaryProvider === 'resend' && this.config.resendApiKey) {
        this.primaryResend = new Resend(this.config.resendApiKey);
        console.log('[EMAIL SERVICE] Primary Resend provider initialized');
      } else if (this.config.primaryProvider === 'smtp' && this.config.smtpHost && this.config.smtpUser && this.config.smtpPassword) {
        this.primarySmtpTransporter = nodemailer.createTransport({
          host: this.config.smtpHost,
          port: this.config.smtpPort,
          secure: this.config.smtpPort === 465,
          auth: {
            user: this.config.smtpUser,
            pass: this.config.smtpPassword,
          },
        });
        console.log('[EMAIL SERVICE] Primary SMTP provider initialized');
      } else {
        console.log('[EMAIL SERVICE] Primary provider not configured or missing credentials');
      }

      // Initialize secondary provider (if different from primary)
      if (this.config.secondaryProvider !== 'none' && this.config.secondaryProvider !== this.config.primaryProvider) {
        if (this.config.secondaryProvider === 'resend' && this.config.resendApiKey) {
          this.secondaryResend = new Resend(this.config.resendApiKey);
          console.log('[EMAIL SERVICE] Secondary Resend provider initialized');
        } else if (this.config.secondaryProvider === 'smtp' && this.config.smtpHost && this.config.smtpUser && this.config.smtpPassword) {
          this.secondarySmtpTransporter = nodemailer.createTransport({
            host: this.config.smtpHost,
            port: this.config.smtpPort,
            secure: this.config.smtpPort === 465,
            auth: {
              user: this.config.smtpUser,
              pass: this.config.smtpPassword,
            },
          });
          console.log('[EMAIL SERVICE] Secondary SMTP provider initialized');
        } else {
          console.log('[EMAIL SERVICE] Secondary provider not configured or missing credentials');
        }
      }
    } catch (error) {
      console.error('[EMAIL SERVICE] Error initializing providers:', error);
      // Don't throw - allow the service to continue with limited functionality
    }
  }

  private startQueueProcessor(): void {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    setInterval(() => {
      this.processEmailQueue();
    }, 10000); // Process queue every 10 seconds
  }

  private async processEmailQueue(): Promise<void> {
    if (this.emailQueue.length === 0) return;

    const itemsToProcess = this.emailQueue.filter(item => 
      item.retryCount < item.maxRetries &&
      (!item.lastAttempt || Date.now() - new Date(item.lastAttempt).getTime() > this.config.retryDelayMs)
    );

    for (const item of itemsToProcess) {
      try {
        const result = await this.sendEmailInternal(
          item.toEmail,
          item.subject,
          item.html,
          item.text,
          item.priority
        );

        if (result.success) {
          // Remove from queue on success
          this.emailQueue = this.emailQueue.filter(q => q.id !== item.id);
          console.log(`✅ Queued email sent successfully: ${item.id}`);
        } else {
          // Update retry count and error
          item.retryCount++;
          item.lastAttempt = new Date().toISOString();
          item.errors.push(result.error || 'Unknown error');
          
          if (item.retryCount >= item.maxRetries) {
            console.error(`❌ Email failed after ${item.maxRetries} attempts: ${item.id}`, item.errors);
            // Remove from queue after max retries
            this.emailQueue = this.emailQueue.filter(q => q.id !== item.id);
          }
        }
      } catch (error) {
        console.error(`Error processing queued email ${item.id}:`, error);
      }
    }
  }

  /**
   * Send team invitation email
   */
  async sendTeamInvitation(
    toEmail: string,
    teamName: string,
    inviterName: string,
    role: string,
    teamDescription?: string,
    invitationUrl?: string
  ): Promise<EmailDeliveryResult> {
    try {
      if (this.config.primaryProvider === 'none') {
        console.log(`[EMAIL SERVICE] Email disabled - would send team invitation for ${teamName} to ${toEmail}`);
        return { success: true, messageId: 'disabled', provider: 'none' };
      }

      const template = this.generateTeamInvitationTemplate(teamName, inviterName, role, teamDescription, invitationUrl);
      
      // Try primary provider first
      const primaryResult = await this.sendEmailInternal(
        toEmail,
        template.subject,
        template.html,
        template.text,
        'high' // Team invitations are high priority
      );

      if (primaryResult.success) {
        this.deliveryStats.primary.success++;
        this.deliveryStats.primary.lastUsed = new Date();
        return {
          ...primaryResult,
          provider: 'primary',
          deliveryTime: Date.now()
        };
      }

      // If primary fails and fallback is enabled, try secondary
      if (this.config.enableFallback && this.config.secondaryProvider !== 'none') {
        console.log(`⚠️ Primary email provider failed, trying secondary provider: ${primaryResult.error}`);
        
        const secondaryResult = await this.sendEmailInternal(
          toEmail,
          template.subject,
          template.html,
          template.text,
          'high',
          'secondary'
        );

        if (secondaryResult.success) {
          this.deliveryStats.secondary.success++;
          this.deliveryStats.secondary.lastUsed = new Date();
          return {
            ...secondaryResult,
            provider: 'secondary',
            deliveryTime: Date.now()
          };
        }

        // Both providers failed, queue for retry
        this.queueEmail(toEmail, template.subject, template.html, template.text, 'high');
        return {
          success: false,
          provider: 'secondary',
          error: `Both providers failed. Primary: ${primaryResult.error}, Secondary: ${secondaryResult.error}. Queued for retry.`,
          deliveryTime: Date.now()
        };
      }

      // Primary failed, no fallback
      this.deliveryStats.primary.failed++;
      return {
        success: false,
        provider: 'primary',
        error: primaryResult.error,
        deliveryTime: Date.now()
      };

    } catch (error) {
      console.error('Error sending team invitation email:', error);
      return { 
        success: false, 
        provider: 'primary',
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveryTime: Date.now()
      };
    }
  }

  /**
   * Send vulnerability shared notification email
   */
  async sendVulnerabilitySharedNotification(
    toEmail: string,
    vulnerability: Vulnerability,
    sharerName: string,
    message?: string,
    permissions?: {
      canView: boolean;
      canComment: boolean;
      canEdit: boolean;
      canShare: boolean;
    }
  ): Promise<EmailDeliveryResult> {
    try {
      if (this.config.primaryProvider === 'none') {
        console.log(`[EMAIL SERVICE] Email disabled - would send vulnerability shared notification for ${vulnerability.cveId} to ${toEmail}`);
        return { success: true, messageId: 'disabled', provider: 'none' };
      }

      const template = this.generateVulnerabilitySharedTemplate(vulnerability, sharerName, message, permissions);
      
      // Try primary provider first
      const primaryResult = await this.sendEmailInternal(
        toEmail,
        template.subject,
        template.html,
        template.text,
        'medium' // Vulnerability sharing is medium priority
      );

      if (primaryResult.success) {
        this.deliveryStats.primary.success++;
        this.deliveryStats.primary.lastUsed = new Date();
        return {
          ...primaryResult,
          provider: 'primary',
          deliveryTime: Date.now()
        };
      }

      // If primary fails and fallback is enabled, try secondary
      if (this.config.enableFallback && this.config.secondaryProvider !== 'none') {
        console.log(`⚠️ Primary email provider failed, trying secondary provider: ${primaryResult.error}`);
        
        const secondaryResult = await this.sendEmailInternal(
          toEmail,
          template.subject,
          template.html,
          template.text,
          'medium',
          'secondary'
        );

        if (secondaryResult.success) {
          this.deliveryStats.secondary.success++;
          this.deliveryStats.secondary.lastUsed = new Date();
          return {
            ...secondaryResult,
            provider: 'secondary',
            deliveryTime: Date.now()
          };
        }

        // Both providers failed, queue for retry
        this.queueEmail(toEmail, template.subject, template.html, template.text, 'medium');
        return {
          success: false,
          provider: 'secondary',
          error: `Both providers failed. Primary: ${primaryResult.error}, Secondary: ${secondaryResult.error}. Queued for retry.`,
          deliveryTime: Date.now()
        };
      }

      // Primary failed, no fallback
      this.deliveryStats.primary.failed++;
      return {
        success: false,
        provider: 'primary',
        error: primaryResult.error,
        deliveryTime: Date.now()
      };

    } catch (error) {
      console.error('Error sending vulnerability shared notification email:', error);
      return { 
        success: false, 
        provider: 'primary',
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveryTime: Date.now()
      };
    }
  }

  /**
   * Send vulnerability alert email with dual provider support
   */
  async sendVulnerabilityAlert(
    toEmail: string,
    vulnerability: Vulnerability,
    alertRuleName: string,
    userName?: string
  ): Promise<EmailDeliveryResult> {
    try {
      if (this.config.primaryProvider === 'none') {
        console.log(`[EMAIL SERVICE] Email disabled - would send alert for ${vulnerability.cveId} to ${toEmail}`);
        return { success: true, messageId: 'disabled', provider: 'none' };
      }

      const template = this.generateVulnerabilityAlertTemplate(vulnerability, alertRuleName, userName);
      
      // Try primary provider first
      const primaryResult = await this.sendEmailInternal(
        toEmail,
        template.subject,
        template.html,
        template.text,
        'high' // Vulnerability alerts are high priority
      );

      if (primaryResult.success) {
        this.deliveryStats.primary.success++;
        this.deliveryStats.primary.lastUsed = new Date();
        return {
          ...primaryResult,
          provider: 'primary',
          deliveryTime: Date.now()
        };
      }

      // If primary fails and fallback is enabled, try secondary
      if (this.config.enableFallback && this.config.secondaryProvider !== 'none') {
        console.log(`⚠️ Primary email provider failed, trying secondary provider: ${primaryResult.error}`);
        
        const secondaryResult = await this.sendEmailInternal(
          toEmail,
          template.subject,
          template.html,
          template.text,
          'high',
          'secondary'
        );

        if (secondaryResult.success) {
          this.deliveryStats.secondary.success++;
          this.deliveryStats.secondary.lastUsed = new Date();
          return {
            ...secondaryResult,
            provider: 'secondary',
            deliveryTime: Date.now()
          };
        }

        // Both providers failed, queue for retry
        this.queueEmail(toEmail, template.subject, template.html, template.text, 'high');
        return {
          success: false,
          provider: 'secondary',
          error: `Both providers failed. Primary: ${primaryResult.error}, Secondary: ${secondaryResult.error}. Queued for retry.`,
          deliveryTime: Date.now()
        };
      }

      // Primary failed, no fallback
      this.deliveryStats.primary.failed++;
      return {
        success: false,
        provider: 'primary',
        error: primaryResult.error,
        deliveryTime: Date.now()
      };

    } catch (error) {
      console.error('Error sending vulnerability alert email:', error);
      return { 
        success: false, 
        provider: 'primary',
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveryTime: Date.now()
      };
    }
  }


  /**
   * Enforce rate limiting to prevent API rate limit errors
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = 1000; // 1 second window
    
    // Reset window if needed
    if (now - this.rateLimiter.windowStart >= windowDuration) {
      this.rateLimiter.windowStart = now;
      this.rateLimiter.sentCount = 0;
    }
    
    // Check if we've exceeded the rate limit
    if (this.rateLimiter.sentCount >= this.config.rateLimitPerSecond) {
      const waitTime = windowDuration - (now - this.rateLimiter.windowStart);
      if (waitTime > 0) {
        console.log(`[EMAIL SERVICE] Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Reset after waiting
        this.rateLimiter.windowStart = Date.now();
        this.rateLimiter.sentCount = 0;
      }
    }
    
    // Increment sent count
    this.rateLimiter.sentCount++;
    this.rateLimiter.lastSent = now;
  }

  /**
   * Internal email sending method with provider selection
   */
  private async sendEmailInternal(
    toEmail: string,
    subject: string,
    html: string,
    text: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    provider: 'primary' | 'secondary' = 'primary'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const startTime = Date.now();
    
    // Rate limiting check
    await this.enforceRateLimit();
    
    try {
      if (provider === 'primary') {
        if (this.config.primaryProvider === 'resend' && this.primaryResend) {
          const result = await this.primaryResend.emails.send({
            from: `${this.config.fromName} <${this.config.fromEmail}>`,
            to: [toEmail],
            subject,
            html,
            text,
          });

          if (result.error) {
            console.error('[EMAIL SERVICE] Resend API error details:', {
              error: result.error,
              message: result.error.message,
              name: result.error.name,
              toEmail,
              fromEmail: this.config.fromEmail
            });
            throw new Error(`Resend API Error: ${result.error.message || 'Unknown error'}`);
          }

          return { success: true, messageId: result.data?.id };
        } else if (this.config.primaryProvider === 'smtp' && this.primarySmtpTransporter) {
          const result = await this.primarySmtpTransporter.sendMail({
            from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
            to: toEmail,
            subject,
            html,
            text,
          });

          return { success: true, messageId: result.messageId };
        }
      } else if (provider === 'secondary') {
        if (this.config.secondaryProvider === 'resend' && this.secondaryResend) {
          const result = await this.secondaryResend.emails.send({
            from: `${this.config.fromName} <${this.config.fromEmail}>`,
            to: [toEmail],
            subject,
            html,
            text,
          });

          if (result.error) {
            console.error('[EMAIL SERVICE] Secondary Resend API error details:', {
              error: result.error,
              message: result.error.message,
              name: result.error.name,
              toEmail,
              fromEmail: this.config.fromEmail
            });
            throw new Error(`Secondary Resend API Error: ${result.error.message || 'Unknown error'}`);
          }

          return { success: true, messageId: result.data?.id };
        } else if (this.config.secondaryProvider === 'smtp' && this.secondarySmtpTransporter) {
          const result = await this.secondarySmtpTransporter.sendMail({
            from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
            to: toEmail,
            subject,
            html,
            text,
          });

          return { success: true, messageId: result.messageId };
        }
      }

      throw new Error(`No ${provider} email provider configured`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Error sending email via ${provider} provider (${duration}ms):`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Queue email for retry
   */
  private queueEmail(
    toEmail: string,
    subject: string,
    html: string,
    text: string,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): void {
    const queueItem: EmailQueueItem = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      toEmail,
      subject,
      html,
      text,
      priority,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      createdAt: new Date().toISOString(),
      errors: [],
    };

    this.emailQueue.push(queueItem);
    console.log(`📧 Email queued for retry: ${queueItem.id} (${toEmail})`);
  }

  /**
   * Generate vulnerability shared notification email template
   */
  private generateVulnerabilitySharedTemplate(
    vulnerability: Vulnerability,
    sharerName: string,
    message?: string,
    permissions?: {
      canView: boolean;
      canComment: boolean;
      canEdit: boolean;
      canShare: boolean;
    }
  ): EmailTemplate {
    const severityColor = this.getSeverityColor(vulnerability.severity);
    const severityIcon = this.getSeverityIcon(vulnerability.severity);
    const subject = `🔗 ${sharerName} shared a vulnerability with you: ${vulnerability.cveId}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .vuln-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${severityColor}; }
    .severity-badge { display: inline-block; background: ${severityColor}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .permissions { margin: 20px 0; }
    .permission { margin: 8px 0; padding: 8px; background: #e9ecef; border-radius: 6px; display: flex; align-items: center; }
    .permission-icon { margin-right: 10px; }
    .cta-button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .message-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🔗 Vulnerability Shared</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${sharerName} has shared a vulnerability with you</p>
    </div>
    
    <div class="content">
      <p>Hello,</p>
      
      <p><strong>${sharerName}</strong> has shared a vulnerability with you on VulnScope for your review and collaboration.</p>
      
      ${message ? `
      <div class="message-box">
        <strong>Message from ${sharerName}:</strong><br>
        "${message}"
      </div>
      ` : ''}
      
      <div class="vuln-card">
        <h2 style="margin-top: 0; color: ${severityColor};">${vulnerability.cveId}</h2>
        <p style="font-size: 18px; margin: 10px 0;">${vulnerability.title}</p>
        
        <div style="margin: 15px 0;">
          <span class="severity-badge">${severityIcon} ${vulnerability.severity}</span>
          ${vulnerability.cvssScore ? `<span style="margin-left: 10px; color: #666;">CVSS: ${vulnerability.cvssScore}</span>` : ''}
        </div>
        
        <div style="margin: 15px 0;">
          <strong>Published:</strong> ${new Date(vulnerability.publishedDate).toLocaleDateString()}
        </div>
        
        ${vulnerability.affectedSoftware.length > 0 ? `
        <div style="margin: 15px 0;">
          <strong>Affected Software:</strong> ${vulnerability.affectedSoftware.join(', ')}
        </div>
        ` : ''}
        
        <div style="margin: 15px 0;">
          <strong>Description:</strong><br>
          <span style="color: #666;">${vulnerability.description}</span>
        </div>
      </div>
      
      ${permissions ? `
      <div class="permissions">
        <h3 style="color: #28a745;">Your Permissions:</h3>
        ${permissions.canView ? '<div class="permission"><span class="permission-icon">👁️</span> <strong>View</strong> - You can view this vulnerability</div>' : ''}
        ${permissions.canComment ? '<div class="permission"><span class="permission-icon">💬</span> <strong>Comment</strong> - You can add comments and participate in discussions</div>' : ''}
        ${permissions.canEdit ? '<div class="permission"><span class="permission-icon">✏️</span> <strong>Edit</strong> - You can edit vulnerability details</div>' : ''}
        ${permissions.canShare ? '<div class="permission"><span class="permission-icon">🔗</span> <strong>Share</strong> - You can share this vulnerability with others</div>' : ''}
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vulnerabilities/${vulnerability.cveId}" class="cta-button">
          View Vulnerability Details
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        This vulnerability was shared with you by ${sharerName}. You can collaborate on this vulnerability, 
        add comments, and discuss it with your team members.
      </p>
    </div>
    
    <div class="footer">
      <p>VulnScope - Vulnerability Intelligence Platform</p>
      <p>This vulnerability was shared by ${sharerName}. If you didn't expect this, please contact them directly.</p>
    </div>
  </div>
</body>
</html>`;

    const text = `
VULNERABILITY SHARED - VulnScope

Hello,

${sharerName} has shared a vulnerability with you on VulnScope for your review and collaboration.

${message ? `Message from ${sharerName}: "${message}"` : ''}

Vulnerability Details:
CVE ID: ${vulnerability.cveId}
Title: ${vulnerability.title}
Severity: ${vulnerability.severity}${vulnerability.cvssScore ? ` (CVSS: ${vulnerability.cvssScore})` : ''}
Published: ${new Date(vulnerability.publishedDate).toLocaleDateString()}
${vulnerability.affectedSoftware.length > 0 ? `Affected Software: ${vulnerability.affectedSoftware.join(', ')}` : ''}

Description:
${vulnerability.description}

${permissions ? `
Your Permissions:
${permissions.canView ? '- View: You can view this vulnerability' : ''}
${permissions.canComment ? '- Comment: You can add comments and participate in discussions' : ''}
${permissions.canEdit ? '- Edit: You can edit vulnerability details' : ''}
${permissions.canShare ? '- Share: You can share this vulnerability with others' : ''}
` : ''}

View Vulnerability: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vulnerabilities/${vulnerability.cveId}

This vulnerability was shared with you by ${sharerName}. You can collaborate on this vulnerability, add comments, and discuss it with your team members.

---
VulnScope - Vulnerability Intelligence Platform
This vulnerability was shared by ${sharerName}. If you didn't expect this, please contact them directly.
`;

    return { subject, html, text };
  }

  /**
   * Generate team invitation email template
   */
  private generateTeamInvitationTemplate(
    teamName: string,
    inviterName: string,
    role: string,
    teamDescription?: string,
    invitationUrl?: string
  ): EmailTemplate {
    const subject = `You've been invited to join the team "${teamName}" on VulnScope`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .team-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .role-badge { display: inline-block; background: #667eea; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .features { margin: 20px 0; }
    .feature { margin: 10px 0; padding: 10px; background: #e9ecef; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🎉 Team Invitation</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">You've been invited to collaborate on VulnScope</p>
    </div>
    
    <div class="content">
      <p>Hello,</p>
      
      <p><strong>${inviterName}</strong> has invited you to join the team <strong>"${teamName}"</strong> on VulnScope, the vulnerability intelligence platform.</p>
      
      <div class="team-card">
        <h2 style="margin-top: 0; color: #667eea;">${teamName}</h2>
        ${teamDescription ? `<p style="color: #666; margin: 10px 0;">${teamDescription}</p>` : ''}
        <p><strong>Your Role:</strong> <span class="role-badge">${role}</span></p>
      </div>
      
      <div class="features">
        <h3 style="color: #667eea;">What you can do as a team member:</h3>
        <div class="feature">
          <strong>🔍 Collaborate on Vulnerability Research</strong><br>
          Share and discuss vulnerabilities with your team members
        </div>
        <div class="feature">
          <strong>💬 Team Discussions</strong><br>
          Participate in threaded discussions about security findings
        </div>
        <div class="feature">
          <strong>📊 Shared Analytics</strong><br>
          Access team-specific vulnerability insights and reports
        </div>
        <div class="feature">
          <strong>🔔 Real-time Notifications</strong><br>
          Stay updated on new vulnerabilities and team activities
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invitationUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/settings?tab=teams`}" class="cta-button">
          Join Team & Access VulnScope
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        If you don't have a VulnScope account yet, you can create one for free. 
        Once you're logged in, you'll automatically have access to the team.
      </p>
      
      <p style="font-size: 14px; color: #666;">
        If you have any questions about this invitation, please contact ${inviterName} or our support team.
      </p>
    </div>
    
    <div class="footer">
      <p>VulnScope - Vulnerability Intelligence Platform</p>
      <p>This invitation was sent by ${inviterName}. If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

    const text = `
TEAM INVITATION - VulnScope

Hello,

${inviterName} has invited you to join the team "${teamName}" on VulnScope, the vulnerability intelligence platform.

Team: ${teamName}
${teamDescription ? `Description: ${teamDescription}` : ''}
Your Role: ${role}

What you can do as a team member:
- Collaborate on vulnerability research
- Share and discuss vulnerabilities with team members
- Participate in threaded discussions about security findings
- Access team-specific vulnerability insights and reports
- Stay updated on new vulnerabilities and team activities

Join the team: ${invitationUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/settings?tab=teams`}

If you don't have a VulnScope account yet, you can create one for free. Once you're logged in, you'll automatically have access to the team.

If you have any questions about this invitation, please contact ${inviterName} or our support team.

---
VulnScope - Vulnerability Intelligence Platform
This invitation was sent by ${inviterName}. If you didn't expect this invitation, you can safely ignore this email.
`;

    return { subject, html, text };
  }

  /**
   * Generate vulnerability alert email template
   */
  private generateVulnerabilityAlertTemplate(
    vulnerability: Vulnerability,
    alertRuleName: string,
    userName?: string
  ): EmailTemplate {
    const severityColor = this.getSeverityColor(vulnerability.severity);
    const severityIcon = this.getSeverityIcon(vulnerability.severity);
    
    const subject = `${severityIcon} ${vulnerability.severity} Alert: ${vulnerability.cveId} - ${vulnerability.title}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .severity-badge { display: inline-block; background: ${severityColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .vuln-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${severityColor}; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #666; }
    .detail-value { color: #333; }
    .cta-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .tags { margin: 10px 0; }
    .tag { display: inline-block; background: #e9ecef; color: #495057; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">${severityIcon} Vulnerability Alert</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Alert Rule: ${alertRuleName}</p>
    </div>
    
    <div class="content">
      ${userName ? `<p>Hello ${userName},</p>` : '<p>Hello,</p>'}
      
      <p>A new vulnerability matching your alert criteria has been detected:</p>
      
      <div class="vuln-details">
        <h2 style="margin-top: 0; color: ${severityColor};">${vulnerability.cveId}</h2>
        <p style="font-size: 18px; margin: 10px 0;">${vulnerability.title}</p>
        
        <div class="detail-row">
          <span class="detail-label">Severity:</span>
          <span class="detail-value">
            <span class="severity-badge">${vulnerability.severity}</span>
            ${vulnerability.cvssScore ? `(CVSS: ${vulnerability.cvssScore})` : ''}
          </span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Published:</span>
          <span class="detail-value">${new Date(vulnerability.publishedDate).toLocaleDateString()}</span>
        </div>
        
        ${vulnerability.affectedSoftware.length > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Affected Software:</span>
          <span class="detail-value">${vulnerability.affectedSoftware.join(', ')}</span>
        </div>
        ` : ''}
        
        ${vulnerability.tags.length > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Tags:</span>
          <div class="tags">
            ${vulnerability.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="detail-row">
          <span class="detail-label">Exploit Available:</span>
          <span class="detail-value">${vulnerability.exploitAvailable ? '⚠️ Yes' : '✅ No'}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Patch Available:</span>
          <span class="detail-value">${vulnerability.patchAvailable ? '✅ Yes' : '❌ No'}</span>
        </div>
        
        ${vulnerability.kev ? `
        <div class="detail-row">
          <span class="detail-label">Known Exploited:</span>
          <span class="detail-value">🚨 Yes (CISA KEV)</span>
        </div>
        ` : ''}
        
        <div class="detail-row">
          <span class="detail-label">Description:</span>
          <span class="detail-value">${vulnerability.description}</span>
        </div>
      </div>
      
      <p><strong>Recommended Actions:</strong></p>
      <ul>
        <li>Review the vulnerability details and assess impact on your systems</li>
        <li>Check if any of your systems are affected by the listed software</li>
        <li>Apply patches immediately if available</li>
        <li>Monitor for exploit attempts if no patch is available</li>
        ${vulnerability.kev ? '<li><strong>Priority:</strong> This vulnerability is in CISA\'s Known Exploited Vulnerabilities catalog</li>' : ''}
      </ul>
      
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vulnerabilities/${vulnerability.cveId}" class="cta-button">
        View Full Details
      </a>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        This alert was triggered by your alert rule "${alertRuleName}". 
        You can manage your alert preferences in your VulnScope dashboard.
      </p>
    </div>
    
    <div class="footer">
      <p>VulnScope - Vulnerability Intelligence Platform</p>
      <p>This is an automated alert. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

    const text = `
${severityIcon} VULNERABILITY ALERT - ${vulnerability.severity}

Alert Rule: ${alertRuleName}
${userName ? `Hello ${userName},` : 'Hello,'}

A new vulnerability matching your alert criteria has been detected:

CVE ID: ${vulnerability.cveId}
Title: ${vulnerability.title}
Severity: ${vulnerability.severity}${vulnerability.cvssScore ? ` (CVSS: ${vulnerability.cvssScore})` : ''}
Published: ${new Date(vulnerability.publishedDate).toLocaleDateString()}
${vulnerability.affectedSoftware.length > 0 ? `Affected Software: ${vulnerability.affectedSoftware.join(', ')}` : ''}
${vulnerability.tags.length > 0 ? `Tags: ${vulnerability.tags.join(', ')}` : ''}
Exploit Available: ${vulnerability.exploitAvailable ? 'Yes' : 'No'}
Patch Available: ${vulnerability.patchAvailable ? 'Yes' : 'No'}
${vulnerability.kev ? 'Known Exploited: Yes (CISA KEV)' : ''}

Description:
${vulnerability.description}

Recommended Actions:
- Review the vulnerability details and assess impact on your systems
- Check if any of your systems are affected by the listed software
- Apply patches immediately if available
- Monitor for exploit attempts if no patch is available
${vulnerability.kev ? '- Priority: This vulnerability is in CISA\'s Known Exploited Vulnerabilities catalog' : ''}

View Full Details: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vulnerabilities/${vulnerability.cveId}

This alert was triggered by your alert rule "${alertRuleName}". 
You can manage your alert preferences in your VulnScope dashboard.

---
VulnScope - Vulnerability Intelligence Platform
This is an automated alert. Please do not reply to this email.
`;

    return { subject, html, text };
  }


  /**
   * Get severity color for styling
   */
  private getSeverityColor(severity: string): string {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return '#dc3545';
      case 'HIGH': return '#fd7e14';
      case 'MEDIUM': return '#ffc107';
      case 'LOW': return '#28a745';
      default: return '#6c757d';
    }
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: string): string {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '⚡';
      case 'LOW': return 'ℹ️';
      default: return '📋';
    }
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    const primaryConfigured = this.config.primaryProvider !== 'none' && (
      (this.config.primaryProvider === 'resend' && !!this.config.resendApiKey) ||
      (this.config.primaryProvider === 'smtp' && !!this.config.smtpHost && !!this.config.smtpUser)
    );

    const secondaryConfigured = this.config.secondaryProvider !== 'none' && (
      (this.config.secondaryProvider === 'resend' && !!this.config.resendApiKey) ||
      (this.config.secondaryProvider === 'smtp' && !!this.config.smtpHost && !!this.config.smtpUser)
    );

    return primaryConfigured || secondaryConfigured;
  }

  /**
   * Get comprehensive configuration status
   */
  getConfigStatus(): { 
    configured: boolean; 
    primaryProvider: string; 
    secondaryProvider: string;
    fallbackEnabled: boolean;
    primaryDetails: string;
    secondaryDetails: string;
    queueSize: number;
    deliveryStats: typeof this.deliveryStats;
  } {
    const primaryConfigured = this.config.primaryProvider !== 'none' && (
      (this.config.primaryProvider === 'resend' && !!this.config.resendApiKey) ||
      (this.config.primaryProvider === 'smtp' && !!this.config.smtpHost && !!this.config.smtpUser)
    );

    const secondaryConfigured = this.config.secondaryProvider !== 'none' && (
      (this.config.secondaryProvider === 'resend' && !!this.config.resendApiKey) ||
      (this.config.secondaryProvider === 'smtp' && !!this.config.smtpHost && !!this.config.smtpUser)
    );

    const getProviderDetails = (provider: string, configured: boolean) => {
      if (provider === 'none') return 'Not configured';
      if (provider === 'resend') {
        return configured ? 'Resend API configured' : 'Resend API key missing';
      }
      if (provider === 'smtp') {
        return configured ? `SMTP configured (${this.config.smtpHost})` : 'SMTP configuration incomplete';
      }
      return 'Unknown provider';
    };

    return {
      configured: primaryConfigured || secondaryConfigured,
      primaryProvider: this.config.primaryProvider,
      secondaryProvider: this.config.secondaryProvider,
      fallbackEnabled: this.config.enableFallback,
      primaryDetails: getProviderDetails(this.config.primaryProvider, primaryConfigured),
      secondaryDetails: getProviderDetails(this.config.secondaryProvider, secondaryConfigured),
      queueSize: this.emailQueue.length,
      deliveryStats: { ...this.deliveryStats }
    };
  }


  /**
   * Get delivery statistics
   */
  getDeliveryStats(): typeof this.deliveryStats {
    return { ...this.deliveryStats };
  }

  /**
   * Reset delivery statistics
   */
  resetDeliveryStats(): void {
    this.deliveryStats = {
      primary: { success: 0, failed: 0, lastUsed: null },
      secondary: { success: 0, failed: 0, lastUsed: null },
    };
    console.log('📊 Email delivery statistics reset');
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
