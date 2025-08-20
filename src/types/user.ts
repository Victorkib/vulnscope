export interface UserStats {
  // Core metrics
  totalBookmarks: number;
  totalViews: number;
  totalComments: number;
  totalSearches: number;
  totalExports: number;
  totalAlerts: number;
  activeAlerts: number;

  // Time-based metrics
  weeklyActivity: number;
  monthlyActivity: number;
  averageSessionTime: number;
  currentStreak?: number;

  // User progression
  userLevel?: number;
  totalScore?: number;
  nextLevelScore?: number;

  // Preferences and behavior
  favoriteCategories: string[];
  mostViewedSeverity: string;
  bookmarksByPriority?: Record<string, number>;

  // Activity breakdown
  activityBreakdown?: Record<string, number>;

  // Recent activity summary
  recentActivityCount?: number;
  lastActiveDate?: string | null;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: string;
  description: string;
  vulnerabilityId?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  vulnerability?: {
    cveId: string;
    title: string;
    severity: string;
    publishedDate: string;
  };
}

export interface UserBookmark {
  id: string;
  userId: string;
  vulnerabilityId: string;
  notes: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  vulnerability?: {
    cveId: string;
    title: string;
    description: string;
    severity: string;
    cvssScore: number;
    publishedDate: string;
    lastModifiedDate: string;
    affectedSoftware: string[];
    references: string[];
  };
}

export interface UserPreferences {
  userId: string;

  // Appearance
  theme: 'light' | 'dark' | 'system';
  dashboardLayout: 'compact' | 'comfortable' | 'spacious';
  language: string;
  timezone: string;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  criticalAlerts: boolean;

  // Data and Export
  exportFormat: 'json' | 'csv' | 'pdf';
  maxResultsPerPage: number;
  defaultSeverityFilter: string[];

  // Behavior
  autoRefresh: boolean;
  refreshInterval: number;
  showPreviewCards: boolean;
  enableSounds: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  isPublic: boolean;
  createdAt: string;
  lastUsed: string;
  useCount: number;
}

export interface UserAlert {
  id: string;
  userId: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  isActive: boolean;
  notificationMethods: ('email' | 'push' | 'webhook')[];
  webhookUrl?: string;
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  activityCount: number;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  organization?: string;
  role?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  preferences: UserPreferences;
  stats: UserStats;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

// Form types for validation
export interface BookmarkFormData {
  vulnerabilityId: string;
  notes?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
}

export interface SearchFormData {
  query?: string;
  severity?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  affectedSoftware?: string[];
  cvssScore?: {
    min: number;
    max: number;
  };
  hasExploit?: boolean;
  sortBy?: 'publishedDate' | 'lastModifiedDate' | 'cvssScore' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

export interface PreferencesFormData {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  criticalAlerts: boolean;
  exportFormat: 'json' | 'csv' | 'pdf';
  dashboardLayout: 'compact' | 'comfortable' | 'spacious';
  language: string;
  timezone: string;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultSeverityFilter: string[];
  maxResultsPerPage: number;
  showPreviewCards: boolean;
  enableSounds: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Component prop types
export interface UserStatsCardsProps {
  stats: UserStats;
  isLoading: boolean;
}

export interface ActivityFeedProps {
  activities: UserActivity[];
  isLoading: boolean;
  onRefresh: () => void;
  showVulnerabilityDetails?: boolean;
  maxItems?: number;
}

export interface BookmarksManagerProps {
  bookmarks: (UserBookmark & { vulnerability: any })[];
  isLoading: boolean;
  onUpdateBookmark: (
    bookmarkId: string,
    updates: Partial<UserBookmark>
  ) => Promise<void>;
  onDeleteBookmark: (bookmarkId: string) => Promise<void>;
  onViewVulnerability: (vulnerabilityId: string) => void;
}

// Utility types
export type ActivityType =
  | 'view'
  | 'bookmark'
  | 'bookmark_updated'
  | 'bookmark_deleted'
  | 'search'
  | 'search_saved'
  | 'search_updated'
  | 'search_deleted'
  | 'export'
  | 'comment'
  | 'settings_changed'
  | 'alert_created'
  | 'alert_triggered'
  | 'login'
  | 'logout';

export type BookmarkPriority = 'critical' | 'high' | 'medium' | 'low';

export type ExportFormat = 'json' | 'csv' | 'pdf';

export type DashboardLayout = 'compact' | 'comfortable' | 'spacious';

export type Theme = 'light' | 'dark' | 'system';

export type NotificationMethod = 'email' | 'push' | 'webhook';

// Achievement system types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: (stats: UserStats) => boolean;
  progress: (stats: UserStats) => number;
  maxProgress: number;
  unlockedAt?: string;
}

export interface UserAchievements {
  unlocked: Achievement[];
  nextAchievement?: Achievement;
  totalPoints: number;
  completionPercentage: number;
}
