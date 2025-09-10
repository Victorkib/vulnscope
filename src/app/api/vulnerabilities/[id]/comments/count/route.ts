import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { shouldUseSupabase } from '@/lib/migration-config';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

    // Use Supabase if enabled, otherwise fallback to MongoDB
    if (shouldUseSupabase('useSupabaseForCounts')) {
      return await getCommentCountSupabase(cveId);
    } else {
      return await getCommentCountMongoDB(cveId);
    }
  } catch (error) {
    console.error('Error fetching comment count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment count' },
      { status: 500 }
    );
  }
}

// Supabase implementation
async function getCommentCountSupabase(cveId: string) {
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
}

// MongoDB implementation (fallback)
async function getCommentCountMongoDB(cveId: string) {
  const db = await getDatabase();
  const commentsCollection = db.collection('vulnerability_comments');

  // Count total comments for this vulnerability
  const count = await commentsCollection.countDocuments({
    vulnerabilityId: cveId,
  });

  // Count comments by type
  const topLevelCount = await commentsCollection.countDocuments({
    vulnerabilityId: cveId,
    parentId: { $exists: false },
  });

  const replyCount = await commentsCollection.countDocuments({
    vulnerabilityId: cveId,
    parentId: { $exists: true },
  });

  return NextResponse.json({
    count,
    topLevelCount,
    replyCount,
    lastUpdated: new Date().toISOString(),
  });
}
