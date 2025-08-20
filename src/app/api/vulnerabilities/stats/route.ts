import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { Vulnerability } from '@/types/vulnerability';

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection<Vulnerability>('vulnerabilities');

    // Get basic counts
    const [total, severityStats, sourceStats, recentCount] = await Promise.all([
      collection.countDocuments(),
      collection
        .aggregate([
          { $group: { _id: '$severity', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      collection
        .aggregate([
          { $group: { _id: '$source', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
      collection.countDocuments({
        publishedDate: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    ]);

    // Get trend data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await collection
      .aggregate([
        {
          $match: {
            publishedDate: { $gte: thirtyDaysAgo.toISOString() },
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
      .toArray();

    // Format severity stats
    const bySeverity = {
      critical: severityStats.find((s) => s._id === 'CRITICAL')?.count || 0,
      high: severityStats.find((s) => s._id === 'HIGH')?.count || 0,
      medium: severityStats.find((s) => s._id === 'MEDIUM')?.count || 0,
      low: severityStats.find((s) => s._id === 'LOW')?.count || 0,
    };

    // Format source stats
    const bySource = sourceStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      total,
      bySeverity,
      bySource,
      recentCount,
      trendData: trendData.map((item) => ({
        date: item._id,
        count: item.count,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching vulnerability stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerability statistics' },
      { status: 500 }
    );
  }
}
