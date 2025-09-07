import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { SharedVulnerability } from '@/types/collaboration';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: vulnerabilityId } = await params;
    const body = await request.json();
    const {
      shareWith,
      shareType,
      message,
      permissions = {
        canView: true,
        canComment: true,
        canEdit: false,
        canShare: false,
      },
      expiresAt,
    } = body;

    if (!shareWith || !shareType) {
      return NextResponse.json(
        { error: 'Share target and type are required' },
        { status: 400 }
      );
    }

    if (!['user', 'team'].includes(shareType)) {
      return NextResponse.json(
        { error: 'Share type must be "user" or "team"' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<SharedVulnerability>('shared_vulnerabilities');

    // Check if already shared
    const existingShare = await collection.findOne({
      vulnerabilityId,
      sharedBy: user.id,
      sharedWith,
      shareType,
    });

    if (existingShare) {
      return NextResponse.json(
        { error: 'Vulnerability already shared with this target' },
        { status: 409 }
      );
    }

    const sharedVulnerability: SharedVulnerability = {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vulnerabilityId,
      sharedBy: user.id,
      sharedWith,
      shareType,
      message,
      permissions,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    await collection.insertOne(sharedVulnerability);

    return NextResponse.json(sharedVulnerability, { status: 201 });
  } catch (error) {
    console.error('Error sharing vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to share vulnerability' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: vulnerabilityId } = await params;
    const db = await getDatabase();
    const collection = db.collection<SharedVulnerability>('shared_vulnerabilities');

    // Get shares where user is the sharer or the target
    const shares = await collection
      .find({
        vulnerabilityId,
        $or: [
          { sharedBy: user.id },
          { sharedWith: user.id }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Remove MongoDB _id fields
    const cleanShares = shares.map(({ _id, ...share }) => share);

    return NextResponse.json(cleanShares);
  } catch (error) {
    console.error('Error fetching vulnerability shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerability shares' },
      { status: 500 }
    );
  }
}
