import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { AlertTrigger } from '@/types/alert';

export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const trigger: AlertTrigger = body;

    const db = await getDatabase();
    const collection = db.collection<AlertTrigger>('alert_triggers');

    await collection.insertOne(trigger);

    return NextResponse.json(trigger, { status: 201 });
  } catch (error) {
    console.error('Error creating alert trigger:', error);
    return NextResponse.json(
      { error: 'Failed to create alert trigger' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDatabase();
    const collection = db.collection<AlertTrigger>('alert_triggers');

    const triggers = await collection
      .find({ userId: user.id })
      .sort({ triggeredAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Remove MongoDB _id fields
    const cleanTriggers = triggers.map(({ _id, ...trigger }) => trigger);

    return NextResponse.json(cleanTriggers);
  } catch (error) {
    console.error('Error fetching alert triggers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert triggers' },
      { status: 500 }
    );
  }
}
