// Utility functions for threat actor data processing

/**
 * Safely extracts techniques from threat actor data
 * Handles both array and object formats from the database
 */
export function extractTechniques(techniques: any): string[] {
  if (!techniques) return [];
  
  if (Array.isArray(techniques)) {
    return techniques.filter((item): item is string => typeof item === 'string');
  }
  
  if (typeof techniques === 'object') {
    // Handle JSONB object format from database
    return Object.values(techniques)
      .flat()
      .filter((item): item is string => typeof item === 'string');
  }
  
  return [];
}

/**
 * Safely extracts tactics from threat actor data
 * Handles both array and object formats from the database
 */
export function extractTactics(tactics: any): string[] {
  if (!tactics) return [];
  
  if (Array.isArray(tactics)) {
    return tactics.filter((item): item is string => typeof item === 'string');
  }
  
  if (typeof tactics === 'object') {
    // Handle JSONB object format from database
    return Object.values(tactics)
      .flat()
      .filter((item): item is string => typeof item === 'string');
  }
  
  return [];
}

/**
 * Safely extracts tools from threat actor data
 */
export function extractTools(tools: any): string[] {
  if (!tools) return [];
  
  if (Array.isArray(tools)) {
    return tools.filter((item): item is string => typeof item === 'string');
  }
  
  return [];
}

/**
 * Safely extracts aliases from threat actor data
 */
export function extractAliases(aliases: any): string[] {
  if (!aliases) return [];
  
  if (Array.isArray(aliases)) {
    return aliases.filter((item): item is string => typeof item === 'string');
  }
  
  return [];
}

/**
 * Safely extracts motivation from threat actor data
 */
export function extractMotivation(motivation: any): string[] {
  if (!motivation) return [];
  
  if (Array.isArray(motivation)) {
    return motivation.filter((item): item is string => typeof item === 'string');
  }
  
  return [];
}

/**
 * Normalizes threat actor data to ensure consistent format
 */
export function normalizeThreatActorData(actor: any) {
  return {
    ...actor,
    techniques: extractTechniques(actor.techniques),
    tactics: extractTactics(actor.tactics),
    tools: extractTools(actor.tools),
    aliases: extractAliases(actor.aliases),
    motivation: extractMotivation(actor.motivation)
  };
}
