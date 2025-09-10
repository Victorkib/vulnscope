import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

/**
 * MIGRATED VERSION: Comment Count Endpoint (Supabase)
 * 
 * This is the Supabase version of the comment count endpoint.
 * It maintains the exact same API contract as the MongoDB version
 * but uses Supabase for data queries.
 * 
 * SAFETY: This endpoint can be deployed alongside the existing one
 * and switched via environment variable or gradual rollout.
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: cveId } = params;

    if (!cveId) {
      return NextResponse.json(
        { error: 'Vulnerability ID is required' },
        { status: 400 }
      );
    }

    const supabaseClient = await supabase();

    // Count total comments for this vulnerability
    const { count: totalCount, error: totalError } = await supabaseClient
      .from('vulnerability_comments')
      .select('*', { count: 'exact', head: true })
      .eq('vulnerabilityid', cveId);

    if (totalError) {
      throw totalError;
    }

    // Count top-level comments (no parent_id)
    const { count: topLevelCount, error: topLevelError } = await supabaseClient
      .from('vulnerability_comments')
      .select('*', { count: 'exact', head: true })
      .eq('vulnerabilityid', cveId)
      .is('parent_id', null);

    if (topLevelError) {
      throw topLevelError;
    }

    // Count replies (has parent_id)
    const { count: replyCount, error: replyError } = await supabaseClient
      .from('vulnerability_comments')
      .select('*', { count: 'exact', head: true })
      .eq('vulnerabilityid', cveId)
      .not('parent_id', 'is', null);

    if (replyError) {
      throw replyError;
    }

    return NextResponse.json({
      count: totalCount || 0,
      topLevelCount: topLevelCount || 0,
      replyCount: replyCount || 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching comment count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment count' },
      { status: 500 }
    );
  }
}
