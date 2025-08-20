import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import type { Vulnerability } from '@/types/vulnerability';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '10');

    const db = await getDatabase();
    const collection = db.collection<Vulnerability>('vulnerabilities');

    const topSoftware = await collection
      .aggregate([
        { $unwind: '$affectedSoftware' },
        {
          $group: {
            _id: '$affectedSoftware',
            count: { $sum: 1 },
            criticalCount: {
              $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] },
            },
            highCount: {
              $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] },
            },
            mediumCount: {
              $sum: { $cond: [{ $eq: ['$severity', 'MEDIUM'] }, 1, 0] },
            },
            lowCount: {
              $sum: { $cond: [{ $eq: ['$severity', 'LOW'] }, 1, 0] },
            },
            latestVulnerability: { $max: '$publishedDate' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
          $project: {
            name: '$_id',
            count: 1,
            criticalCount: 1,
            highCount: 1,
            mediumCount: 1,
            lowCount: 1,
            latestVulnerability: 1,
            _id: 0,
          },
        },
      ])
      .toArray();

    return NextResponse.json(topSoftware);
  } catch (error) {
    console.error('Error fetching top affected software:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top affected software' },
      { status: 500 }
    );
  }
}
