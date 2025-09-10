/**
 * Migration Configuration
 * 
 * This file controls which database backend to use for comment operations.
 * It allows for gradual migration and easy rollback if needed.
 * 
 * SAFETY: This configuration can be changed without code deployment
 * by updating environment variables.
 */

export interface MigrationConfig {
  useSupabaseForComments: boolean;
  useSupabaseForVotes: boolean;
  useSupabaseForCounts: boolean;
  enableReputationIntegration: boolean;
  fallbackToMongoDB: boolean;
}

/**
 * Get migration configuration from environment variables
 */
export function getMigrationConfig(): MigrationConfig {
  return {
    // Use Supabase for comment operations (default: true for migration)
    useSupabaseForComments: process.env.USE_SUPABASE_COMMENTS !== 'false',
    
    // Use Supabase for vote operations (default: true - already working)
    useSupabaseForVotes: process.env.USE_SUPABASE_VOTES !== 'false',
    
    // Use Supabase for comment counts (default: true for migration)
    useSupabaseForCounts: process.env.USE_SUPABASE_COUNTS !== 'false',
    
    // Enable reputation integration (default: false until ready)
    enableReputationIntegration: process.env.ENABLE_REPUTATION_INTEGRATION === 'true',
    
    // Fallback to MongoDB if Supabase fails (default: true for safety)
    fallbackToMongoDB: process.env.FALLBACK_TO_MONGODB !== 'false',
  };
}

/**
 * Check if we should use Supabase for a specific operation
 */
export function shouldUseSupabase(operation: keyof MigrationConfig): boolean {
  const config = getMigrationConfig();
  return config[operation] === true;
}

/**
 * Get debug information about migration status
 */
export function getMigrationDebugInfo() {
  const config = getMigrationConfig();
  
  return {
    config,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      USE_SUPABASE_COMMENTS: process.env.USE_SUPABASE_COMMENTS,
      USE_SUPABASE_VOTES: process.env.USE_SUPABASE_VOTES,
      USE_SUPABASE_COUNTS: process.env.USE_SUPABASE_COUNTS,
      ENABLE_REPUTATION_INTEGRATION: process.env.ENABLE_REPUTATION_INTEGRATION,
      FALLBACK_TO_MONGODB: process.env.FALLBACK_TO_MONGODB,
    },
    status: {
      commentsMigrated: config.useSupabaseForComments,
      votesMigrated: config.useSupabaseForVotes,
      countsMigrated: config.useSupabaseForCounts,
      reputationEnabled: config.enableReputationIntegration,
      fallbackEnabled: config.fallbackToMongoDB,
    }
  };
}

/**
 * Migration status checker
 */
export function getMigrationStatus() {
  const config = getMigrationConfig();
  
  const totalOperations = 3; // comments, votes, counts
  const migratedOperations = [
    config.useSupabaseForComments,
    config.useSupabaseForVotes,
    config.useSupabaseForCounts,
  ].filter(Boolean).length;
  
  const migrationProgress = (migratedOperations / totalOperations) * 100;
  
  return {
    progress: migrationProgress,
    migratedOperations,
    totalOperations,
    isComplete: migratedOperations === totalOperations,
    status: migrationProgress === 100 ? 'COMPLETE' : 
            migrationProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
    nextSteps: getNextMigrationSteps(config),
  };
}

/**
 * Get next migration steps based on current configuration
 */
function getNextMigrationSteps(config: MigrationConfig): string[] {
  const steps: string[] = [];
  
  if (!config.useSupabaseForComments) {
    steps.push('Enable Supabase for comment operations');
  }
  
  if (!config.useSupabaseForVotes) {
    steps.push('Enable Supabase for vote operations');
  }
  
  if (!config.useSupabaseForCounts) {
    steps.push('Enable Supabase for comment count operations');
  }
  
  if (!config.enableReputationIntegration) {
    steps.push('Enable reputation system integration');
  }
  
  if (steps.length === 0) {
    steps.push('Migration complete - consider disabling MongoDB fallback');
  }
  
  return steps;
}
