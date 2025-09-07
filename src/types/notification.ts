export interface Notification {
  id: string;
  userId: string;
  type: 'vulnerability_alert' | 'comment_reply' | 'bookmark_update' | 'system_alert' | 'achievement_unlocked';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

export interface RealtimeNotification {
  id: string;
  type: 'vulnerability_alert' | 'comment_reply' | 'bookmark_update' | 'system_alert' | 'achievement_unlocked';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface NotificationPreferences {
  userId: string;
  vulnerabilityAlerts: boolean;
  commentReplies: boolean;
  bookmarkUpdates: boolean;
  systemAlerts: boolean;
  achievementNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  webhookUrl?: string;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AlertRule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  conditions: {
    severity?: ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')[];
    affectedSoftware?: string[];
    cvssScore?: {
      min: number;
      max: number;
    };
    sources?: string[];
    tags?: string[];
  };
  actions: {
    email: boolean;
    push: boolean;
    webhook?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggerCount: number;
}


