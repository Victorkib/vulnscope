import type { UserStats, UserActivity, UserPreferences } from '@/types/user';

// User scoring and level calculation
export function calculateUserScore(stats: UserStats): number {
  const {
    totalBookmarks = 0,
    totalViews = 0,
    totalComments = 0,
    totalSearches = 0,
    totalExports = 0,
    weeklyActivity = 0,
    monthlyActivity = 0,
  } = stats;

  // Weighted scoring system
  const bookmarkPoints = totalBookmarks * 10;
  const viewPoints = totalViews * 2;
  const commentPoints = totalComments * 15;
  const searchPoints = totalSearches * 5;
  const exportPoints = totalExports * 8;
  const activityBonus = Math.min(weeklyActivity * 3, 100); // Cap weekly bonus
  const consistencyBonus = monthlyActivity > 50 ? 50 : 0;

  return (
    bookmarkPoints +
    viewPoints +
    commentPoints +
    searchPoints +
    exportPoints +
    activityBonus +
    consistencyBonus
  );
}

export function getUserLevel(score: number): number {
  return Math.floor(score / 100) + 1;
}

export function getNextLevelScore(currentScore: number): number {
  const currentLevel = getUserLevel(currentScore);
  return currentLevel * 100 - currentScore;
}

export function getUserLevelTitle(level: number): string {
  if (level >= 50) return 'Security Master';
  if (level >= 30) return 'Threat Hunter';
  if (level >= 20) return 'Vulnerability Expert';
  if (level >= 15) return 'Security Specialist';
  if (level >= 10) return 'Cyber Analyst';
  if (level >= 5) return 'Security Researcher';
  return 'Security Novice';
}

// Activity color coding
export function getActivityColor(type: string): string {
  const colors: Record<string, string> = {
    view: 'bg-blue-100 text-blue-800',
    bookmark: 'bg-green-100 text-green-800',
    bookmark_updated: 'bg-yellow-100 text-yellow-800',
    bookmark_deleted: 'bg-red-100 text-red-800',
    search: 'bg-purple-100 text-purple-800',
    search_saved: 'bg-indigo-100 text-indigo-800',
    search_updated: 'bg-cyan-100 text-cyan-800',
    search_deleted: 'bg-pink-100 text-pink-800',
    export: 'bg-orange-100 text-orange-800',
    comment: 'bg-teal-100 text-teal-800',
    settings_changed: 'bg-gray-100 text-gray-800',
    alert_created: 'bg-red-100 text-red-800',
    alert_triggered: 'bg-red-200 text-red-900',
    login: 'bg-emerald-100 text-emerald-800',
    logout: 'bg-slate-100 text-slate-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

// Activity description formatting
export function formatActivityDescription(activity: UserActivity): string {
  const { type, description, vulnerabilityId, metadata } = activity;

  switch (type) {
    case 'view':
      return vulnerabilityId
        ? `Viewed vulnerability ${vulnerabilityId}`
        : description || 'Viewed a vulnerability';

    case 'bookmark':
      return vulnerabilityId
        ? `Bookmarked ${vulnerabilityId} with ${
            metadata?.priority || 'medium'
          } priority`
        : description || 'Created a bookmark';

    case 'bookmark_updated':
      return vulnerabilityId
        ? `Updated bookmark for ${vulnerabilityId}`
        : description || 'Updated a bookmark';

    case 'bookmark_deleted':
      return vulnerabilityId
        ? `Removed bookmark for ${vulnerabilityId}`
        : description || 'Deleted a bookmark';

    case 'search':
      const filterCount = (metadata?.filterCount as number) || 0;
      return filterCount > 0
        ? `Searched with ${filterCount} filter${filterCount !== 1 ? 's' : ''}`
        : description || 'Performed a search';

    case 'search_saved':
      return metadata?.searchName
        ? `Saved search "${metadata.searchName as string}"`
        : description || 'Saved a search';

    case 'export':
      const format = (metadata?.format as string) || 'unknown';
      const count = (metadata?.count as number) || 0;
      return count > 0
        ? `Exported ${count} vulnerabilities as ${format.toUpperCase()}`
        : description || 'Exported data';

    case 'settings_changed':
      const changedCount = (metadata?.changedSettings as unknown[])?.length || 0;
      return changedCount > 0
        ? `Updated ${changedCount} setting${changedCount !== 1 ? 's' : ''}`
        : description || 'Changed settings';

    default:
      return description || `Performed ${type} action`;
  }
}

// Activity time formatting
export function formatActivityTime(timestamp: string): string {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMs = now.getTime() - activityTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return activityTime.toLocaleDateString();
}

// User preferences utilities
export function getDefaultPreferences(userId: string): UserPreferences {
  return {
    userId,
    theme: 'system',
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    criticalAlerts: true,
    exportFormat: 'json',
    dashboardLayout: 'comfortable',
    language: 'en',
    timezone: 'UTC',
    autoRefresh: false,
    refreshInterval: 300000, // 5 minutes
    defaultSeverityFilter: ['CRITICAL', 'HIGH'],
    maxResultsPerPage: 25,
    showPreviewCards: true,
    enableSounds: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function validatePreferences(preferences: Record<string, unknown>): boolean {
  const requiredFields = [
    'theme',
    'language',
    'timezone',
    'exportFormat',
    'dashboardLayout',
    'emailNotifications',
    'pushNotifications',
    'weeklyDigest',
    'criticalAlerts',
  ];

  const validThemes = ['light', 'dark', 'system'];
  const validExportFormats = ['json', 'csv', 'pdf'];
  const validLayouts = ['compact', 'comfortable', 'spacious'];

  // Check required fields exist
  if (!requiredFields.every((field) => preferences.hasOwnProperty(field))) {
    return false;
  }

  // Validate enum values
  if (!validThemes.includes(preferences.theme as string)) return false;
  if (!validExportFormats.includes(preferences.exportFormat as string)) return false;
  if (!validLayouts.includes(preferences.dashboardLayout as string)) return false;

  // Validate boolean fields
  const booleanFields = [
    'emailNotifications',
    'pushNotifications',
    'weeklyDigest',
    'criticalAlerts',
  ];
  if (
    !booleanFields.every((field) => typeof preferences[field] === 'boolean')
  ) {
    return false;
  }

  return true;
}

// Bookmark utilities
export function getBookmarkPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[priority] || colors.medium;
}

export function formatBookmarkDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString();
}

// User insights and recommendations
export function generateUserInsights(
  stats: UserStats,
  activities: UserActivity[]
): string[] {
  const insights: string[] = [];
  const score = calculateUserScore(stats);
  const level = getUserLevel(score);

  // Activity insights
  if (stats.weeklyActivity > stats.monthlyActivity / 4) {
    insights.push("🔥 You're more active this week than usual!");
  }

  if (stats.totalBookmarks > 20) {
    insights.push(
      "📚 You're building an impressive vulnerability knowledge base!"
    );
  }

  if (stats.totalExports > 10) {
    insights.push("📊 You're great at sharing security intelligence!");
  }

  // Level-based insights
  if (level >= 10) {
    insights.push("🏆 You're a seasoned security professional!");
  } else if (level >= 5) {
    insights.push("🎯 You're developing strong security analysis skills!");
  }

  // Behavioral insights
  const recentActivities = activities.slice(0, 10);
  const searchCount = recentActivities.filter(
    (a) => a.type === 'search'
  ).length;
  const viewCount = recentActivities.filter((a) => a.type === 'view').length;

  if (searchCount > viewCount) {
    insights.push("🔍 You're a thorough researcher - lots of searching!");
  }

  if (stats.mostViewedSeverity === 'CRITICAL') {
    insights.push('🚨 You focus on the most critical security threats!');
  }

  return insights.slice(0, 3); // Return top 3 insights
}

// Achievement system
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: (stats: UserStats) => boolean;
  progress: (stats: UserStats) => number;
  maxProgress: number;
}

export const achievements: Achievement[] = [
  {
    id: 'first_bookmark',
    title: 'First Save',
    description: 'Create your first bookmark',
    icon: '🔖',
    requirement: (stats) => stats.totalBookmarks >= 1,
    progress: (stats) => Math.min(stats.totalBookmarks, 1),
    maxProgress: 1,
  },
  {
    id: 'bookmark_collector',
    title: 'Collector',
    description: 'Save 25 vulnerabilities',
    icon: '📚',
    requirement: (stats) => stats.totalBookmarks >= 25,
    progress: (stats) => Math.min(stats.totalBookmarks, 25),
    maxProgress: 25,
  },
  {
    id: 'active_researcher',
    title: 'Active Researcher',
    description: 'View 100 vulnerabilities',
    icon: '🔍',
    requirement: (stats) => stats.totalViews >= 100,
    progress: (stats) => Math.min(stats.totalViews, 100),
    maxProgress: 100,
  },
  {
    id: 'search_master',
    title: 'Search Master',
    description: 'Perform 50 searches',
    icon: '🎯',
    requirement: (stats) => stats.totalSearches >= 50,
    progress: (stats) => Math.min(stats.totalSearches, 50),
    maxProgress: 50,
  },
  {
    id: 'data_analyst',
    title: 'Data Analyst',
    description: 'Export data 10 times',
    icon: '📊',
    requirement: (stats) => stats.totalExports >= 10,
    progress: (stats) => Math.min(stats.totalExports, 10),
    maxProgress: 10,
  },
  {
    id: 'security_expert',
    title: 'Security Expert',
    description: 'Reach level 20',
    icon: '🏆',
    requirement: (stats) => getUserLevel(calculateUserScore(stats)) >= 20,
    progress: (stats) => Math.min(getUserLevel(calculateUserScore(stats)), 20),
    maxProgress: 20,
  },
];

export function getUserAchievements(stats: UserStats): Achievement[] {
  return achievements.filter((achievement) => achievement.requirement(stats));
}

export function getProgressToNextAchievement(
  stats: UserStats
): Achievement | null {
  const unlockedAchievements = getUserAchievements(stats);
  const lockedAchievements = achievements.filter(
    (a) => !unlockedAchievements.includes(a)
  );

  if (lockedAchievements.length === 0) return null;

  // Return the achievement with the highest progress
  return lockedAchievements.reduce((closest, current) => {
    const closestProgress = closest.progress(stats) / closest.maxProgress;
    const currentProgress = current.progress(stats) / current.maxProgress;
    return currentProgress > closestProgress ? current : closest;
  });
}
