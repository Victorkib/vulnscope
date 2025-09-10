import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { safeSyncToSupabase } from '@/lib/supabase-config';
import type { 
  SecurityPosture, 
  SecurityPostureResponse,
  SecurityRecommendation 
} from '@/types/intelligence';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || user.id;
    const includeRecommendations = searchParams.get('includeRecommendations') === 'true';

    const db = await getDatabase();
    const vulnerabilitiesCollection = db.collection('vulnerabilities');
    const userBookmarksCollection = db.collection('user_bookmarks');
    const userActivityCollection = db.collection('user_activity');

    // Get user's bookmarked vulnerabilities (representing their infrastructure)
    const userBookmarks = await userBookmarksCollection
      .find({ userId: user.id })
      .toArray();

    const bookmarkedVulnIds = userBookmarks.map(bookmark => bookmark.vulnerabilityId);

    // Calculate security posture metrics
    const [
      vulnerabilityStats,
      patchStats,
      activityStats,
      exposureAnalysis
    ] = await Promise.all([
      // Vulnerability statistics
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            cveId: { $in: bookmarkedVulnIds }
          }
        },
        {
          $group: {
            _id: null,
            totalVulnerabilities: { $sum: 1 },
            criticalVulnerabilities: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
            highVulnerabilities: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
            mediumVulnerabilities: { $sum: { $cond: [{ $eq: ['$severity', 'MEDIUM'] }, 1, 0] } },
            lowVulnerabilities: { $sum: { $cond: [{ $eq: ['$severity', 'LOW'] }, 1, 0] } },
            withExploits: { $sum: { $cond: ['$exploitAvailable', 1, 0] } },
            withPatches: { $sum: { $cond: ['$patchAvailable', 1, 0] } },
            kevVulns: { $sum: { $cond: ['$kev', 1, 0] } },
            avgCvssScore: { $avg: '$cvssScore' },
            maxCvssScore: { $max: '$cvssScore' }
          }
        }
      ]).toArray(),

      // Patch management statistics
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            cveId: { $in: bookmarkedVulnIds },
            patchAvailable: true
          }
        },
        {
          $project: {
            publishedDate: 1,
            patchDate: 1,
            severity: 1,
            cvssScore: 1,
            patchTime: {
              $divide: [
                {
                  $subtract: [
                    { $dateFromString: { dateString: '$patchDate' } },
                    { $dateFromString: { dateString: '$publishedDate' } }
                  ]
                },
                86400000 // Convert to days
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            patchedVulnerabilities: { $sum: 1 },
            avgPatchTime: { $avg: '$patchTime' },
            criticalPatchTime: {
              $avg: {
                $cond: [
                  { $eq: ['$severity', 'CRITICAL'] },
                  '$patchTime',
                  null
                ]
              }
            },
            highPatchTime: {
              $avg: {
                $cond: [
                  { $eq: ['$severity', 'HIGH'] },
                  '$patchTime',
                  null
                ]
              }
            }
          }
        }
      ]).toArray(),

      // User activity and engagement
      userActivityCollection.aggregate([
        {
          $match: {
            userId: user.id,
            timestamp: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            avgDuration: { $avg: '$metadata.duration' }
          }
        }
      ]).toArray(),

      // Exposure analysis
      vulnerabilitiesCollection.aggregate([
        {
          $match: {
            cveId: { $in: bookmarkedVulnIds }
          }
        },
        {
          $group: {
            _id: '$affectedSoftware',
            count: { $sum: 1 },
            maxSeverity: { $max: '$cvssScore' },
            hasExploits: { $sum: { $cond: ['$exploitAvailable', 1, 0] } }
          }
        },
        {
          $project: {
            software: '$_id',
            vulnerabilityCount: '$count',
            maxSeverity: 1,
            hasExploits: 1,
            exposureScore: {
              $add: [
                { $multiply: ['$maxSeverity', 10] },
                { $multiply: ['$count', 2] },
                { $multiply: ['$hasExploits', 5] }
              ]
            }
          }
        },
        { $sort: { exposureScore: -1 } },
        { $limit: 10 }
      ]).toArray()
    ]);

    // Process statistics
    const vulnStats = vulnerabilityStats[0] || {
      totalVulnerabilities: 0,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      mediumVulnerabilities: 0,
      lowVulnerabilities: 0,
      withExploits: 0,
      withPatches: 0,
      kevVulns: 0,
      avgCvssScore: 0,
      maxCvssScore: 0
    };

    const patchStatsData = patchStats[0] || {
      patchedVulnerabilities: 0,
      avgPatchTime: 0,
      criticalPatchTime: 0,
      highPatchTime: 0
    };

    // Calculate risk score (0-100)
    const totalVulns = vulnStats.totalVulnerabilities;
    const criticalRatio = totalVulns > 0 ? vulnStats.criticalVulnerabilities / totalVulns : 0;
    const highRatio = totalVulns > 0 ? vulnStats.highVulnerabilities / totalVulns : 0;
    const exploitRatio = totalVulns > 0 ? vulnStats.withExploits / totalVulns : 0;
    const kevRatio = totalVulns > 0 ? vulnStats.kevVulns / totalVulns : 0;
    const avgCvss = vulnStats.avgCvssScore || 0;

    const riskScore = Math.min(100, Math.max(0, 
      (criticalRatio * 40) + 
      (highRatio * 25) + 
      (exploitRatio * 20) + 
      (kevRatio * 10) + 
      (avgCvss * 5)
    ));

    // Calculate vulnerability exposure score
    const exposureScore = Math.min(100, Math.max(0, 
      (totalVulns * 0.5) + 
      (vulnStats.withExploits * 2) + 
      (vulnStats.kevVulns * 3) + 
      (avgCvss * 5)
    ));

    // Calculate patch compliance score
    const patchCompliance = totalVulns > 0 ? 
      Math.min(100, (vulnStats.withPatches / totalVulns) * 100) : 100;

    // Calculate security maturity score based on user activity
    const activityData = activityStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const engagementScore = Math.min(100, 
      (activityData.view || 0) * 0.1 +
      (activityData.bookmark || 0) * 0.5 +
      (activityData.comment || 0) * 1 +
      (activityData.export || 0) * 0.3
    );

    const securityMaturity = Math.min(100, 
      (patchCompliance * 0.4) + 
      (engagementScore * 0.3) + 
      (Math.max(0, 100 - exposureScore) * 0.3)
    );

    // Determine threat level
    let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (riskScore >= 80 || vulnStats.criticalVulnerabilities >= 5) {
      threatLevel = 'CRITICAL';
    } else if (riskScore >= 60 || vulnStats.criticalVulnerabilities >= 2 || vulnStats.highVulnerabilities >= 10) {
      threatLevel = 'HIGH';
    } else if (riskScore >= 40 || vulnStats.highVulnerabilities >= 5) {
      threatLevel = 'MEDIUM';
    }

    // Generate improvement areas
    const improvementAreas: string[] = [];
    if (patchCompliance < 80) improvementAreas.push('Improve patch management');
    if (exposureScore > 60) improvementAreas.push('Reduce vulnerability exposure');
    if (vulnStats.withExploits > 0) improvementAreas.push('Address exploitable vulnerabilities');
    if (vulnStats.kevVulns > 0) improvementAreas.push('Prioritize KEV vulnerabilities');
    if (securityMaturity < 60) improvementAreas.push('Enhance security practices');

    // Generate recommendations if requested
    let recommendations: SecurityRecommendation[] = [];
    if (includeRecommendations) {
      recommendations = generateSecurityRecommendations(vulnStats, patchStatsData, exposureAnalysis);
    }

    // Calculate trends (simplified - in real implementation, compare with historical data)
    const trends = {
      riskTrend: (riskScore > 60 ? 'declining' : riskScore < 30 ? 'improving' : 'stable') as 'declining' | 'improving' | 'stable',
      patchTrend: (patchCompliance > 80 ? 'improving' : patchCompliance < 60 ? 'declining' : 'stable') as 'declining' | 'improving' | 'stable',
      exposureTrend: (exposureScore < 40 ? 'improving' : exposureScore > 70 ? 'declining' : 'stable') as 'declining' | 'improving' | 'stable'
    };

    // Build security posture data
    const securityPosture: SecurityPosture = {
      id: `posture_${user.id}_${Date.now()}`,
      organizationId,
      riskScore: Math.round(riskScore),
      vulnerabilityExposure: Math.round(exposureScore),
      patchCompliance: Math.round(patchCompliance),
      securityMaturity: Math.round(securityMaturity),
      lastAssessed: new Date().toISOString(),
      improvementAreas,
      complianceStatus: {
        gdpr: patchCompliance > 80 && exposureScore < 50,
        sox: patchCompliance > 85 && vulnStats.criticalVulnerabilities === 0,
        hipaa: patchCompliance > 90 && exposureScore < 40,
        pci: patchCompliance > 95 && vulnStats.withExploits === 0,
        iso27001: securityMaturity > 70,
        nist: patchCompliance > 80 && securityMaturity > 60
      },
      metrics: {
        totalVulnerabilities: totalVulns,
        criticalVulnerabilities: vulnStats.criticalVulnerabilities,
        highVulnerabilities: vulnStats.highVulnerabilities,
        mediumVulnerabilities: vulnStats.mediumVulnerabilities,
        lowVulnerabilities: vulnStats.lowVulnerabilities,
        patchedVulnerabilities: vulnStats.withPatches,
        averagePatchTime: Math.round(patchStatsData.avgPatchTime || 0),
        exposureScore: Math.round(exposureScore),
        threatLevel
      },
      recommendations,
      trends
    };

    const response: SecurityPostureResponse = {
      success: true,
      data: securityPosture,
      lastUpdated: new Date().toISOString()
    };

    // Sync data with Supabase for real-time updates
    await safeSyncToSupabase(async (client) => {
      return await syncSecurityPostureData(client, securityPosture, user.id, { organizationId });
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching security posture data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch security posture data',
        data: null,
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to sync security posture data with Supabase
async function syncSecurityPostureData(
  client: ReturnType<typeof import('@/lib/supabase-config').createSupabaseServiceClient>,
  data: SecurityPosture,
  userId: string,
  options: { organizationId?: string }
) {
  const { organizationId } = options;

  // Check if record exists
  const { data: existingData, error: fetchError } = await client
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
    const { data: updatedData, error: updateError } = await client
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
    const { data: newData, error: insertError } = await client
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

function generateSecurityRecommendations(
  vulnStats: any,
  patchStats: any,
  exposureAnalysis: any[]
): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  // Critical vulnerability recommendations
  if (vulnStats.criticalVulnerabilities > 0) {
    recommendations.push({
      id: `rec_critical_${Date.now()}`,
      category: 'patch',
      priority: 'CRITICAL',
      title: 'Address Critical Vulnerabilities',
      description: `You have ${vulnStats.criticalVulnerabilities} critical vulnerabilities that require immediate attention.`,
      impact: 'High risk of system compromise and data breach',
      effort: 'HIGH',
      timeframe: 'Immediate (within 24 hours)',
      resources: ['Security team', 'System administrators', 'Emergency patching procedures'],
      relatedVulnerabilities: []
    });
  }

  // Exploitable vulnerability recommendations
  if (vulnStats.withExploits > 0) {
    recommendations.push({
      id: `rec_exploits_${Date.now()}`,
      category: 'patch',
      priority: 'HIGH',
      title: 'Patch Exploitable Vulnerabilities',
      description: `${vulnStats.withExploits} vulnerabilities have known exploits and should be prioritized.`,
      impact: 'Active exploitation risk',
      effort: 'MEDIUM',
      timeframe: 'Within 1 week',
      resources: ['Security team', 'Patch management tools', 'Vulnerability scanning'],
      relatedVulnerabilities: []
    });
  }

  // Patch management recommendations
  if (patchStats.avgPatchTime > 30) {
    recommendations.push({
      id: `rec_patch_time_${Date.now()}`,
      category: 'configuration',
      priority: 'MEDIUM',
      title: 'Improve Patch Management Process',
      description: `Average patch time is ${Math.round(patchStats.avgPatchTime)} days. Consider automating patch deployment.`,
      impact: 'Reduced exposure window',
      effort: 'MEDIUM',
      timeframe: 'Within 1 month',
      resources: ['Patch management system', 'Automation tools', 'Process documentation'],
      relatedVulnerabilities: []
    });
  }

  // High exposure software recommendations
  if (exposureAnalysis.length > 0 && exposureAnalysis[0].exposureScore > 50) {
    recommendations.push({
      id: `rec_exposure_${Date.now()}`,
      category: 'monitoring',
      priority: 'HIGH',
      title: 'Monitor High-Risk Software',
      description: `${exposureAnalysis[0].software} has high exposure score and requires enhanced monitoring.`,
      impact: 'Early threat detection',
      effort: 'LOW',
      timeframe: 'Within 2 weeks',
      resources: ['Monitoring tools', 'Security team', 'Alert systems'],
      relatedVulnerabilities: []
    });
  }

  return recommendations;
}
