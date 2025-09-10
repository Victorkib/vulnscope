import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import type { 
  ThreatLandscapeData, 
  SecurityPosture,
  IntelligenceStats 
} from '@/types/intelligence';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dataType, data, options = {} } = body;

    if (!dataType || !data) {
      return NextResponse.json(
        { error: 'dataType and data are required' },
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

    let result;

    switch (dataType) {
      case 'threat-landscape':
        result = await syncThreatLandscapeData(supabase, user.id, data, options);
        break;
      
      case 'security-posture':
        result = await syncSecurityPostureData(supabase, user.id, data, options);
        break;
      
      case 'intelligence-stats':
        result = await syncIntelligenceStats(supabase, user.id, data, options);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid dataType' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `${dataType} data synced successfully`
    });

  } catch (error) {
    console.error('Error syncing intelligence data:', error);
    return NextResponse.json(
      { error: 'Failed to sync intelligence data' },
      { status: 500 }
    );
  }
}

async function syncThreatLandscapeData(
  supabase: any,
  userId: string,
  data: ThreatLandscapeData,
  options: any
) {
  const { viewType = 'global', timeframe = '30d', region, sector } = options;

  // Check if record exists
  const { data: existingData, error: fetchError } = await supabase
    .from('intelligence_threat_landscape')
    .select('id')
    .eq('user_id', userId)
    .eq('view_type', viewType)
    .eq('timeframe', timeframe)
    .eq('region', region || null)
    .eq('sector', sector || null)
    .single();

  const recordData = {
    user_id: userId,
    data: data,
    view_type: viewType,
    timeframe: timeframe,
    region: region || null,
    sector: sector || null,
    updated_at: new Date().toISOString()
  };

  if (existingData && !fetchError) {
    // Update existing record
    const { data: updatedData, error: updateError } = await supabase
      .from('intelligence_threat_landscape')
      .update(recordData)
      .eq('id', existingData.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update threat landscape data: ${updateError.message}`);
    }

    return updatedData;
  } else {
    // Insert new record
    const { data: newData, error: insertError } = await supabase
      .from('intelligence_threat_landscape')
      .insert(recordData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert threat landscape data: ${insertError.message}`);
    }

    return newData;
  }
}

async function syncSecurityPostureData(
  supabase: any,
  userId: string,
  data: SecurityPosture,
  options: any
) {
  const { organizationId } = options;

  // Check if record exists
  const { data: existingData, error: fetchError } = await supabase
    .from('intelligence_security_posture')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId || userId)
    .single();

  const recordData = {
    user_id: userId,
    organization_id: organizationId || userId,
    data: data,
    risk_score: data.riskScore,
    vulnerability_exposure: data.vulnerabilityExposure,
    patch_compliance: data.patchCompliance,
    security_maturity: data.securityMaturity,
    threat_level: data.metrics.threatLevel,
    updated_at: new Date().toISOString()
  };

  if (existingData && !fetchError) {
    // Update existing record
    const { data: updatedData, error: updateError } = await supabase
      .from('intelligence_security_posture')
      .update(recordData)
      .eq('id', existingData.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update security posture data: ${updateError.message}`);
    }

    return updatedData;
  } else {
    // Insert new record
    const { data: newData, error: insertError } = await supabase
      .from('intelligence_security_posture')
      .insert(recordData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert security posture data: ${insertError.message}`);
    }

    return newData;
  }
}

async function syncIntelligenceStats(
  supabase: any,
  userId: string,
  data: IntelligenceStats,
  options: any
) {
  // Check if record exists
  const { data: existingData, error: fetchError } = await supabase
    .from('intelligence_stats')
    .select('id')
    .eq('user_id', userId)
    .single();

  const recordData = {
    user_id: userId,
    data: data,
    total_threats: data.totalThreats,
    active_threats: data.activeThreats,
    new_threats: data.newThreats,
    resolved_threats: data.resolvedThreats,
    threat_actors: data.threatActors,
    attack_vectors: data.attackVectors,
    zero_days: data.zeroDays,
    security_posture_score: data.securityPostureScore,
    compliance_score: data.complianceScore,
    prediction_accuracy: data.predictionAccuracy,
    updated_at: new Date().toISOString()
  };

  if (existingData && !fetchError) {
    // Update existing record
    const { data: updatedData, error: updateError } = await supabase
      .from('intelligence_stats')
      .update(recordData)
      .eq('id', existingData.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update intelligence stats: ${updateError.message}`);
    }

    return updatedData;
  } else {
    // Insert new record
    const { data: newData, error: insertError } = await supabase
      .from('intelligence_stats')
      .insert(recordData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert intelligence stats: ${insertError.message}`);
    }

    return newData;
  }
}

// GET endpoint to retrieve synced data
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('dataType');

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

    let result;

    switch (dataType) {
      case 'threat-landscape':
        const { data: threatData, error: threatError } = await supabase
          .from('intelligence_threat_landscape')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (threatError && threatError.code !== 'PGRST116') {
          throw new Error(`Failed to fetch threat landscape data: ${threatError.message}`);
        }

        result = threatData;
        break;
      
      case 'security-posture':
        const { data: postureData, error: postureError } = await supabase
          .from('intelligence_security_posture')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (postureError && postureError.code !== 'PGRST116') {
          throw new Error(`Failed to fetch security posture data: ${postureError.message}`);
        }

        result = postureData;
        break;
      
      case 'intelligence-stats':
        const { data: statsData, error: statsError } = await supabase
          .from('intelligence_stats')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (statsError && statsError.code !== 'PGRST116') {
          throw new Error(`Failed to fetch intelligence stats: ${statsError.message}`);
        }

        result = statsData;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid dataType' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      lastUpdated: result?.updated_at || null
    });

  } catch (error) {
    console.error('Error fetching synced intelligence data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch synced intelligence data' },
      { status: 500 }
    );
  }
}

