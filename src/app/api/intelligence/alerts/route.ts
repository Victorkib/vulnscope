import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import type { IntelligenceAlert } from '@/types/intelligence';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabase
      .from('intelligence_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: alerts, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch alerts: ${fetchError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: alerts || [],
      count: alerts?.length || 0
    });

  } catch (error) {
    console.error('Error fetching intelligence alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch intelligence alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      type, 
      severity, 
      title, 
      description, 
      source, 
      confidence,
      affectedSystems,
      recommendedActions,
      relatedIntelligence,
      expiresAt
    } = body;

    // Validate required fields
    if (!type || !severity || !title) {
      return NextResponse.json(
        { error: 'type, severity, and title are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create alert
    const alertData = {
      user_id: user.id,
      type,
      severity,
      title,
      description: description || null,
      source: source || 'System Generated',
      confidence: confidence || 85,
      affected_systems: affectedSystems || null,
      recommended_actions: recommendedActions || null,
      related_intelligence: relatedIntelligence || null,
      expires_at: expiresAt || null,
      acknowledged: false
    };

    const { data: newAlert, error: insertError } = await supabase
      .from('intelligence_alerts')
      .insert(alertData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create alert: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: newAlert,
      message: 'Intelligence alert created successfully'
    });

  } catch (error) {
    console.error('Error creating intelligence alert:', error);
    return NextResponse.json(
      { error: 'Failed to create intelligence alert' },
      { status: 500 }
    );
  }
}

// PUT endpoint to acknowledge alerts
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, acknowledged } = body;

    if (!alertId || typeof acknowledged !== 'boolean') {
      return NextResponse.json(
        { error: 'alertId and acknowledged are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update alert
    const updateData: any = {
      acknowledged,
      updated_at: new Date().toISOString()
    };

    if (acknowledged) {
      updateData.acknowledged_by = user.id;
      updateData.acknowledged_at = new Date().toISOString();
    } else {
      updateData.acknowledged_by = null;
      updateData.acknowledged_at = null;
    }

    const { data: updatedAlert, error: updateError } = await supabase
      .from('intelligence_alerts')
      .update(updateData)
      .eq('id', alertId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update alert: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: updatedAlert,
      message: `Alert ${acknowledged ? 'acknowledged' : 'unacknowledged'} successfully`
    });

  } catch (error) {
    console.error('Error updating intelligence alert:', error);
    return NextResponse.json(
      { error: 'Failed to update intelligence alert' },
      { status: 500 }
    );
  }
}

