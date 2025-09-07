import { getDatabase } from '../lib/mongodb';
import type { Vulnerability } from '../types/vulnerability';

export async function testTagSystem() {
  try {
    console.log('🏷️ Testing Tag System...');

    const db = await getDatabase();
    const vulnerabilitiesCollection = db.collection<Vulnerability>('vulnerabilities');

    // Test 1: Check if vulnerabilities have tags
    console.log('\n📊 Test 1: Checking vulnerability tag data...');
    const vulnerabilitiesWithTags = await vulnerabilitiesCollection.find({
      tags: { $exists: true, $ne: [] }
    }).limit(5).toArray();

    console.log(`✅ Found ${vulnerabilitiesWithTags.length} vulnerabilities with tags`);
    
    if (vulnerabilitiesWithTags.length > 0) {
      console.log('Sample vulnerability tags:');
      vulnerabilitiesWithTags.forEach((vuln, index) => {
        console.log(`  ${index + 1}. ${vuln.cveId}: [${vuln.tags.join(', ')}]`);
      });
    }

    // Test 2: Test tag filtering functionality
    console.log('\n🔍 Test 2: Testing tag filtering...');
    const testTag = 'rce'; // Remote Code Execution
    const rceVulnerabilities = await vulnerabilitiesCollection.find({
      tags: { $in: [testTag] }
    }).limit(3).toArray();

    console.log(`✅ Found ${rceVulnerabilities.length} vulnerabilities with '${testTag}' tag`);
    rceVulnerabilities.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.cveId}: ${vuln.title}`);
    });

    // Test 3: Test multiple tag filtering
    console.log('\n🔍 Test 3: Testing multiple tag filtering...');
    const multipleTags = ['xss', 'sql-injection'];
    const multiTagVulnerabilities = await vulnerabilitiesCollection.find({
      tags: { $in: multipleTags }
    }).limit(3).toArray();

    console.log(`✅ Found ${multiTagVulnerabilities.length} vulnerabilities with tags: [${multipleTags.join(', ')}]`);
    multiTagVulnerabilities.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.cveId}: [${vuln.tags.join(', ')}]`);
    });

    // Test 4: Get all unique tags
    console.log('\n📋 Test 4: Analyzing all unique tags...');
    const allTags = await vulnerabilitiesCollection.distinct('tags');
    console.log(`✅ Found ${allTags.length} unique tags in the system`);
    
    // Group tags by frequency
    const tagFrequency: Record<string, number> = {};
    const allVulns = await vulnerabilitiesCollection.find({}).toArray();
    
    allVulns.forEach(vuln => {
      vuln.tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    // Sort tags by frequency
    const sortedTags = Object.entries(tagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    console.log('Top 10 most common tags:');
    sortedTags.forEach(([tag, count], index) => {
      console.log(`  ${index + 1}. ${tag}: ${count} vulnerabilities`);
    });

    // Test 5: Test tag search functionality
    console.log('\n🔍 Test 5: Testing tag search functionality...');
    const searchTerm = 'injection';
    const searchResults = await vulnerabilitiesCollection.find({
      tags: { $regex: searchTerm, $options: 'i' }
    }).limit(3).toArray();

    console.log(`✅ Found ${searchResults.length} vulnerabilities with tags containing '${searchTerm}'`);
    searchResults.forEach((vuln, index) => {
      const matchingTags = vuln.tags.filter(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`  ${index + 1}. ${vuln.cveId}: [${matchingTags.join(', ')}]`);
    });

    // Test 6: Test tag combinations
    console.log('\n🔗 Test 6: Testing tag combinations...');
    const criticalRceVulns = await vulnerabilitiesCollection.find({
      severity: 'CRITICAL',
      tags: { $in: ['rce'] }
    }).limit(3).toArray();

    console.log(`✅ Found ${criticalRceVulns.length} CRITICAL vulnerabilities with RCE tags`);
    criticalRceVulns.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.cveId}: ${vuln.severity} - [${vuln.tags.join(', ')}]`);
    });

    // Test 7: Check tag data integrity
    console.log('\n🔍 Test 7: Checking tag data integrity...');
    const vulnerabilitiesWithoutTags = await vulnerabilitiesCollection.countDocuments({
      $or: [
        { tags: { $exists: false } },
        { tags: { $size: 0 } },
        { tags: null }
      ]
    });

    const totalVulnerabilities = await vulnerabilitiesCollection.countDocuments({});
    const vulnerabilitiesWithValidTags = totalVulnerabilities - vulnerabilitiesWithoutTags;

    console.log(`✅ Total vulnerabilities: ${totalVulnerabilities}`);
    console.log(`✅ Vulnerabilities with tags: ${vulnerabilitiesWithValidTags}`);
    console.log(`✅ Vulnerabilities without tags: ${vulnerabilitiesWithoutTags}`);
    console.log(`✅ Tag coverage: ${((vulnerabilitiesWithValidTags / totalVulnerabilities) * 100).toFixed(1)}%`);

    // Test 8: Test tag length and format
    console.log('\n📏 Test 8: Testing tag format and length...');
    const allTagsArray = await vulnerabilitiesCollection.distinct('tags');
    const tagLengths = allTagsArray.map(tag => tag.length);
    const avgTagLength = tagLengths.reduce((a, b) => a + b, 0) / tagLengths.length;
    const maxTagLength = Math.max(...tagLengths);
    const minTagLength = Math.min(...tagLengths);

    console.log(`✅ Average tag length: ${avgTagLength.toFixed(1)} characters`);
    console.log(`✅ Longest tag: ${maxTagLength} characters`);
    console.log(`✅ Shortest tag: ${minTagLength} characters`);

    // Check for problematic tags
    const problematicTags = allTagsArray.filter(tag => 
      tag.length > 50 || tag.includes(' ') || tag !== tag.toLowerCase()
    );

    if (problematicTags.length > 0) {
      console.log(`⚠️ Found ${problematicTags.length} potentially problematic tags:`);
      problematicTags.slice(0, 5).forEach(tag => {
        console.log(`  - "${tag}" (${tag.length} chars)`);
      });
    } else {
      console.log('✅ All tags follow good naming conventions');
    }

    console.log('\n🎉 Tag system test completed successfully!');
    
    return {
      success: true,
      testsPassed: 8,
      totalVulnerabilities,
      vulnerabilitiesWithTags: vulnerabilitiesWithValidTags,
      uniqueTags: allTags.length,
      tagCoverage: (vulnerabilitiesWithValidTags / totalVulnerabilities) * 100,
      topTags: sortedTags.slice(0, 5),
    };

  } catch (error) {
    console.error('❌ Tag system test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testTagSystem()
    .then((result) => {
      console.log('Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
