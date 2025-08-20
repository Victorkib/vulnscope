import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { Vulnerability } from '@/types/vulnerability';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number.parseInt(searchParams.get('days') || '30');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    const db = await getDatabase();
    const collection = db.collection<Vulnerability>('vulnerabilities');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-W%U';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const trendData = await collection
      .aggregate([
        {
          $match: {
            publishedDate: { $gte: startDate.toISOString() },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: dateFormat,
                  date: { $dateFromString: { dateString: '$publishedDate' } },
                },
              },
              severity: '$severity',
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.date',
            critical: {
              $sum: {
                $cond: [{ $eq: ['$_id.severity', 'CRITICAL'] }, '$count', 0],
              },
            },
            high: {
              $sum: {
                $cond: [{ $eq: ['$_id.severity', 'HIGH'] }, '$count', 0],
              },
            },
            medium: {
              $sum: {
                $cond: [{ $eq: ['$_id.severity', 'MEDIUM'] }, '$count', 0],
              },
            },
            low: {
              $sum: { $cond: [{ $eq: ['$_id.severity', 'LOW'] }, '$count', 0] },
            },
            total: { $sum: '$count' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const trends = trendData.map((item) => ({
      date: item._id,
      critical: item.critical,
      high: item.high,
      medium: item.medium,
      low: item.low,
      total: item.total,
    }));

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Error fetching vulnerability trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerability trends' },
      { status: 500 }
    );
  }
}
