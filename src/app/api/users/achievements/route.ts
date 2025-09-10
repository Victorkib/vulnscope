import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { achievementService } from '@/lib/achievement-service';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user stats for achievement calculation
    const db = await getDatabase();
    const statsCollection = db.collection('user_stats');
    const userStats = await statsCollection.findOne({ userId: user.id });

    if (!userStats) {
      return NextResponse.json({
        unlocked: [],
        totalPoints: 0,
        completionPercentage: 0,
      });
    }

    // Get user achievements
    const achievements = await achievementService.getUserAchievements(user.id, userStats as any);

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user stats for achievement calculation
    const db = await getDatabase();
    const statsCollection = db.collection('user_stats');
    const userStats = await statsCollection.findOne({ userId: user.id });

    if (!userStats) {
      return NextResponse.json({ error: 'User stats not found' }, { status: 404 });
    }

    // Check for new achievements
    const newlyUnlocked = await achievementService.checkAchievements(user.id, userStats as any);

    return NextResponse.json({
      newlyUnlocked,
      count: newlyUnlocked.length,
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 }
    );
  }
}
