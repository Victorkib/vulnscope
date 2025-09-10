import { NextRequest, NextResponse } from 'next/server';
import { getMigrationStatus, getMigrationDebugInfo } from '@/lib/migration-config';

/**
 * Migration Status API Endpoint
 * 
 * This endpoint provides real-time information about the comment system migration status.
 * It's useful for monitoring migration progress and debugging issues.
 */

export async function GET(request: NextRequest) {
  try {
    const status = getMigrationStatus();
    const debugInfo = getMigrationDebugInfo();

    return NextResponse.json({
      success: true,
      migration: {
        status: status.status,
        progress: status.progress,
        migratedOperations: status.migratedOperations,
        totalOperations: status.totalOperations,
        isComplete: status.isComplete,
        nextSteps: status.nextSteps,
      },
      configuration: debugInfo.config,
      environment: {
        nodeEnv: debugInfo.environment.NODE_ENV,
        supabaseConfigured: !!debugInfo.environment.NEXT_PUBLIC_SUPABASE_URL,
        migrationFlags: {
          comments: debugInfo.environment.USE_SUPABASE_COMMENTS,
          votes: debugInfo.environment.USE_SUPABASE_VOTES,
          counts: debugInfo.environment.USE_SUPABASE_COUNTS,
          reputation: debugInfo.environment.ENABLE_REPUTATION_INTEGRATION,
          fallback: debugInfo.environment.FALLBACK_TO_MONGODB,
        }
      },
      recommendations: getMigrationRecommendations(status),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting migration status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getMigrationRecommendations(status: any): string[] {
  const recommendations: string[] = [];

  if (status.progress === 0) {
    recommendations.push('Start migration by setting USE_SUPABASE_COMMENTS=true');
    recommendations.push('Run the database migration scripts in Supabase');
  } else if (status.progress < 100) {
    recommendations.push('Continue migration by enabling remaining features');
    recommendations.push('Test each feature thoroughly before proceeding');
  } else if (status.isComplete) {
    recommendations.push('Migration complete! Consider enabling reputation integration');
    recommendations.push('Monitor performance and consider disabling MongoDB fallback');
  }

  if (status.nextSteps.length > 0) {
    recommendations.push(...status.nextSteps);
  }

  return recommendations;
}
