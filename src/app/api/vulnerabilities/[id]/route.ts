import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { ObjectId } from 'mongodb';
import type { Vulnerability } from '@/types/vulnerability';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const db = await getDatabase();
    const collection = db.collection<Vulnerability>('vulnerabilities');

    // Try to find by CVE ID first, then by MongoDB ObjectId
    let vulnerability = await collection.findOne({ cveId: id });

    if (!vulnerability && ObjectId.isValid(id)) {
      vulnerability = await collection.findOne({ _id: new ObjectId(id) });
    }

    if (!vulnerability) {
      return NextResponse.json(
        { error: 'Vulnerability not found' },
        { status: 404 }
      );
    }

    // Track vulnerability view for authenticated users
    try {
      const { user } = await getServerUser();
      if (user) {
        const activityCollection = db.collection('user_activity');
        await activityCollection.insertOne({
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          type: 'view',
          description: `Viewed vulnerability ${vulnerability.cveId}`,
          vulnerabilityId: vulnerability.cveId,
          timestamp: new Date().toISOString(),
          metadata: {
            source: 'vulnerability_detail_page',
            severity: vulnerability.severity,
            title: vulnerability.title,
            publishedDate: vulnerability.publishedDate,
            cvssScore: vulnerability.cvssScore,
          },
        });
      }
    } catch (viewError) {
      // Don't fail the request if view tracking fails
      console.warn('Failed to track vulnerability view:', viewError);
    }

    return NextResponse.json(vulnerability);
  } catch (error) {
    console.error('Error fetching vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerability' },
      { status: 500 }
    );
  }
}
