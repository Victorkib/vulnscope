import type { UserStats, Achievement, UserAchievements } from '@/types/user';
import { notificationService } from './notification-service';

export class AchievementService {
  private static instance: AchievementService;

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  // Define available achievements
  private readonly achievements: Achievement[] = [
    {
      id: 'first_bookmark',
      title: 'First Bookmark',
      description: 'Bookmarked your first vulnerability',
      icon: 'bookmark',
      requirement: (stats: UserStats) => stats.totalBookmarks >= 1,
      progress: (stats: UserStats) => Math.min(stats.totalBookmarks, 1),
      maxProgress: 1,
    },
    {
      id: 'bookmark_collector',
      title: 'Bookmark Collector',
      description: 'Bookmarked 10 vulnerabilities',
      icon: 'bookmark-check',
      requirement: (stats: UserStats) => stats.totalBookmarks >= 10,
      progress: (stats: UserStats) => Math.min(stats.totalBookmarks, 10),
      maxProgress: 10,
    },
    {
      id: 'bookmark_master',
      title: 'Bookmark Master',
      description: 'Bookmarked 50 vulnerabilities',
      icon: 'bookmark-star',
      requirement: (stats: UserStats) => stats.totalBookmarks >= 50,
      progress: (stats: UserStats) => Math.min(stats.totalBookmarks, 50),
      maxProgress: 50,
    },
    {
      id: 'first_comment',
      title: 'First Comment',
      description: 'Made your first comment',
      icon: 'message-circle',
      requirement: (stats: UserStats) => stats.totalComments >= 1,
      progress: (stats: UserStats) => Math.min(stats.totalComments, 1),
      maxProgress: 1,
    },
    {
      id: 'active_commenter',
      title: 'Active Commenter',
      description: 'Made 10 comments',
      icon: 'message-square',
      requirement: (stats: UserStats) => stats.totalComments >= 10,
      progress: (stats: UserStats) => Math.min(stats.totalComments, 10),
      maxProgress: 10,
    },
    {
      id: 'first_search',
      title: 'First Search',
      description: 'Performed your first search',
      icon: 'search',
      requirement: (stats: UserStats) => stats.totalSearches >= 1,
      progress: (stats: UserStats) => Math.min(stats.totalSearches, 1),
      maxProgress: 1,
    },
    {
      id: 'search_expert',
      title: 'Search Expert',
      description: 'Performed 25 searches',
      icon: 'search-check',
      requirement: (stats: UserStats) => stats.totalSearches >= 25,
      progress: (stats: UserStats) => Math.min(stats.totalSearches, 25),
      maxProgress: 25,
    },
    {
      id: 'first_export',
      title: 'First Export',
      description: 'Exported your first vulnerability data',
      icon: 'download',
      requirement: (stats: UserStats) => stats.totalExports >= 1,
      progress: (stats: UserStats) => Math.min(stats.totalExports, 1),
      maxProgress: 1,
    },
    {
      id: 'data_exporter',
      title: 'Data Exporter',
      description: 'Exported data 5 times',
      icon: 'file-export',
      requirement: (stats: UserStats) => stats.totalExports >= 5,
      progress: (stats: UserStats) => Math.min(stats.totalExports, 5),
      maxProgress: 5,
    },
    {
      id: 'alert_setup',
      title: 'Alert Setup',
      description: 'Created your first alert rule',
      icon: 'bell',
      requirement: (stats: UserStats) => stats.totalAlerts >= 1,
      progress: (stats: UserStats) => Math.min(stats.totalAlerts, 1),
      maxProgress: 1,
    },
    {
      id: 'alert_master',
      title: 'Alert Master',
      description: 'Created 5 alert rules',
      icon: 'bell-ring',
      requirement: (stats: UserStats) => stats.totalAlerts >= 5,
      progress: (stats: UserStats) => Math.min(stats.totalAlerts, 5),
      maxProgress: 5,
    },
    {
      id: 'daily_user',
      title: 'Daily User',
      description: 'Used the platform for 7 consecutive days',
      icon: 'calendar',
      requirement: (stats: UserStats) => (stats.currentStreak || 0) >= 7,
      progress: (stats: UserStats) => Math.min(stats.currentStreak || 0, 7),
      maxProgress: 7,
    },
    {
      id: 'dedicated_user',
      title: 'Dedicated User',
      description: 'Used the platform for 30 consecutive days',
      icon: 'calendar-check',
      requirement: (stats: UserStats) => (stats.currentStreak || 0) >= 30,
      progress: (stats: UserStats) => Math.min(stats.currentStreak || 0, 30),
      maxProgress: 30,
    },
  ];

  /**
   * Check for newly unlocked achievements and send notifications
   */
  async checkAchievements(userId: string, userStats: UserStats): Promise<Achievement[]> {
    try {
      const { getDatabase } = await import('./mongodb');
      const db = await getDatabase();
      const collection = db.collection('user_achievements');

      // Get user's current achievements
      const userAchievement = await collection.findOne({ userId });
      const unlockedAchievementIds = userAchievement?.unlockedAchievements || [];

      // Check for new achievements
      const newlyUnlocked: Achievement[] = [];
      
      for (const achievement of this.achievements) {
        if (!unlockedAchievementIds.includes(achievement.id) && achievement.requirement(userStats)) {
          newlyUnlocked.push({
            ...achievement,
            unlockedAt: new Date().toISOString(),
          });
        }
      }

      // If there are new achievements, update the database and send notifications
      if (newlyUnlocked.length > 0) {
        const allUnlockedIds = [...unlockedAchievementIds, ...newlyUnlocked.map(a => a.id)];
        
        await collection.updateOne(
          { userId },
          {
            $set: {
              unlockedAchievements: allUnlockedIds,
              lastChecked: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );

        // Send notifications for each new achievement
        for (const achievement of newlyUnlocked) {
          try {
            await notificationService.sendAchievementUnlocked(userId, {
              id: achievement.id,
              title: achievement.title,
              description: achievement.description,
            });
          } catch (notificationError) {
            console.error('Error sending achievement notification:', notificationError);
            // Don't fail the achievement check if notification fails
          }
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Get user's achievement progress
   */
  async getUserAchievements(userId: string, userStats: UserStats): Promise<UserAchievements> {
    try {
      const { getDatabase } = await import('./mongodb');
      const db = await getDatabase();
      const collection = db.collection('user_achievements');

      const userAchievement = await collection.findOne({ userId });
      const unlockedAchievementIds = userAchievement?.unlockedAchievements || [];

      // Get unlocked achievements
      const unlocked = this.achievements
        .filter(achievement => unlockedAchievementIds.includes(achievement.id))
        .map(achievement => ({
          ...achievement,
          unlockedAt: userAchievement?.unlockedAt?.[achievement.id] || new Date().toISOString(),
        }));

      // Find next achievement to unlock
      const nextAchievement = this.achievements.find(
        achievement => !unlockedAchievementIds.includes(achievement.id)
      );

      // Calculate total points and completion percentage
      const totalPoints = unlocked.length * 10; // 10 points per achievement
      const completionPercentage = (unlocked.length / this.achievements.length) * 100;

      return {
        unlocked,
        nextAchievement,
        totalPoints,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return {
        unlocked: [],
        totalPoints: 0,
        completionPercentage: 0,
      };
    }
  }

  /**
   * Get all available achievements with progress
   */
  getAllAchievements(userStats: UserStats): Achievement[] {
    return this.achievements.map(achievement => ({
      ...achievement,
      progress: achievement.progress,
    }));
  }
}

// Export singleton instance
export const achievementService = AchievementService.getInstance();
