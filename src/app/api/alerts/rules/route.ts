import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { AlertRule } from '@/types/alert';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const db = await getDatabase();
    const collection = db.collection<AlertRule>('alert_rules');

    // Build query
    const query: any = { userId: user.id };
    if (active === 'true') {
      query.isActive = true;
    }

    const rules = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Remove MongoDB _id fields
    const cleanRules = rules.map(({ _id, ...rule }) => rule);

    return NextResponse.json(cleanRules);
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      conditions,
      actions,
      cooldownMinutes = 60,
    } = body;

    if (!name || !conditions || !actions) {
      return NextResponse.json(
        { error: 'Name, conditions, and actions are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<AlertRule>('alert_rules');

    const alertRule: AlertRule = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      name,
      description,
      conditions,
      actions,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: 0,
      cooldownMinutes,
    };

    await collection.insertOne(alertRule);

    return NextResponse.json(alertRule, { status: 201 });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    );
  }
}
