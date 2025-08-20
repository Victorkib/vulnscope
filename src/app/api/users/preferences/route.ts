import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { ObjectId } from 'mongodb';

interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  criticalAlerts: boolean;
  exportFormat: 'json' | 'csv' | 'pdf';
  dashboardLayout: 'compact' | 'comfortable' | 'spacious';
  language: string;
  timezone: string;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultSeverityFilter: string[];
  maxResultsPerPage: number;
  showPreviewCards: boolean;
  enableSounds: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserPreferencesDocument extends UserPreferences {
  _id?: ObjectId;
}

const getDefaultPreferences = (userId: string): UserPreferences => ({
  userId,
  theme: 'system',
  emailNotifications: true,
  pushNotifications: false,
  weeklyDigest: true,
  criticalAlerts: true,
  exportFormat: 'json',
  dashboardLayout: 'comfortable',
  language: 'en',
  timezone: 'UTC',
  autoRefresh: false,
  refreshInterval: 300000, // 5 minutes
  defaultSeverityFilter: ['CRITICAL', 'HIGH'],
  maxResultsPerPage: 25,
  showPreviewCards: true,
  enableSounds: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const validatePreferences = (preferences: any): boolean => {
  const requiredFields = [
    'theme',
    'language',
    'timezone',
    'exportFormat',
    'dashboardLayout',
  ];
  return requiredFields.every((field) => preferences.hasOwnProperty(field));
};

export async function GET() {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const collection =
      db.collection<UserPreferencesDocument>('user_preferences');

    let preferences = await collection.findOne({ userId: user.id });

    if (!preferences) {
      // Create default preferences
      const defaultPrefs = getDefaultPreferences(user.id);
      const result = await collection.insertOne(defaultPrefs);
      preferences = { ...defaultPrefs, _id: result.insertedId };
    }

    // Remove MongoDB _id field from response
    const { _id, ...cleanPreferences } = preferences;
    return NextResponse.json(cleanPreferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await request.json();

    if (!validatePreferences(preferences)) {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const preferencesCollection =
      db.collection<UserPreferencesDocument>('user_preferences');
    const activityCollection = db.collection('user_activity');

    // Get current preferences to track changes
    const currentPreferences = await preferencesCollection.findOne({
      userId: user.id,
    });
    const changes = currentPreferences
      ? Object.keys(preferences).filter(
          (key) => currentPreferences[key] !== preferences[key]
        )
      : Object.keys(preferences);

    // Prepare update data - only include UserPreferences fields
    const updateData: Partial<UserPreferences> = {
      userId: user.id,
      theme: preferences.theme,
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      weeklyDigest: preferences.weeklyDigest,
      criticalAlerts: preferences.criticalAlerts,
      exportFormat: preferences.exportFormat,
      dashboardLayout: preferences.dashboardLayout,
      language: preferences.language,
      timezone: preferences.timezone,
      autoRefresh: preferences.autoRefresh,
      refreshInterval: preferences.refreshInterval,
      defaultSeverityFilter: preferences.defaultSeverityFilter,
      maxResultsPerPage: preferences.maxResultsPerPage,
      showPreviewCards: preferences.showPreviewCards,
      enableSounds: preferences.enableSounds,
      updatedAt: new Date().toISOString(),
    };

    // Update preferences
    await preferencesCollection.updateOne(
      { userId: user.id },
      { $set: updateData },
      { upsert: true }
    );

    // Log user activity
    await activityCollection.insertOne({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'settings_changed',
      description: `Updated ${changes.length} preference(s): ${changes.join(
        ', '
      )}`,
      timestamp: new Date().toISOString(),
      metadata: { changedSettings: changes, newValues: preferences },
    });

    return NextResponse.json({ success: true, changes });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save user preferences' },
      { status: 500 }
    );
  }
}
