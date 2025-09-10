import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { safeSyncToSupabase } from '@/lib/supabase-config';
import type { IntelligenceStats } from '@/types/intelligence';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';

    const db = await getDatabase();
    const vulnerabilitiesCollection = db.collection('vulnerabilities');
    const userBookmarksCollection = db.collection('user_bookmarks');
    const userActivityCollection = db.collection('user_activity');

    // Calculate date range
    const now = new Date();
    const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Get user's bookmarked vulnerabilities
    const userBookmarks = await userBookmarksCollection
      .find({ userId: user.id })
      .toArray();

    const bookmarkedVulnIds = userBookmarks.map(bookmark => bookmark.vulnerabilityId);

    // Calculate comprehensive intelligence statistics
    const [
      globalThreatStats,
      userThreatStats,
      threatActorStats,
      attackVectorStats,
      zeroDayStats,
      securityPostureStats,
      complianceStats,
      predictionStats
    ] = await Promise.all([
      // Global threat statistics
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            publishedDate: { $gte: startDate.toISOString() }
          }
        },
        {
          $group: {
            _id: null,
            totalThreats: { $sum: 1 },
            activeThreats: { $sum: { $cond: [{ $eq: ['$patchAvailable', false] }, 1, 0] } },
            newThreats: { $sum: 1 },
            resolvedThreats: { $sum: { $cond: ['$patchAvailable', 1, 0] } },
            criticalThreats: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
            highThreats: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
            withExploits: { $sum: { $cond: ['$exploitAvailable', 1, 0] } },
            kevThreats: { $sum: { $cond: ['$kev', 1, 0] } }
          }
        }
      ]).toArray(),

      // User-specific threat statistics
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            cveId: { $in: bookmarkedVulnIds },
            publishedDate: { $gte: startDate.toISOString() }
          }
        },
        {
          $group: {
            _id: null,
            userTotalThreats: { $sum: 1 },
            userActiveThreats: { $sum: { $cond: [{ $eq: ['$patchAvailable', false] }, 1, 0] } },
            userCriticalThreats: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
            userHighThreats: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
            userWithExploits: { $sum: { $cond: ['$exploitAvailable', 1, 0] } },
            userKevThreats: { $sum: { $cond: ['$kev', 1, 0] } },
            avgCvssScore: { $avg: '$cvssScore' }
          }
        }
      ]).toArray(),

      // Threat actor statistics
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            publishedDate: { $gte: startDate.toISOString() },
            'metadata.threatActor': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$metadata.threatActor',
            count: { $sum: 1 },
            avgSeverity: { $avg: '$cvssScore' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray(),

      // Attack vector statistics
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            publishedDate: { $gte: startDate.toISOString() },
            'metadata.attackVector': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$metadata.attackVector',
            count: { $sum: 1 },
            avgSeverity: { $avg: '$cvssScore' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray(),

      // Zero-day statistics (simplified - in real implementation, this would track actual zero-days)
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            publishedDate: { $gte: startDate.toISOString() },
            exploitAvailable: true,
            patchAvailable: false
          }
        },
        {
          $group: {
            _id: null,
            zeroDays: { $sum: 1 },
            criticalZeroDays: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
            highZeroDays: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } }
          }
        }
      ]).toArray(),

      // Security posture statistics
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            cveId: { $in: bookmarkedVulnIds }
          }
        },
        {
          $group: {
            _id: null,
            totalVulns: { $sum: 1 },
            patchedVulns: { $sum: { $cond: ['$patchAvailable', 1, 0] } },
            criticalVulns: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
            highVulns: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
            avgCvssScore: { $avg: '$cvssScore' },
            withExploits: { $sum: { $cond: ['$exploitAvailable', 1, 0] } }
          }
        }
      ]).toArray(),

      // Compliance statistics
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            cveId: { $in: bookmarkedVulnIds }
          }
        },
        {
          $group: {
            _id: null,
            totalVulns: { $sum: 1 },
            patchedVulns: { $sum: { $cond: ['$patchAvailable', 1, 0] } },
            criticalVulns: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
            withExploits: { $sum: { $cond: ['$exploitAvailable', 1, 0] } }
          }
        }
      ]).toArray(),

      // Prediction accuracy statistics (simplified - in real implementation, this would track actual predictions)
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            publishedDate: { $gte: startDate.toISOString() }
          }
        },
        {
          $group: {
            _id: null,
            totalPredictions: { $sum: 1 },
            accuratePredictions: { $sum: { $cond: [{ $gte: ['$cvssScore', 7.0] }, 1, 0] } }
          }
        }
      ]).toArray()
    ]);

    // Process statistics
    const globalStats = globalThreatStats[0] || {
      totalThreats: 0,
      activeThreats: 0,
      newThreats: 0,
      resolvedThreats: 0,
      criticalThreats: 0,
      highThreats: 0,
      withExploits: 0,
      kevThreats: 0
    };

    const userStats = userThreatStats[0] || {
      userTotalThreats: 0,
      userActiveThreats: 0,
      userCriticalThreats: 0,
      userHighThreats: 0,
      userWithExploits: 0,
      userKevThreats: 0,
      avgCvssScore: 0
    };

    const zeroDayData = zeroDayStats[0] || {
      zeroDays: 0,
      criticalZeroDays: 0,
      highZeroDays: 0
    };

    const postureData = securityPostureStats[0] || {
      totalVulns: 0,
      patchedVulns: 0,
      criticalVulns: 0,
      highVulns: 0,
      avgCvssScore: 0,
      withExploits: 0
    };

    const complianceData = complianceStats[0] || {
      totalVulns: 0,
      patchedVulns: 0,
      criticalVulns: 0,
      withExploits: 0
    };

    const predictionData = predictionStats[0] || {
      totalPredictions: 0,
      accuratePredictions: 0
    };

    // Calculate security posture score
    const totalVulns = postureData.totalVulns;
    const patchCompliance = totalVulns > 0 ? (postureData.patchedVulns / totalVulns) * 100 : 100;
    const criticalRatio = totalVulns > 0 ? postureData.criticalVulns / totalVulns : 0;
    const exploitRatio = totalVulns > 0 ? postureData.withExploits / totalVulns : 0;
    const avgCvss = postureData.avgCvssScore || 0;

    const securityPostureScore = Math.min(100, Math.max(0, 
      (patchCompliance * 0.4) + 
      ((1 - criticalRatio) * 30) + 
      ((1 - exploitRatio) * 20) + 
      ((10 - avgCvss) * 10)
    ));

    // Calculate compliance score
    const complianceScore = Math.min(100, 
      (patchCompliance * 0.4) + 
      ((1 - criticalRatio) * 30) + 
      ((1 - exploitRatio) * 20) + 
      (complianceData.criticalVulns === 0 ? 10 : 0)
    );

    // Calculate prediction accuracy
    const predictionAccuracy = predictionData.totalPredictions > 0 ? 
      (predictionData.accuratePredictions / predictionData.totalPredictions) * 100 : 85;

    // Build intelligence stats
    const intelligenceStats: IntelligenceStats = {
      totalThreats: globalStats.totalThreats,
      activeThreats: globalStats.activeThreats,
      newThreats: globalStats.newThreats,
      resolvedThreats: globalStats.resolvedThreats,
      threatActors: threatActorStats.length,
      attackVectors: attackVectorStats.length,
      zeroDays: zeroDayData.zeroDays,
      securityPostureScore: Math.round(securityPostureScore),
      complianceScore: Math.round(complianceScore),
      predictionAccuracy: Math.round(predictionAccuracy),
      lastUpdated: new Date().toISOString()
    };

    const response = {
      success: true,
      data: intelligenceStats,
      lastUpdated: new Date().toISOString()
    };

    // Sync data with Supabase for real-time updates
    await safeSyncToSupabase(async (client) => {
      return await syncIntelligenceStats(client, intelligenceStats, user.id);
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching intelligence stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch intelligence statistics',
        data: null,
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to sync intelligence stats with Supabase
async function syncIntelligenceStats(
  client: ReturnType<typeof import('@/lib/supabase-config').createSupabaseServiceClient>,
  data: IntelligenceStats,
  userId: string
) {

  // Check if record exists
  const { data: existingData, error: fetchError } = await client
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
    const { data: updatedData, error: updateError } = await client
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
    const { data: newData, error: insertError } = await client
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
