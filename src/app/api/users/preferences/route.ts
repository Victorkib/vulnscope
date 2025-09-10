import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerUser } from '@/lib/supabase-server';
import type { ObjectId } from 'mongodb';
import { defaultPreferences, type UnifiedPreferences } from '@/contexts/preferences-context';

// Use the same interface as the context
type UserPreferences = UnifiedPreferences;

interface UserPreferencesDocument extends UserPreferences {
  _id?: ObjectId;
}

const getDefaultPreferences = (userId: string): UserPreferences => ({
  ...defaultPreferences,
  userId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const validatePreferences = (preferences: Record<string, unknown>): boolean => {
  const requiredFields = [
    'theme',
    'fontSize',
    'dashboardLayout',
    'language',
    'timezone',
    'exportFormat',
    'maxResultsPerPage',
    'refreshInterval',
  ];
  
  // Check required fields exist
  if (!requiredFields.every((field) => preferences.hasOwnProperty(field))) {
    return false;
  }
  
  // Validate enum values
  const validThemes = ['light', 'dark', 'system'];
  const validFontSizes = ['small', 'medium', 'large'];
  const validLayouts = ['compact', 'comfortable', 'spacious'];
  const validExportFormats = ['json', 'csv', 'pdf'];
  
  if (!validThemes.includes(preferences.theme as string)) return false;
  if (!validFontSizes.includes(preferences.fontSize as string)) return false;
  if (!validLayouts.includes(preferences.dashboardLayout as string)) return false;
  if (!validExportFormats.includes(preferences.exportFormat as string)) return false;
  
  // Validate numeric ranges
  const maxResults = preferences.maxResultsPerPage as number;
  const refreshInterval = preferences.refreshInterval as number;
  
  if (maxResults < 10 || maxResults > 100) return false;
  if (refreshInterval < 60000 || refreshInterval > 3600000) return false;
  
  return true;
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
    const { _id: _, ...cleanPreferences } = preferences;
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
      // Appearance
      theme: preferences.theme,
      fontSize: preferences.fontSize,
      dashboardLayout: preferences.dashboardLayout,
      showAnimations: preferences.showAnimations,
      sidebarCollapsed: preferences.sidebarCollapsed,
      
      // Notifications
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      criticalAlerts: preferences.criticalAlerts,
      weeklyDigest: preferences.weeklyDigest,
      enableSounds: preferences.enableSounds,
      
      // Data & Export
      exportFormat: preferences.exportFormat,
      maxResultsPerPage: preferences.maxResultsPerPage,
      showPreviewCards: preferences.showPreviewCards,
      defaultSeverityFilter: preferences.defaultSeverityFilter,
      
      // Behavior
      autoRefresh: preferences.autoRefresh,
      refreshInterval: preferences.refreshInterval,
      
      // Accessibility
      language: preferences.language,
      timezone: preferences.timezone,
      highContrast: preferences.highContrast,
      reduceMotion: preferences.reduceMotion,
      screenReader: preferences.screenReader,
      
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
