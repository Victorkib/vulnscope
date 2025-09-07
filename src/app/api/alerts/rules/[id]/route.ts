import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { ObjectId } from 'mongodb';
import type { AlertRule } from '@/types/alert';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid alert rule ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<AlertRule>('alert_rules');

    const rule = await collection.findOne({ 
      _id: new ObjectId(id),
      userId: user.id 
    });

    if (!rule) {
      return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
    }

    // Remove MongoDB _id field
    const { _id, ...cleanRule } = rule;

    return NextResponse.json(cleanRule);
  } catch (error) {
    console.error('Error fetching alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid alert rule ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<AlertRule>('alert_rules');

    // Check if rule exists and belongs to user
    const existingRule = await collection.findOne({ 
      _id: new ObjectId(id),
      userId: user.id 
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
    }

    const updateData = {
      name,
      description,
      conditions,
      actions,
      cooldownMinutes,
      updatedAt: new Date().toISOString(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
    }

    // Return updated rule
    const updatedRule = await collection.findOne({ _id: new ObjectId(id) });
    const { _id, ...cleanRule } = updatedRule!;

    return NextResponse.json(cleanRule);
  } catch (error) {
    console.error('Error updating alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid alert rule ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<AlertRule>('alert_rules');

    // Check if rule exists and belongs to user
    const existingRule = await collection.findOne({ 
      _id: new ObjectId(id),
      userId: user.id 
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
    }

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
    }

    // Return updated rule
    const updatedRule = await collection.findOne({ _id: new ObjectId(id) });
    const { _id, ...cleanRule } = updatedRule!;

    return NextResponse.json(cleanRule);
  } catch (error) {
    console.error('Error updating alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid alert rule ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<AlertRule>('alert_rules');

    const result = await collection.deleteOne({ 
      _id: new ObjectId(id),
      userId: user.id 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Alert rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
}