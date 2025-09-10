import type { NotificationTemplate, NotificationTemplateVariable, Notification } from '@/types/notification';

export class NotificationTemplateService {
  private static instance: NotificationTemplateService;

  public static getInstance(): NotificationTemplateService {
    if (!NotificationTemplateService.instance) {
      NotificationTemplateService.instance = new NotificationTemplateService();
    }
    return NotificationTemplateService.instance;
  }

  // Available template variables
  private readonly templateVariables: NotificationTemplateVariable[] = [
    {
      name: 'cveId',
      description: 'CVE identifier',
      example: 'CVE-2024-0001',
      availableFor: ['vulnerability_alert', 'comment_reply', 'bookmark_update'],
    },
    {
      name: 'title',
      description: 'Vulnerability title',
      example: 'Critical RCE in Apache Struts',
      availableFor: ['vulnerability_alert', 'comment_reply', 'bookmark_update'],
    },
    {
      name: 'severity',
      description: 'Vulnerability severity',
      example: 'CRITICAL',
      availableFor: ['vulnerability_alert', 'comment_reply', 'bookmark_update'],
    },
    {
      name: 'cvssScore',
      description: 'CVSS score',
      example: '9.8',
      availableFor: ['vulnerability_alert', 'comment_reply', 'bookmark_update'],
    },
    {
      name: 'author',
      description: 'Comment author name',
      example: 'John Doe',
      availableFor: ['comment_reply'],
    },
    {
      name: 'commentContent',
      description: 'Comment content preview',
      example: 'This affects our production systems...',
      availableFor: ['comment_reply'],
    },
    {
      name: 'action',
      description: 'Bookmark action',
      example: 'created',
      availableFor: ['bookmark_update'],
    },
    {
      name: 'achievementTitle',
      description: 'Achievement title',
      example: 'First Bookmark',
      availableFor: ['achievement_unlocked'],
    },
    {
      name: 'achievementDescription',
      description: 'Achievement description',
      example: 'Bookmarked your first vulnerability',
      availableFor: ['achievement_unlocked'],
    },
    {
      name: 'teamName',
      description: 'Team name',
      example: 'Security Team',
      availableFor: ['system_alert'],
    },
    {
      name: 'memberName',
      description: 'Team member name',
      example: 'Jane Smith',
      availableFor: ['system_alert'],
    },
  ];

  /**
   * Get available template variables for a notification type
   */
  getVariablesForType(type: Notification['type']): NotificationTemplateVariable[] {
    return this.templateVariables.filter(variable => 
      variable.availableFor.includes(type)
    );
  }

  /**
   * Get all available template variables
   */
  getAllVariables(): NotificationTemplateVariable[] {
    return this.templateVariables;
  }

  /**
   * Process a template with data
   */
  processTemplate(template: string, data: Record<string, unknown>): string {
    let processed = template;
    
    // Replace variables in the format {{variableName}}
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value || ''));
    }

    // Remove any remaining unreplaced variables
    processed = processed.replace(/{{[^}]+}}/g, '[Variable not found]');

    return processed;
  }

  /**
   * Get default templates for each notification type
   */
  getDefaultTemplates(): Omit<NotificationTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] {
    return [
      {
        name: 'Default Vulnerability Alert',
        description: 'Standard vulnerability alert template',
        type: 'vulnerability_alert',
        titleTemplate: '🚨 {{severity}} Alert: {{cveId}}',
        messageTemplate: 'New {{severity}} vulnerability {{cveId}} has been detected: {{title}} (CVSS: {{cvssScore}})',
        variables: ['cveId', 'title', 'severity', 'cvssScore'],
        isDefault: true,
        isActive: true,
      },
      {
        name: 'Default Comment Reply',
        description: 'Standard comment reply template',
        type: 'comment_reply',
        titleTemplate: '💬 New Reply from {{author}}',
        messageTemplate: '{{author}} replied to your comment on {{cveId}}: "{{commentContent}}"',
        variables: ['author', 'cveId', 'commentContent'],
        isDefault: true,
        isActive: true,
      },
      {
        name: 'Default Bookmark Update',
        description: 'Standard bookmark update template',
        type: 'bookmark_update',
        titleTemplate: '📌 Bookmark {{action}}',
        messageTemplate: 'Vulnerability {{cveId}} has been {{action}} from your bookmarks',
        variables: ['cveId', 'action'],
        isDefault: true,
        isActive: true,
      },
      {
        name: 'Default Achievement Unlocked',
        description: 'Standard achievement template',
        type: 'achievement_unlocked',
        titleTemplate: '🏆 Achievement Unlocked!',
        messageTemplate: 'Congratulations! You\'ve unlocked "{{achievementTitle}}": {{achievementDescription}}',
        variables: ['achievementTitle', 'achievementDescription'],
        isDefault: true,
        isActive: true,
      },
      {
        name: 'Default System Alert',
        description: 'Standard system alert template',
        type: 'system_alert',
        titleTemplate: '🔔 System Alert',
        messageTemplate: '{{title}}',
        variables: ['title'],
        isDefault: true,
        isActive: true,
      },
    ];
  }

  /**
   * Create a user template
   */
  async createUserTemplate(
    userId: string,
    template: Omit<NotificationTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificationTemplate> {
    try {
      const { getDatabase } = await import('./mongodb');
      const db = await getDatabase();
      const collection = db.collection<NotificationTemplate>('notification_templates');

      const newTemplate: NotificationTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await collection.insertOne(newTemplate);
      return newTemplate;
    } catch (error) {
      console.error('Error creating user template:', error);
      throw error;
    }
  }

  /**
   * Get user templates
   */
  async getUserTemplates(userId: string, type?: Notification['type']): Promise<NotificationTemplate[]> {
    try {
      const { getDatabase } = await import('./mongodb');
      const db = await getDatabase();
      const collection = db.collection<NotificationTemplate>('notification_templates');

      const query: any = { userId };
      if (type) {
        query.type = type;
      }

      const templates = await collection
        .find(query)
        .sort({ isDefault: -1, createdAt: -1 })
        .toArray();

      // Remove MongoDB _id fields
      return templates.map(({ _id, ...template }) => template);
    } catch (error) {
      console.error('Error getting user templates:', error);
      return [];
    }
  }

  /**
   * Get the best template for a notification type
   */
  async getBestTemplate(
    userId: string,
    type: Notification['type']
  ): Promise<NotificationTemplate | null> {
    try {
      const templates = await this.getUserTemplates(userId, type);
      
      // Find active user template first
      const userTemplate = templates.find(t => !t.isDefault && t.isActive);
      if (userTemplate) {
        return userTemplate;
      }

      // Fall back to default template
      const defaultTemplate = templates.find(t => t.isDefault && t.isActive);
      if (defaultTemplate) {
        return defaultTemplate;
      }

      // If no templates exist, create default ones
      const defaultTemplates = this.getDefaultTemplates();
      const defaultForType = defaultTemplates.find(t => t.type === type);
      
      if (defaultForType) {
        return await this.createUserTemplate(userId, defaultForType);
      }

      return null;
    } catch (error) {
      console.error('Error getting best template:', error);
      return null;
    }
  }

  /**
   * Update a user template
   */
  async updateUserTemplate(
    userId: string,
    templateId: string,
    updates: Partial<NotificationTemplate>
  ): Promise<boolean> {
    try {
      const { getDatabase } = await import('./mongodb');
      const db = await getDatabase();
      const collection = db.collection<NotificationTemplate>('notification_templates');

      const result = await collection.updateOne(
        { id: templateId, userId },
        {
          $set: {
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating user template:', error);
      return false;
    }
  }

  /**
   * Delete a user template
   */
  async deleteUserTemplate(userId: string, templateId: string): Promise<boolean> {
    try {
      const { getDatabase } = await import('./mongodb');
      const db = await getDatabase();
      const collection = db.collection<NotificationTemplate>('notification_templates');

      // Don't allow deletion of default templates
      const template = await collection.findOne({ id: templateId, userId });
      if (template?.isDefault) {
        return false;
      }

      const result = await collection.deleteOne({ id: templateId, userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting user template:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationTemplateService = NotificationTemplateService.getInstance();
