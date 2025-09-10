import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { safeSyncToSupabase } from '@/lib/supabase-config';
import type { 
  ThreatLandscapeData, 
  ThreatLandscapeResponse,
  IntelligenceFilters 
} from '@/types/intelligence';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'global';
    const region = searchParams.get('region');
    const sector = searchParams.get('sector');
    const timeframe = searchParams.get('timeframe') || '30d';

    const db = await getDatabase();
    const vulnerabilitiesCollection = db.collection('vulnerabilities');
    const userPreferencesCollection = db.collection('user_preferences');

    // Get user preferences for intelligence settings
    const userPreferences = await userPreferencesCollection.findOne({ userId: user.id });
    const intelligencePrefs = userPreferences?.intelligence || {};

    // Calculate date range based on timeframe
    const now = new Date();
    const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Build aggregation pipeline for threat landscape analysis
    const pipeline = [
      {
        $match: {
          publishedDate: { $gte: startDate.toISOString() },
          ...(region && { 'metadata.geographicRegion': region }),
          ...(sector && { 'metadata.sector': sector })
        }
      },
      {
        $group: {
          _id: null,
          totalVulnerabilities: { $sum: 1 },
          criticalVulns: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
          highVulns: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
          mediumVulns: { $sum: { $cond: [{ $eq: ['$severity', 'MEDIUM'] }, 1, 0] } },
          lowVulns: { $sum: { $cond: [{ $eq: ['$severity', 'LOW'] }, 1, 0] } },
          withExploits: { $sum: { $cond: ['$exploitAvailable', 1, 0] } },
          withPatches: { $sum: { $cond: ['$patchAvailable', 1, 0] } },
          kevVulns: { $sum: { $cond: ['$kev', 1, 0] } },
          trendingVulns: { $sum: { $cond: ['$trending', 1, 0] } },
          avgCvssScore: { $avg: '$cvssScore' },
          affectedSoftware: { $addToSet: '$affectedSoftware' }
        }
      }
    ];

    const [globalStats, geographicData, sectorData, temporalData] = await Promise.all([
      // Global threat statistics
      vulnerabilitiesCollection.aggregate(pipeline).toArray(),
      
      // Geographic threat distribution
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            publishedDate: { $gte: startDate.toISOString() }
          }
        },
        {
          $group: {
            _id: '$metadata.geographicRegion',
            threatCount: { $sum: 1 },
            criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
            highCount: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
            topThreatActors: { $addToSet: '$metadata.threatActor' },
            topAttackVectors: { $addToSet: '$metadata.attackVector' }
          }
        },
        {
          $project: {
            region: '$_id',
            threatCount: 1,
            threatLevel: {
              $cond: {
                if: { $gte: ['$criticalCount', 10] },
                then: 'CRITICAL',
                else: {
                  $cond: {
                    if: { $gte: ['$highCount', 20] },
                    then: 'HIGH',
                    else: {
                      $cond: {
                        if: { $gte: ['$threatCount', 50] },
                        then: 'MEDIUM',
                        else: 'LOW'
                      }
                    }
                  }
                }
              }
            },
            topThreatActors: { $slice: ['$topThreatActors', 5] },
            topAttackVectors: { $slice: ['$topAttackVectors', 5] }
          }
        },
        { $sort: { threatCount: -1 } }
      ]).toArray(),

      // Sector-based threat analysis
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            publishedDate: { $gte: startDate.toISOString() }
          }
        },
        {
          $group: {
            _id: '$metadata.sector',
            threatCount: { $sum: 1 },
            criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
            highCount: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
            vulnerabilities: { $sum: 1 },
            avgPatchTime: { $avg: '$metadata.patchTime' }
          }
        },
        {
          $project: {
            sector: '$_id',
            threatCount: 1,
            vulnerabilities: 1,
            avgPatchTime: { $round: ['$avgPatchTime', 2] },
            threatLevel: {
              $cond: {
                if: { $gte: ['$criticalCount', 15] },
                then: 'CRITICAL',
                else: {
                  $cond: {
                    if: { $gte: ['$highCount', 30] },
                    then: 'HIGH',
                    else: {
                      $cond: {
                        if: { $gte: ['$threatCount', 75] },
                        then: 'MEDIUM',
                        else: 'LOW'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        { $sort: { threatCount: -1 } }
      ]).toArray(),

      // Temporal threat trends
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            publishedDate: { $gte: startDate.toISOString() }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $dateFromString: { dateString: '$publishedDate' } }
              }
            },
            threatCount: { $sum: 1 },
            newThreats: { $sum: 1 },
            resolvedThreats: { $sum: { $cond: ['$patchAvailable', 1, 0] } }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]).toArray()
    ]);

    // Process global statistics
    const globalStatsData = globalStats[0] || {
      totalVulnerabilities: 0,
      criticalVulns: 0,
      highVulns: 0,
      mediumVulns: 0,
      lowVulns: 0,
      withExploits: 0,
      withPatches: 0,
      kevVulns: 0,
      trendingVulns: 0,
      avgCvssScore: 0
    };

    // Calculate global threat level
    const totalThreats = globalStatsData.totalVulnerabilities;
    const criticalRatio = globalStatsData.criticalVulns / totalThreats;
    const highRatio = globalStatsData.highVulns / totalThreats;
    
    let globalThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (criticalRatio > 0.15 || totalThreats > 1000) {
      globalThreatLevel = 'CRITICAL';
    } else if (criticalRatio > 0.1 || highRatio > 0.3 || totalThreats > 500) {
      globalThreatLevel = 'HIGH';
    } else if (criticalRatio > 0.05 || highRatio > 0.2 || totalThreats > 200) {
      globalThreatLevel = 'MEDIUM';
    }

    // Build threat landscape data
    const threatLandscapeData: ThreatLandscapeData = {
      global: {
        totalThreats,
        activeThreats: totalThreats - globalStatsData.withPatches,
        newThreats: totalThreats,
        threatLevel: globalThreatLevel
      },
      geographic: geographicData.map(item => ({
        region: item.region || 'Unknown',
        threatCount: item.threatCount,
        threatLevel: item.threatLevel,
        topThreatActors: item.topThreatActors.filter(Boolean),
        topAttackVectors: item.topAttackVectors.filter(Boolean)
      })),
      sector: sectorData.map(item => ({
        sector: item.sector || 'Unknown',
        threatCount: item.threatCount,
        threatLevel: item.threatLevel,
        vulnerabilities: item.vulnerabilities,
        avgPatchTime: item.avgPatchTime || 0
      })),
      temporal: temporalData.map(item => ({
        date: item._id,
        threatCount: item.threatCount,
        newThreats: item.newThreats,
        resolvedThreats: item.resolvedThreats
      }))
    };

    const response: ThreatLandscapeResponse = {
      success: true,
      data: threatLandscapeData,
      lastUpdated: new Date().toISOString()
    };

    // Sync data with Supabase for real-time updates
    await safeSyncToSupabase(async (client) => {
      return await syncThreatLandscapeData(client, threatLandscapeData, user.id, { viewType: view, timeframe, region, sector });
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching threat landscape data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch threat landscape data',
        data: null,
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to sync threat landscape data with Supabase
async function syncThreatLandscapeData(
  client: ReturnType<typeof import('@/lib/supabase-config').createSupabaseServiceClient>,
  data: ThreatLandscapeData,
  userId: string,
  options: { viewType?: string; timeframe?: string; region?: string; sector?: string }
) {
  const { viewType = 'global', timeframe = '30d', region, sector } = options;

  // Check if record exists
  const { data: existingData, error: fetchError } = await client
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
    const { data: updatedData, error: updateError } = await client
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
    const { data: newData, error: insertError } = await client
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

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filters, preferences } = body;

    // Update user intelligence preferences
    if (preferences) {
      const db = await getDatabase();
      const userPreferencesCollection = db.collection('user_preferences');

      await userPreferencesCollection.updateOne(
        { userId: user.id },
        {
          $set: {
            intelligence: preferences,
            updatedAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );
    }

    // Apply filters and return filtered data
    const filteredResponse = await GET(request);
    return filteredResponse;

  } catch (error) {
    console.error('Error updating threat landscape preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update threat landscape preferences' },
      { status: 500 }
    );
  }
}
