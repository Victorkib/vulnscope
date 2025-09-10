import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { safeSyncToSupabase } from '@/lib/supabase-config';
import type { 
  ThreatActor,
  ThreatActorIntelligenceResponse,
  ThreatActorIntelligenceData,
  ThreatActorFilters,
  ThreatActorSearchOptions
} from '@/types/threat-actor';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'last_seen';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const searchQuery = searchParams.get('query') || '';

    // Parse filters
    const filters: ThreatActorFilters = {};
    if (searchParams.get('type')) {
      filters.type = searchParams.get('type')?.split(',') || [];
    }
    if (searchParams.get('country')) {
      filters.country = searchParams.get('country')?.split(',') || [];
    }
    if (searchParams.get('threatLevel')) {
      filters.threatLevel = searchParams.get('threatLevel')?.split(',') || [];
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')?.split(',') || [];
    }

    // Use centralized Supabase configuration to fetch global threat actor data
    const threatActorData = await safeSyncToSupabase(async (supabase) => {
      // Fetch global threat actor data (like vulnerabilities system)
      let query = supabase
        .from('threat_actors')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }
      if (filters.country && filters.country.length > 0) {
        query = query.in('country', filters.country);
      }
      if (filters.threatLevel && filters.threatLevel.length > 0) {
        query = query.in('threat_level', filters.threatLevel);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Apply search query
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data: threatActors, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch threat actors: ${fetchError.message}`);
      }

      const finalThreatActors = threatActors || [];

      // Get related data - fall back to sample data if no user-specific data exists
      const [campaignsRes, attributionsRes, statsRes] = await Promise.all([
        supabase
          .from('apt_campaigns')
          .select('*')
          .limit(100),
        supabase
          .from('threat_attributions')
          .select('*')
          .limit(100),
        supabase
          .from('threat_actor_intelligence_stats')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
      ]);

      // Use global data (like vulnerabilities system)
      const finalCampaigns = campaignsRes.data || [];
      const finalAttributions = attributionsRes.data || [];

      // Calculate statistics using final threat actors data
      const statistics = {
        totalActors: finalThreatActors?.length || 0,
        activeActors: finalThreatActors?.filter(ta => ta.status === 'ACTIVE').length || 0,
        dormantActors: finalThreatActors?.filter(ta => ta.status === 'DORMANT').length || 0,
        disruptedActors: finalThreatActors?.filter(ta => ta.status === 'DISRUPTED').length || 0,
        byType: {} as Record<string, number>,
        byCountry: {} as Record<string, number>,
        byThreatLevel: {} as Record<string, number>,
        bySector: {} as Record<string, number>,
        averageCapability: 0,
        topTechniques: [] as Array<{ technique: string; count: number }>,
        topTools: [] as Array<{ tool: string; count: number }>,
        recentActivity: 0,
        attributionAccuracy: 85 // Placeholder
      };

      // Calculate type distribution
      finalThreatActors?.forEach(actor => {
        statistics.byType[actor.type] = (statistics.byType[actor.type] || 0) + 1;
        if (actor.country) {
          statistics.byCountry[actor.country] = (statistics.byCountry[actor.country] || 0) + 1;
        }
        statistics.byThreatLevel[actor.threat_level] = (statistics.byThreatLevel[actor.threat_level] || 0) + 1;
      });

      // Calculate average capability
      if (finalThreatActors && finalThreatActors.length > 0) {
        const totalCapability = finalThreatActors.reduce((sum, actor) => {
          const capabilities = actor.capabilities;
          if (capabilities && capabilities.operational) {
            return sum + (capabilities.operational.sophistication || 0);
          }
          return sum;
        }, 0);
        statistics.averageCapability = Math.round(totalCapability / finalThreatActors.length);
      }

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      statistics.recentActivity = finalThreatActors?.filter(actor => 
        new Date(actor.last_seen) > thirtyDaysAgo
      ).length || 0;

      // Transform database records to match TypeScript interface
      const transformedThreatActors: ThreatActor[] = (finalThreatActors || []).map(actor => ({
        id: actor.id,
        name: actor.name,
        aliases: actor.aliases || [],
        type: actor.type,
        country: actor.country,
        region: actor.region,
        description: actor.description || '',
        motivation: actor.motivation || [],
        capabilities: actor.capabilities || {
          technical: { level: 'INTERMEDIATE', specialties: [], tools: [], languages: [] },
          operational: { persistence: 50, stealth: 50, sophistication: 50, resources: 50 },
          intelligence: { reconnaissance: 50, socialEngineering: 50, targetSelection: 50, operationalSecurity: 50 }
        },
        tactics: actor.tactics || [],
        techniques: actor.techniques || [],
        tools: actor.tools || [],
        infrastructure: actor.infrastructure || {
          domains: [], ipAddresses: [], emailAddresses: [], socialMediaAccounts: [],
          cryptocurrencyWallets: [], cloudServices: [], hostingProviders: [], registrars: [],
          certificates: [], malwareFamilies: [], c2Servers: [], lastUpdated: new Date().toISOString()
        },
        targets: actor.targets || {
          sectors: [], countries: [], organizations: [], technologies: [], attackVectors: [],
          timePatterns: { preferredHours: [], preferredDays: [], timezone: 'UTC' },
          geographicFocus: { primary: [], secondary: [], excluded: [] }
        },
        timeline: actor.timeline || {
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          activityPeriods: [], campaigns: [], incidents: [], milestones: []
        },
        attribution: actor.attribution || {
          confidence: 50, evidence: [], assessments: [], lastAssessed: new Date().toISOString(), assessor: user.email || 'Unknown'
        },
        threatLevel: actor.threat_level,
        confidence: actor.confidence || 50,
        lastSeen: actor.last_seen,
        status: actor.status,
        metadata: actor.metadata || {},
        createdAt: actor.created_at,
        updatedAt: actor.updated_at
      }));

      const intelligenceData: ThreatActorIntelligenceData = {
        threatActors: transformedThreatActors,
        campaigns: finalCampaigns,
        attributions: finalAttributions,
        statistics,
        trends: {
          activityOverTime: [],
          capabilityEvolution: [],
          techniqueAdoption: [],
          targetEvolution: [],
          geographicShifts: []
        },
        correlations: {
          actorRelationships: [],
          campaignOverlaps: [],
          techniqueCorrelations: []
        }
      };

      return intelligenceData;
    }, null);

    // If Supabase sync failed, return fallback data
    if (!threatActorData) {
      return NextResponse.json({
        success: true,
        data: {
          threatActors: [],
          campaigns: [],
          attributions: [],
          statistics: {
            totalActors: 0,
            activeActors: 0,
            dormantActors: 0,
            disruptedActors: 0,
            byType: {},
            byCountry: {},
            byThreatLevel: {},
            bySector: {},
            averageCapability: 0,
            topTechniques: [],
            topTools: [],
            recentActivity: 0,
            attributionAccuracy: 0
          },
          trends: {
            activityOverTime: [],
            capabilityEvolution: [],
            techniqueAdoption: [],
            targetEvolution: [],
            geographicShifts: []
          },
          correlations: {
            actorRelationships: [],
            campaignOverlaps: [],
            techniqueCorrelations: []
          }
        },
        lastUpdated: new Date().toISOString(),
        metadata: {
          totalActors: 0,
          activeActors: 0,
          highThreatActors: 0,
          recentActivity: 0
        }
      });
    }

    const response: ThreatActorIntelligenceResponse = {
      success: true,
      data: threatActorData,
      lastUpdated: new Date().toISOString(),
      metadata: {
        totalActors: threatActorData.statistics.totalActors,
        activeActors: threatActorData.statistics.activeActors,
        highThreatActors: (threatActorData.statistics.byThreatLevel['HIGH'] || 0) + (threatActorData.statistics.byThreatLevel['CRITICAL'] || 0),
        recentActivity: threatActorData.statistics.recentActivity
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching threat actor intelligence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threat actor intelligence' },
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
    const threatActorData: Partial<ThreatActor> = body;

    // Validate required fields
    if (!threatActorData.name || !threatActorData.type || !threatActorData.threatLevel) {
      return NextResponse.json(
        { error: 'name, type, and threatLevel are required' },
        { status: 400 }
      );
    }

    // Use centralized Supabase configuration
    const result = await safeSyncToSupabase(async (supabase) => {
      // Create threat actor
      const newThreatActor = {
        user_id: user.id,
        name: threatActorData.name,
        aliases: threatActorData.aliases || [],
        type: threatActorData.type,
        country: threatActorData.country || null,
        region: threatActorData.region || null,
        description: threatActorData.description || null,
        motivation: threatActorData.motivation || [],
        capabilities: threatActorData.capabilities || {
          technical: { level: 'INTERMEDIATE', specialties: [], tools: [], languages: [] },
          operational: { persistence: 50, stealth: 50, sophistication: 50, resources: 50 },
          intelligence: { reconnaissance: 50, socialEngineering: 50, targetSelection: 50, operationalSecurity: 50 }
        },
        tactics: threatActorData.tactics || [],
        techniques: threatActorData.techniques || [],
        tools: threatActorData.tools || [],
        infrastructure: threatActorData.infrastructure || {
          domains: [], ipAddresses: [], emailAddresses: [], socialMediaAccounts: [],
          cryptocurrencyWallets: [], cloudServices: [], hostingProviders: [], registrars: [],
          certificates: [], malwareFamilies: [], c2Servers: [], lastUpdated: new Date().toISOString()
        },
        targets: threatActorData.targets || {
          sectors: [], countries: [], organizations: [], technologies: [], attackVectors: [],
          timePatterns: { preferredHours: [], preferredDays: [], timezone: 'UTC' },
          geographicFocus: { primary: [], secondary: [], excluded: [] }
        },
        timeline: threatActorData.timeline || {
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          activityPeriods: [], campaigns: [], incidents: [], milestones: []
        },
        attribution: threatActorData.attribution || {
          confidence: 50, evidence: [], assessments: [], lastAssessed: new Date().toISOString(), assessor: user.email || 'Unknown'
        },
        threat_level: threatActorData.threatLevel,
        confidence: threatActorData.confidence || 50,
        last_seen: threatActorData.lastSeen || new Date().toISOString(),
        status: threatActorData.status || 'ACTIVE',
        metadata: threatActorData.metadata || {}
      };

      const { data: createdThreatActor, error: insertError } = await supabase
        .from('threat_actors')
        .insert(newThreatActor)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create threat actor: ${insertError.message}`);
      }

      return createdThreatActor;
    }, null);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create threat actor - Supabase configuration missing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Threat actor created successfully'
    });

  } catch (error) {
    console.error('Error creating threat actor:', error);
    return NextResponse.json(
      { error: 'Failed to create threat actor' },
      { status: 500 }
    );
  }
}