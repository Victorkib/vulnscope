import { getDatabase } from '@/lib/mongodb';

/**
 * Database Reset Script
 * Clears all collections and resets the database to a clean state
 */

export async function resetDatabase() {
  try {
    console.log('🗑️ Starting database reset...');
    console.log('=====================================');

    const db = await getDatabase();

    // List of all collections to clear
    const collectionsToClear = [
      'vulnerabilities',
      'user_bookmarks',
      'user_activity',
      'saved_searches',
      'user_preferences',
      'notifications',
      'alert_rules',
      'teams',
      'discussions',
      'shared_vulnerabilities',
      'admin_users',
      'admin_audit_logs',
      'system_config',
      'vulnerability_comments',
      'comment_votes',
    ];

    console.log('📋 Collections to clear:', collectionsToClear.length);

    // Clear each collection
    for (const collectionName of collectionsToClear) {
      try {
        const collection = db.collection(collectionName);
        const result = await collection.deleteMany({});
        console.log(`✅ Cleared ${collectionName}: ${result.deletedCount} documents`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${collectionName}: ${error}`);
      }
    }

    // Drop indexes for vulnerabilities collection (will be recreated during seeding)
    try {
      const vulnerabilitiesCollection = db.collection('vulnerabilities');
      const indexes = await vulnerabilitiesCollection.listIndexes().toArray();
      
      for (const index of indexes) {
        if (index.name !== '_id_') {
          try {
            await vulnerabilitiesCollection.dropIndex(index.name);
            console.log(`🗑️  Dropped index: ${index.name}`);
          } catch (error) {
            console.log(`⚠️  Could not drop index ${index.name}: ${error}`);
          }
        }
      }
    } catch (error) {
      console.log('⚠️  Could not list/drop indexes:', error);
    }

    console.log('\n🎉 Database reset completed successfully!');
    console.log('=====================================');
    console.log('💡 You can now run seeding scripts to populate the database');

    return {
      success: true,
      message: 'Database reset completed successfully',
      collectionsCleared: collectionsToClear.length,
    };

  } catch (error) {
    console.error('❌ Error during database reset:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase()
    .then((result) => {
      console.log('\n✨ Database reset completed successfully!');
      console.log('Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database reset failed:', error);
      process.exit(1);
    });
}
