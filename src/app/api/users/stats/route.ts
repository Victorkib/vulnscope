import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    // Calculate time ranges
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get comprehensive user statistics
    const [
      bookmarksCount,
      totalActivity,
      activityByType,
      recentActivity,
      bookmarksByPriority,
      vulnerabilityViews,
      weeklyActivity,
      monthlyActivity,
      searchHistory,
      exportHistory,
    ] = await Promise.all([
      // Total bookmarks
      db.collection('user_bookmarks').countDocuments({ userId: user.id }),

      // Total activity count
      db.collection('user_activity').countDocuments({ userId: user.id }),

      // Activity breakdown by type
      db
        .collection('user_activity')
        .aggregate([
          { $match: { userId: user.id } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ])
        .toArray(),

      // Recent activity for session time calculation
      db
        .collection('user_activity')
        .find({ userId: user.id })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray(),

      // Bookmarks by priority
      db
        .collection('user_bookmarks')
        .aggregate([
          { $match: { userId: user.id } },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ])
        .toArray(),

      // Most viewed vulnerability severities
      db
        .collection('user_activity')
        .aggregate([
          {
            $match: {
              userId: user.id,
              type: 'view',
              vulnerabilityId: { $exists: true },
            },
          },
          {
            $lookup: {
              from: 'vulnerabilities',
              localField: 'vulnerabilityId',
              foreignField: 'cveId',
              as: 'vulnerability',
            },
          },
          { $unwind: '$vulnerability' },
          { $group: { _id: '$vulnerability.severity', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),

      // Weekly activity
      db.collection('user_activity').countDocuments({
        userId: user.id,
        timestamp: { $gte: weekAgo.toISOString() },
      }),

      // Monthly activity
      db.collection('user_activity').countDocuments({
        userId: user.id,
        timestamp: { $gte: monthAgo.toISOString() },
      }),

      // Search history
      db.collection('user_activity').countDocuments({
        userId: user.id,
        type: 'search',
      }),

      // Export history
      db.collection('user_activity').countDocuments({
        userId: user.id,
        type: 'export',
      }),
    ]);

    // Calculate average session time (simplified)
    const averageSessionTime =
      recentActivity.length > 1
        ? Math.round(
            (new Date(recentActivity[0].timestamp).getTime() -
              new Date(
                recentActivity[recentActivity.length - 1].timestamp
              ).getTime()) /
              (1000 * 60 * recentActivity.length)
          )
        : 15;

    // Get activity type counts
    const getActivityCount = (type: string) =>
      activityByType.find((a) => a._id === type)?.count || 0;

    // Calculate user level and score
    const totalScore =
      bookmarksCount * 10 +
      getActivityCount('view') * 2 +
      getActivityCount('search') * 5;
    const userLevel = Math.floor(totalScore / 100) + 1;

    // Get favorite categories from bookmarks
    const favoriteCategories = bookmarksByPriority
      .map((p) => p._id)
      .slice(0, 3);

    // Get most viewed severity
    const mostViewedSeverity = vulnerabilityViews[0]?._id || 'CRITICAL';

    // Calculate streak (days with activity)
    const activityDates = recentActivity.map((a) =>
      new Date(a.timestamp).toDateString()
    );
    const uniqueDates = [...new Set(activityDates)];
    const currentStreak = uniqueDates.length;

    const stats = {
      // Core metrics
      totalBookmarks: bookmarksCount,
      totalViews: getActivityCount('view'),
      totalComments: getActivityCount('comment'),
      totalSearches: searchHistory,
      totalExports: exportHistory,
      totalAlerts: getActivityCount('alert_created'),
      activeAlerts: 0, // This would come from alerts collection when implemented

      // Time-based metrics
      weeklyActivity,
      monthlyActivity,
      averageSessionTime,
      currentStreak,

      // User progression
      userLevel,
      totalScore,
      nextLevelScore: userLevel * 100 - totalScore,

      // Preferences and behavior
      favoriteCategories,
      mostViewedSeverity,
      bookmarksByPriority: bookmarksByPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),

      // Activity breakdown
      activityBreakdown: activityByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),

      // Recent activity summary
      recentActivityCount: recentActivity.length,
      lastActiveDate: recentActivity[0]?.timestamp || null,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
