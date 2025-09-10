import { getDatabase } from '@/lib/mongodb';

/**
 * Test Seeding Script
 * Verifies that the seeding process worked correctly
 */

export async function testSeeding() {
  try {
    console.log('🧪 Testing MongoDB seeding results...');
    console.log('=====================================');

    const db = await getDatabase();

    // Test collections and their expected counts
    const testCases = [
      { collection: 'vulnerabilities', minCount: 30, description: 'Vulnerability records' },
      { collection: 'user_bookmarks', minCount: 15, description: 'User bookmarks' },
      { collection: 'user_activity', minCount: 40, description: 'User activities' },
      { collection: 'saved_searches', minCount: 5, description: 'Saved searches' },
      { collection: 'user_preferences', minCount: 3, description: 'User preferences' },
      { collection: 'system_config', minCount: 3, description: 'System configurations' },
    ];

    let allTestsPassed = true;

    for (const testCase of testCases) {
      try {
        const count = await db.collection(testCase.collection).countDocuments();
        const passed = count >= testCase.minCount;
        
        console.log(`${passed ? '✅' : '❌'} ${testCase.description}: ${count} documents (expected: ${testCase.minCount}+)`);
        
        if (!passed) {
          allTestsPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${testCase.description}: Error - ${error}`);
        allTestsPassed = false;
      }
    }

    // Test sample data integrity
    console.log('\n🔍 Testing data integrity...');
    
    // Test vulnerabilities have required fields
    const sampleVulnerability = await db.collection('vulnerabilities').findOne({});
    if (sampleVulnerability) {
      const requiredFields = ['cveId', 'title', 'severity', 'cvssScore', 'publishedDate'];
      const missingFields = requiredFields.filter(field => !sampleVulnerability[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ Vulnerability data integrity: All required fields present');
      } else {
        console.log(`❌ Vulnerability data integrity: Missing fields: ${missingFields.join(', ')}`);
        allTestsPassed = false;
      }
    } else {
      console.log('❌ Vulnerability data integrity: No vulnerabilities found');
      allTestsPassed = false;
    }

    // Test user preferences have required fields
    const samplePreference = await db.collection('user_preferences').findOne({});
    if (samplePreference) {
      const requiredFields = ['userId', 'theme', 'emailNotifications', 'createdAt'];
      const missingFields = requiredFields.filter(field => !samplePreference[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ User preferences integrity: All required fields present');
      } else {
        console.log(`❌ User preferences integrity: Missing fields: ${missingFields.join(', ')}`);
        allTestsPassed = false;
      }
    } else {
      console.log('❌ User preferences integrity: No user preferences found');
      allTestsPassed = false;
    }

    // Test database indexes
    console.log('\n🔍 Testing database indexes...');
    try {
      const vulnerabilitiesCollection = db.collection('vulnerabilities');
      const indexes = await vulnerabilitiesCollection.listIndexes().toArray();
      const indexNames = indexes.map(index => index.name);
      
      const expectedIndexes = ['cveId_unique', 'severity_index', 'publishedDate_desc'];
      const missingIndexes = expectedIndexes.filter(indexName => !indexNames.includes(indexName));
      
      if (missingIndexes.length === 0) {
        console.log('✅ Database indexes: All expected indexes present');
      } else {
        console.log(`⚠️  Database indexes: Missing indexes: ${missingIndexes.join(', ')}`);
      }
    } catch (error) {
      console.log(`⚠️  Database indexes: Error checking indexes - ${error}`);
    }

    console.log('\n=====================================');
    if (allTestsPassed) {
      console.log('🎉 All seeding tests passed! Database is ready for use.');
    } else {
      console.log('❌ Some seeding tests failed. Please check the issues above.');
    }

    return {
      success: allTestsPassed,
      message: allTestsPassed ? 'All tests passed' : 'Some tests failed',
    };

  } catch (error) {
    console.error('❌ Error during seeding test:', error);
    return {
      success: false,
      message: 'Test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run if called directly
if (require.main === module) {
  testSeeding()
    .then((result) => {
      if (result.success) {
        console.log('\n✨ Seeding test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Seeding test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Seeding test crashed:', error);
      process.exit(1);
    });
}
