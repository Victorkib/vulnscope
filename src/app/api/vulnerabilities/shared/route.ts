import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import { teamService } from '@/lib/team-service';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team IDs
    const userTeamIds = await teamService.getUserTeamIds(user.id);
    
    const db = await getDatabase();
    const collection = db.collection('shared_vulnerabilities');

    // Get vulnerabilities shared with user or their teams
    const sharedVulnerabilities = await collection
      .find({
        $or: [
          { sharedBy: user.id }, // Vulnerabilities shared by the user
          { sharedWith: user.id }, // Vulnerabilities shared directly with the user
          { sharedWith: { $in: userTeamIds } } // Vulnerabilities shared with user's teams
        ]
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Remove MongoDB _id fields
    const cleanShares = sharedVulnerabilities.map(({ _id, ...share }) => share);

    return NextResponse.json(cleanShares);

  } catch (error) {
    console.error('Error fetching shared vulnerabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared vulnerabilities' },
      { status: 500 }
    );
  }
}
