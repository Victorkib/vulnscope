import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { Vulnerability } from '@/types/vulnerability';

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection<Vulnerability>('vulnerabilities');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get all the data we need in parallel
    const [
      total,
      newToday,
      newYesterday,
      newThisWeek,
      newLastWeek,
      newThisMonth,
      newLastMonth,
      severityStats,
      sourceStats,
      patchedCount,
      affectedSystems,
      trendData
    ] = await Promise.all([
      // Total vulnerabilities
      collection.countDocuments(),
      
      // New vulnerabilities today
      collection.countDocuments({
        publishedDate: {
          $gte: today.toISOString(),
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        }
      }),
      
      // New vulnerabilities yesterday
      collection.countDocuments({
        publishedDate: {
          $gte: yesterday.toISOString(),
          $lt: today.toISOString()
        }
      }),
      
      // New vulnerabilities this week
      collection.countDocuments({
        publishedDate: {
          $gte: weekAgo.toISOString()
        }
      }),
      
      // New vulnerabilities last week
      collection.countDocuments({
        publishedDate: {
          $gte: twoWeeksAgo.toISOString(),
          $lt: weekAgo.toISOString()
        }
      }),
      
      // New vulnerabilities this month
      collection.countDocuments({
        publishedDate: {
          $gte: monthAgo.toISOString()
        }
      }),
      
      // New vulnerabilities last month
      collection.countDocuments({
        publishedDate: {
          $gte: twoMonthsAgo.toISOString(),
          $lt: monthAgo.toISOString()
        }
      }),
      
      // Severity breakdown
      collection
        .aggregate([
          { $group: { _id: '$severity', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      
      // Source breakdown
      collection
        .aggregate([
          { $group: { _id: '$source', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
      
      // Patched vulnerabilities (assuming patchAvailable field)
      collection.countDocuments({
        patchAvailable: true
      }),
      
      // Affected systems (count unique affected software)
      collection.distinct('affectedSoftware').then(software => software.length),
      
      // Trend data for the last 30 days
      collection
        .aggregate([
          {
            $match: {
              publishedDate: { $gte: monthAgo.toISOString() },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: { $dateFromString: { dateString: '$publishedDate' } },
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray()
    ]);

    // Format severity stats
    const bySeverity = {
      CRITICAL: severityStats.find((s) => s._id === 'CRITICAL')?.count || 0,
      HIGH: severityStats.find((s) => s._id === 'HIGH')?.count || 0,
      MEDIUM: severityStats.find((s) => s._id === 'MEDIUM')?.count || 0,
      LOW: severityStats.find((s) => s._id === 'LOW')?.count || 0,
    };

    // Format source stats
    const bySource = sourceStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate trends
    const dailyTrend = newYesterday > 0 ? ((newToday - newYesterday) / newYesterday) * 100 : 0;
    const weeklyTrend = newLastWeek > 0 ? ((newThisWeek - newLastWeek) / newLastWeek) * 100 : 0;
    const monthlyTrend = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : 0;

    // Calculate security score
    const securityScore = Math.max(
      20,
      100 - (bySeverity.CRITICAL * 10 + bySeverity.HIGH * 5 + bySeverity.MEDIUM * 2)
    );

    const riskLevel = 
      securityScore >= 80 ? 'low' :
      securityScore >= 60 ? 'medium' :
      securityScore >= 40 ? 'high' : 'critical';

    const dashboardStats = {
      total,
      bySeverity,
      bySource,
      newToday,
      newYesterday,
      newThisWeek,
      newLastWeek,
      newThisMonth,
      newLastMonth,
      patchedCount,
      affectedSystems,
      securityScore,
      riskLevel,
      trends: {
        daily: Math.round(dailyTrend * 100) / 100,
        weekly: Math.round(weeklyTrend * 100) / 100,
        monthly: Math.round(monthlyTrend * 100) / 100,
      },
      trendData: trendData.map((item) => ({
        date: item._id,
        count: item.count,
      })),
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
