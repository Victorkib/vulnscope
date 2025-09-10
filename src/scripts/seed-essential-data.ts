import { getDatabase } from '@/lib/mongodb';
import { seedVulnerabilities } from './seed-vulnerabilities';

/**
 * Essential MongoDB Data Seeding Script
 * Seeds only the core collections needed for basic functionality
 */

// Sample user IDs for consistent data relationships
const SAMPLE_USER_IDS = [
  'user-001-alice-johnson',
  'user-002-bob-smith', 
  'user-003-carol-williams',
  'user-004-david-brown',
  'user-005-eve-davis'
];

// Sample vulnerability IDs (will be populated from actual vulnerabilities)
const SAMPLE_VULNERABILITY_IDS = [
  'CVE-2024-0001', 'CVE-2024-0002', 'CVE-2024-0003', 'CVE-2024-0004', 'CVE-2024-0005',
  'CVE-2024-0006', 'CVE-2024-0007', 'CVE-2024-0008', 'CVE-2024-0009', 'CVE-2024-0010'
];

// Helper function to generate random dates
const generateDateRange = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Helper function to get random item from array
const getRandomItem = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

/**
 * Seed essential user data
 */
async function seedEssentialUserData() {
  console.log('👥 Seeding essential user data...');
  
  const db = await getDatabase();
  
  // Clear existing user data
  await Promise.all([
    db.collection('user_bookmarks').deleteMany({}),
    db.collection('user_activity').deleteMany({}),
    db.collection('saved_searches').deleteMany({}),
    db.collection('user_preferences').deleteMany({}),
  ]);

  // Generate basic user bookmarks
  const bookmarks = [];
  for (let i = 0; i < 20; i++) {
    bookmarks.push({
      id: `bookmark-${i + 1}`,
      userId: getRandomItem(SAMPLE_USER_IDS),
      vulnerabilityId: getRandomItem(SAMPLE_VULNERABILITY_IDS),
      notes: `Important vulnerability to track - ${i + 1}`,
      priority: getRandomItem(['critical', 'high', 'medium', 'low']),
      tags: ['critical', 'rce', 'apache'],
      createdAt: generateDateRange(Math.floor(Math.random() * 30)),
      updatedAt: generateDateRange(Math.floor(Math.random() * 7)),
    });
  }

  // Generate basic user activity
  const activities = [];
  const activityTypes = ['view', 'bookmark', 'search', 'login'];
  
  for (let i = 0; i < 50; i++) {
    const activityType = getRandomItem(activityTypes);
    activities.push({
      id: `activity-${i + 1}`,
      userId: getRandomItem(SAMPLE_USER_IDS),
      type: activityType,
      description: `${activityType} activity - ${i + 1}`,
      vulnerabilityId: activityType === 'view' || activityType === 'bookmark' ? getRandomItem(SAMPLE_VULNERABILITY_IDS) : null,
      timestamp: generateDateRange(Math.floor(Math.random() * 30)),
      metadata: {
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
  }

  // Generate basic saved searches
  const savedSearches = [];
  const searchNames = [
    'Critical Apache Vulnerabilities',
    'High Severity RCE Issues',
    'WordPress Security Issues',
    'Docker Container Vulnerabilities'
  ];

  for (let i = 0; i < 10; i++) {
    savedSearches.push({
      id: `search-${i + 1}`,
      userId: getRandomItem(SAMPLE_USER_IDS),
      name: getRandomItem(searchNames),
      description: `Saved search for ${getRandomItem(['Apache', 'WordPress', 'Docker'])} vulnerabilities`,
      filters: {
        searchText: getRandomItem(['Apache', 'WordPress', 'Docker']),
        severities: ['CRITICAL', 'HIGH'],
        sources: ['NVD'],
        exploitAvailable: true,
      },
      isPublic: false,
      createdAt: generateDateRange(Math.floor(Math.random() * 30)),
      lastUsed: generateDateRange(Math.floor(Math.random() * 7)),
      useCount: Math.floor(Math.random() * 10),
    });
  }

  // Generate basic user preferences
  const preferences = [];
  for (const userId of SAMPLE_USER_IDS) {
    preferences.push({
      userId,
      theme: 'system',
      dashboardLayout: 'comfortable',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: false,
      weeklyDigest: true,
      criticalAlerts: true,
      exportFormat: 'json',
      maxResultsPerPage: 25,
      defaultSeverityFilter: ['CRITICAL', 'HIGH'],
      autoRefresh: true,
      refreshInterval: 60,
      showPreviewCards: true,
      enableSounds: false,
      createdAt: generateDateRange(30),
      updatedAt: generateDateRange(Math.floor(Math.random() * 7)),
    });
  }

  // Insert all user data
  await Promise.all([
    db.collection('user_bookmarks').insertMany(bookmarks),
    db.collection('user_activity').insertMany(activities),
    db.collection('saved_searches').insertMany(savedSearches),
    db.collection('user_preferences').insertMany(preferences),
  ]);

  console.log('✅ Essential user data seeded successfully');
  return {
    bookmarks: bookmarks.length,
    activities: activities.length,
    savedSearches: savedSearches.length,
    preferences: preferences.length,
  };
}

/**
 * Seed basic system configuration
 */
async function seedBasicSystemConfig() {
  console.log('⚙️ Seeding basic system configuration...');
  
  const db = await getDatabase();
  
  // Clear existing system config
  await db.collection('system_config').deleteMany({});

  const systemConfigs = [
    {
      key: 'app_version',
      value: '1.0.0',
      category: 'application',
      description: 'Current application version',
      isPublic: true,
      createdAt: generateDateRange(30),
      updatedAt: generateDateRange(1),
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      category: 'application',
      description: 'Maintenance mode status',
      isPublic: false,
      createdAt: generateDateRange(30),
      updatedAt: generateDateRange(1),
    },
    {
      key: 'email_notifications_enabled',
      value: 'true',
      category: 'notifications',
      description: 'Global email notifications setting',
      isPublic: false,
      createdAt: generateDateRange(30),
      updatedAt: generateDateRange(1),
    },
  ];

  await db.collection('system_config').insertMany(systemConfigs);
  console.log('✅ Basic system configuration seeded successfully');
  return { configs: systemConfigs.length };
}

/**
 * Main essential seeding function
 */
export async function seedEssentialData() {
  try {
    console.log('🚀 Starting essential MongoDB data seeding...');
    console.log('=====================================');

    // Step 1: Seed vulnerabilities (existing script)
    console.log('\n📊 Step 1: Seeding vulnerabilities...');
    const vulnerabilityResult = await seedVulnerabilities();
    console.log(`✅ Seeded ${vulnerabilityResult.insertedCount} vulnerabilities`);

    // Step 2: Seed essential user data
    console.log('\n👥 Step 2: Seeding essential user data...');
    const userResult = await seedEssentialUserData();
    console.log(`✅ Seeded user data:`, userResult);

    // Step 3: Seed basic system configuration
    console.log('\n⚙️ Step 3: Seeding basic system config...');
    const configResult = await seedBasicSystemConfig();
    console.log(`✅ Seeded system config:`, configResult);

    console.log('\n🎉 Essential data seeding completed successfully!');
    console.log('=====================================');
    
    // Display summary
    console.log('\n📈 Seeding Summary:');
    console.log(`  • Vulnerabilities: ${vulnerabilityResult.insertedCount}`);
    console.log(`  • User Bookmarks: ${userResult.bookmarks}`);
    console.log(`  • User Activities: ${userResult.activities}`);
    console.log(`  • Saved Searches: ${userResult.savedSearches}`);
    console.log(`  • User Preferences: ${userResult.preferences}`);
    console.log(`  • System Configs: ${configResult.configs}`);

    return {
      success: true,
      message: 'Essential data seeded successfully',
      summary: {
        vulnerabilities: vulnerabilityResult.insertedCount,
        ...userResult,
        ...configResult,
      }
    };

  } catch (error) {
    console.error('❌ Error during essential data seeding:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedEssentialData()
    .then((result) => {
      console.log('\n✨ Essential seeding process completed successfully!');
      console.log('Summary:', result.summary);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Essential seeding process failed:', error);
      process.exit(1);
    });
}
