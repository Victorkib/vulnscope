import { getDatabase } from '@/lib/mongodb';
import { seedVulnerabilities } from './seed-vulnerabilities';
import { seedUserData } from './seed-user-data';
import { initializeAdminSystem } from './initialize-admin';

/**
 * Comprehensive MongoDB Data Seeding Script
 * Seeds all collections with realistic sample data
 */

// Sample user IDs for consistent data relationships
const SAMPLE_USER_IDS = [
  'user-001-alice-johnson',
  'user-002-bob-smith', 
  'user-003-carol-williams',
  'user-004-david-brown',
  'user-005-eve-davis',
  'user-006-frank-miller',
  'user-007-grace-wilson',
  'user-008-henry-moore',
  'user-009-iris-taylor',
  'user-010-jack-anderson'
];

// Sample vulnerability IDs (will be populated from actual vulnerabilities)
const SAMPLE_VULNERABILITY_IDS = [
  'CVE-2024-0001', 'CVE-2024-0002', 'CVE-2024-0003', 'CVE-2024-0004', 'CVE-2024-0005',
  'CVE-2024-0006', 'CVE-2024-0007', 'CVE-2024-0008', 'CVE-2024-0009', 'CVE-2024-0010',
  'CVE-2024-0011', 'CVE-2024-0012', 'CVE-2024-0013', 'CVE-2024-0014', 'CVE-2024-0015',
  'CVE-2024-0016', 'CVE-2024-0017', 'CVE-2024-0018', 'CVE-2024-0019', 'CVE-2024-0020'
];

// Helper function to generate random dates
const generateDateRange = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Helper function to get random item from array
const getRandomItem = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

// Helper function to get random items from array
const getRandomItems = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * Seed comprehensive user data
 */
async function seedComprehensiveUserData() {
  console.log('👥 Seeding comprehensive user data...');
  
  const db = await getDatabase();
  
  // Clear existing user data
  await Promise.all([
    db.collection('user_bookmarks').deleteMany({}),
    db.collection('user_activity').deleteMany({}),
    db.collection('saved_searches').deleteMany({}),
    db.collection('user_preferences').deleteMany({}),
    db.collection('notifications').deleteMany({}),
    db.collection('alert_rules').deleteMany({}),
  ]);

  // Generate user bookmarks
  const bookmarks = [];
  for (let i = 0; i < 50; i++) {
    bookmarks.push({
      id: `bookmark-${i + 1}`,
      userId: getRandomItem(SAMPLE_USER_IDS),
      vulnerabilityId: getRandomItem(SAMPLE_VULNERABILITY_IDS),
      notes: `Important vulnerability to track - ${i + 1}`,
      priority: getRandomItem(['critical', 'high', 'medium', 'low']),
      tags: getRandomItems(['apache', 'nginx', 'wordpress', 'docker', 'kubernetes', 'critical', 'rce', 'xss'], 3),
      createdAt: generateDateRange(Math.floor(Math.random() * 30)),
      updatedAt: generateDateRange(Math.floor(Math.random() * 7)),
    });
  }

  // Generate user activity
  const activities = [];
  const activityTypes = ['view', 'bookmark', 'search', 'export', 'comment', 'login', 'logout'];
  
  for (let i = 0; i < 200; i++) {
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

  // Generate saved searches
  const savedSearches = [];
  const searchNames = [
    'Critical Apache Vulnerabilities',
    'High Severity RCE Issues',
    'WordPress Security Issues',
    'Docker Container Vulnerabilities',
    'Kubernetes Security Updates',
    'Recent Zero-Day Exploits',
    'Microsoft Exchange Vulnerabilities',
    'Linux Kernel Security Issues'
  ];

  for (let i = 0; i < 30; i++) {
    savedSearches.push({
      id: `search-${i + 1}`,
      userId: getRandomItem(SAMPLE_USER_IDS),
      name: getRandomItem(searchNames),
      description: `Saved search for ${getRandomItem(['Apache', 'WordPress', 'Docker', 'Kubernetes'])} vulnerabilities`,
      filters: {
        searchText: getRandomItem(['Apache', 'WordPress', 'Docker', 'Kubernetes', 'Microsoft']),
        severities: getRandomItems(['CRITICAL', 'HIGH', 'MEDIUM'], 2),
        sources: ['NVD', 'GITHUB'],
        exploitAvailable: Math.random() > 0.5,
      },
      isPublic: Math.random() > 0.7,
      createdAt: generateDateRange(Math.floor(Math.random() * 30)),
      lastUsed: generateDateRange(Math.floor(Math.random() * 7)),
      useCount: Math.floor(Math.random() * 20),
    });
  }

  // Generate user preferences
  const preferences = [];
  for (const userId of SAMPLE_USER_IDS) {
    preferences.push({
      userId,
      theme: getRandomItem(['light', 'dark', 'system']),
      dashboardLayout: getRandomItem(['compact', 'comfortable', 'spacious']),
      language: 'en',
      timezone: getRandomItem(['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo']),
      emailNotifications: Math.random() > 0.3,
      pushNotifications: Math.random() > 0.5,
      weeklyDigest: Math.random() > 0.4,
      criticalAlerts: true,
      exportFormat: getRandomItem(['json', 'csv', 'pdf']),
      maxResultsPerPage: getRandomItem([10, 25, 50, 100]),
      defaultSeverityFilter: getRandomItems(['CRITICAL', 'HIGH', 'MEDIUM'], 2),
      autoRefresh: Math.random() > 0.6,
      refreshInterval: getRandomItem([30, 60, 120, 300]),
      showPreviewCards: Math.random() > 0.3,
      enableSounds: Math.random() > 0.7,
      createdAt: generateDateRange(30),
      updatedAt: generateDateRange(Math.floor(Math.random() * 7)),
    });
  }

  // Generate notifications
  const notifications = [];
  const notificationTypes = ['vulnerability_alert', 'comment_reply', 'bookmark_update', 'system_alert', 'achievement_unlocked'];
  
  for (let i = 0; i < 100; i++) {
    const notificationType = getRandomItem(notificationTypes);
    notifications.push({
      id: `notification-${i + 1}`,
      userId: getRandomItem(SAMPLE_USER_IDS),
      type: notificationType,
      title: `${notificationType.replace('_', ' ').toUpperCase()} - ${i + 1}`,
      message: `You have a new ${notificationType.replace('_', ' ')} notification`,
      data: {
        vulnerabilityId: notificationType === 'vulnerability_alert' ? getRandomItem(SAMPLE_VULNERABILITY_IDS) : null,
        severity: notificationType === 'vulnerability_alert' ? getRandomItem(['CRITICAL', 'HIGH', 'MEDIUM']) : null,
      },
      isRead: Math.random() > 0.4,
      priority: getRandomItem(['low', 'medium', 'high', 'critical']),
      createdAt: generateDateRange(Math.floor(Math.random() * 14)),
      readAt: Math.random() > 0.4 ? generateDateRange(Math.floor(Math.random() * 7)) : null,
      deliveryStatus: getRandomItem(['pending', 'delivered', 'failed']),
      deliveryAttempts: Math.floor(Math.random() * 3),
    });
  }

  // Generate alert rules
  const alertRules = [];
  for (let i = 0; i < 25; i++) {
    alertRules.push({
      id: `alert-${i + 1}`,
      userId: getRandomItem(SAMPLE_USER_IDS),
      name: `Alert Rule ${i + 1}`,
      description: `Custom alert rule for monitoring specific vulnerabilities`,
      conditions: {
        severity: getRandomItems(['CRITICAL', 'HIGH', 'MEDIUM'], 2),
        affectedSoftware: getRandomItems(['Apache', 'WordPress', 'Docker', 'Kubernetes'], 2),
        cvssScore: {
          min: 7.0,
          max: 10.0,
        },
        sources: ['NVD'],
        tags: getRandomItems(['rce', 'xss', 'sql-injection'], 2),
      },
      actions: {
        email: true,
        push: Math.random() > 0.5,
        webhook: Math.random() > 0.7 ? 'https://webhook.example.com/alerts' : undefined,
      },
      isActive: Math.random() > 0.2,
      createdAt: generateDateRange(Math.floor(Math.random() * 30)),
      updatedAt: generateDateRange(Math.floor(Math.random() * 7)),
      lastTriggered: Math.random() > 0.6 ? generateDateRange(Math.floor(Math.random() * 14)) : null,
      triggerCount: Math.floor(Math.random() * 10),
    });
  }

  // Insert all user data
  await Promise.all([
    db.collection('user_bookmarks').insertMany(bookmarks),
    db.collection('user_activity').insertMany(activities),
    db.collection('saved_searches').insertMany(savedSearches),
    db.collection('user_preferences').insertMany(preferences),
    db.collection('notifications').insertMany(notifications),
    db.collection('alert_rules').insertMany(alertRules),
  ]);

  console.log('✅ Comprehensive user data seeded successfully');
  return {
    bookmarks: bookmarks.length,
    activities: activities.length,
    savedSearches: savedSearches.length,
    preferences: preferences.length,
    notifications: notifications.length,
    alertRules: alertRules.length,
  };
}

/**
 * Seed team collaboration data
 */
async function seedTeamData() {
  console.log('👥 Seeding team collaboration data...');
  
  const db = await getDatabase();
  
  // Clear existing team data
  await Promise.all([
    db.collection('teams').deleteMany({}),
    db.collection('discussions').deleteMany({}),
    db.collection('shared_vulnerabilities').deleteMany({}),
  ]);

  // Generate teams
  const teams = [];
  const teamNames = [
    'Security Research Team',
    'DevOps Security Squad',
    'Vulnerability Assessment Team',
    'Incident Response Team',
    'Threat Intelligence Unit'
  ];

  for (let i = 0; i < 5; i++) {
    const teamMembers = getRandomItems(SAMPLE_USER_IDS, Math.floor(Math.random() * 5) + 2);
    teams.push({
      id: `team-${i + 1}`,
      name: teamNames[i],
      description: `Professional security team focused on ${getRandomItem(['vulnerability research', 'incident response', 'threat intelligence', 'security assessment'])}`,
      ownerId: teamMembers[0],
      members: teamMembers.map((userId, index) => ({
        userId,
        email: `${userId}@example.com`,
        displayName: userId.split('-')[1] + ' ' + userId.split('-')[2],
        role: index === 0 ? 'owner' : getRandomItem(['admin', 'member', 'viewer']),
        joinedAt: generateDateRange(Math.floor(Math.random() * 30)),
        invitedBy: teamMembers[0],
        status: 'active',
      })),
      settings: {
        allowMemberInvites: Math.random() > 0.3,
        allowPublicDiscussions: Math.random() > 0.5,
        requireApprovalForJoins: Math.random() > 0.6,
        notifications: {
          newMembers: true,
          newDiscussions: true,
          vulnerabilityUpdates: true,
        },
      },
      createdAt: generateDateRange(Math.floor(Math.random() * 30)),
      updatedAt: generateDateRange(Math.floor(Math.random() * 7)),
    });
  }

  // Generate discussions
  const discussions = [];
  const discussionTitles = [
    'Critical Apache Vulnerability Analysis',
    'Docker Security Best Practices',
    'Kubernetes Cluster Hardening',
    'WordPress Plugin Security Review',
    'Zero-Day Exploit Investigation',
    'Incident Response Procedures',
    'Threat Intelligence Sharing',
    'Security Training Materials'
  ];

  for (let i = 0; i < 30; i++) {
    const team = getRandomItem(teams);
    const author = getRandomItem(team.members);
    discussions.push({
      id: `discussion-${i + 1}`,
      teamId: team.id,
      vulnerabilityId: getRandomItem(SAMPLE_VULNERABILITY_IDS),
      title: getRandomItem(discussionTitles),
      description: `Discussion about ${getRandomItem(['security vulnerabilities', 'best practices', 'incident response', 'threat analysis'])}`,
      authorId: author.userId,
      authorEmail: author.email,
      authorDisplayName: author.displayName,
      isPublic: Math.random() > 0.6,
      isPinned: Math.random() > 0.8,
      tags: getRandomItems(['security', 'vulnerability', 'analysis', 'best-practices'], 3),
      status: getRandomItem(['open', 'closed', 'resolved']),
      createdAt: generateDateRange(Math.floor(Math.random() * 30)),
      updatedAt: generateDateRange(Math.floor(Math.random() * 7)),
      lastActivityAt: generateDateRange(Math.floor(Math.random() * 7)),
      participantCount: Math.floor(Math.random() * 8) + 1,
      messageCount: Math.floor(Math.random() * 20) + 1,
    });
  }

  // Generate shared vulnerabilities
  const sharedVulnerabilities = [];
  for (let i = 0; i < 40; i++) {
    const team = getRandomItem(teams);
    const sharedBy = getRandomItem(team.members);
    sharedVulnerabilities.push({
      id: `shared-${i + 1}`,
      vulnerabilityId: getRandomItem(SAMPLE_VULNERABILITY_IDS),
      sharedBy: sharedBy.userId,
      sharedByEmail: sharedBy.email,
      sharedByDisplayName: sharedBy.displayName,
      teamId: team.id,
      message: `Shared this vulnerability for team review and analysis`,
      tags: getRandomItems(['critical', 'review-needed', 'action-required'], 2),
      isPublic: Math.random() > 0.7,
      createdAt: generateDateRange(Math.floor(Math.random() * 30)),
      expiresAt: Math.random() > 0.8 ? generateDateRange(-Math.floor(Math.random() * 7)) : null,
    });
  }

  // Insert team data
  await Promise.all([
    db.collection('teams').insertMany(teams),
    db.collection('discussions').insertMany(discussions),
    db.collection('shared_vulnerabilities').insertMany(sharedVulnerabilities),
  ]);

  console.log('✅ Team collaboration data seeded successfully');
  return {
    teams: teams.length,
    discussions: discussions.length,
    sharedVulnerabilities: sharedVulnerabilities.length,
  };
}

/**
 * Seed system configuration data
 */
async function seedSystemConfig() {
  console.log('⚙️ Seeding system configuration...');
  
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
      key: 'max_file_upload_size',
      value: '10485760', // 10MB
      category: 'limits',
      description: 'Maximum file upload size in bytes',
      isPublic: true,
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
    {
      key: 'vulnerability_sync_interval',
      value: '3600', // 1 hour
      category: 'sync',
      description: 'Vulnerability data sync interval in seconds',
      isPublic: false,
      createdAt: generateDateRange(30),
      updatedAt: generateDateRange(1),
    },
    {
      key: 'max_team_members',
      value: '50',
      category: 'limits',
      description: 'Maximum team members per team',
      isPublic: true,
      createdAt: generateDateRange(30),
      updatedAt: generateDateRange(1),
    },
    {
      key: 'default_alert_retention_days',
      value: '90',
      category: 'retention',
      description: 'Default alert retention period in days',
      isPublic: false,
      createdAt: generateDateRange(30),
      updatedAt: generateDateRange(1),
    },
  ];

  await db.collection('system_config').insertMany(systemConfigs);
  console.log('✅ System configuration seeded successfully');
  return { configs: systemConfigs.length };
}

/**
 * Main seeding function
 */
export async function seedAllData() {
  try {
    console.log('🚀 Starting comprehensive MongoDB data seeding...');
    console.log('=====================================');

    // Step 1: Seed vulnerabilities (existing script)
    console.log('\n📊 Step 1: Seeding vulnerabilities...');
    const vulnerabilityResult = await seedVulnerabilities();
    console.log(`✅ Seeded ${vulnerabilityResult.insertedCount} vulnerabilities`);

    // Step 2: Seed comprehensive user data
    console.log('\n👥 Step 2: Seeding user data...');
    const userResult = await seedComprehensiveUserData();
    console.log(`✅ Seeded user data:`, userResult);

    // Step 3: Seed team collaboration data
    console.log('\n👥 Step 3: Seeding team data...');
    const teamResult = await seedTeamData();
    console.log(`✅ Seeded team data:`, teamResult);

    // Step 4: Seed system configuration
    console.log('\n⚙️ Step 4: Seeding system config...');
    const configResult = await seedSystemConfig();
    console.log(`✅ Seeded system config:`, configResult);

    // Step 5: Initialize admin system
    console.log('\n🔐 Step 5: Initializing admin system...');
    const adminResult = await initializeAdminSystem();
    console.log(`✅ Admin system initialized:`, adminResult.message);

    console.log('\n🎉 All data seeding completed successfully!');
    console.log('=====================================');
    
    // Display summary
    console.log('\n📈 Seeding Summary:');
    console.log(`  • Vulnerabilities: ${vulnerabilityResult.insertedCount}`);
    console.log(`  • User Bookmarks: ${userResult.bookmarks}`);
    console.log(`  • User Activities: ${userResult.activities}`);
    console.log(`  • Saved Searches: ${userResult.savedSearches}`);
    console.log(`  • User Preferences: ${userResult.preferences}`);
    console.log(`  • Notifications: ${userResult.notifications}`);
    console.log(`  • Alert Rules: ${userResult.alertRules}`);
    console.log(`  • Teams: ${teamResult.teams}`);
    console.log(`  • Discussions: ${teamResult.discussions}`);
    console.log(`  • Shared Vulnerabilities: ${teamResult.sharedVulnerabilities}`);
    console.log(`  • System Configs: ${configResult.configs}`);

    return {
      success: true,
      message: 'All data seeded successfully',
      summary: {
        vulnerabilities: vulnerabilityResult.insertedCount,
        ...userResult,
        ...teamResult,
        ...configResult,
      }
    };

  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAllData()
    .then((result) => {
      console.log('\n✨ Seeding process completed successfully!');
      console.log('Summary:', result.summary);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding process failed:', error);
      process.exit(1);
    });
}
