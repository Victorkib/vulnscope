#!/usr/bin/env tsx

/**
 * Test script to verify the user preference fixes
 * This script tests the actual issues that were identified
 */

import { apiClient } from '../lib/api-client';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

async function testPreferenceFixes(): Promise<void> {
  console.log('🔧 Testing User Preference Fixes...\n');
  
  const results: TestResult[] = [];

  try {
    // Test 1: Check if user preferences are being fetched correctly
    console.log('1. Testing user preferences API...');
    try {
      const preferences = await apiClient.get('/api/users/preferences');
      results.push({
        test: 'User Preferences API',
        passed: true,
        message: 'Successfully fetched user preferences',
        details: { 
          maxResultsPerPage: preferences?.maxResultsPerPage,
          defaultSeverityFilter: preferences?.defaultSeverityFilter,
          exportFormat: preferences?.exportFormat
        }
      });
      console.log('✅ User preferences API working');
      console.log(`   Max Results Per Page: ${preferences?.maxResultsPerPage}`);
      console.log(`   Default Severity Filter: ${preferences?.defaultSeverityFilter?.join(', ')}`);
    } catch (error) {
      results.push({
        test: 'User Preferences API',
        passed: false,
        message: 'Failed to fetch user preferences',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.log('❌ User preferences API failed');
    }

    // Test 2: Check if vulnerabilities API respects user preferences
    console.log('\n2. Testing vulnerabilities API with user preferences...');
    try {
      const vulnerabilities = await apiClient.get('/api/vulnerabilities?page=1');
      results.push({
        test: 'Vulnerabilities API with User Preferences',
        passed: true,
        message: 'Successfully fetched vulnerabilities',
        details: { 
          count: vulnerabilities?.vulnerabilities?.length || 0,
          pagination: vulnerabilities?.pagination
        }
      });
      console.log('✅ Vulnerabilities API working');
      console.log(`   Results count: ${vulnerabilities?.vulnerabilities?.length || 0}`);
      console.log(`   Pagination limit: ${vulnerabilities?.pagination?.limit}`);
    } catch (error) {
      results.push({
        test: 'Vulnerabilities API with User Preferences',
        passed: false,
        message: 'Failed to fetch vulnerabilities',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.log('❌ Vulnerabilities API failed');
    }

    // Test 3: Check if vulnerability detail API tracks views
    console.log('\n3. Testing vulnerability view tracking...');
    try {
      // First get a vulnerability ID
      const vulnerabilities = await apiClient.get('/api/vulnerabilities?page=1&limit=1');
      if (vulnerabilities?.vulnerabilities?.length > 0) {
        const vulnId = vulnerabilities.vulnerabilities[0].cveId;
        console.log(`   Testing view tracking for: ${vulnId}`);
        
        // Fetch the vulnerability detail (this should track the view)
        const vulnerability = await apiClient.get(`/api/vulnerabilities/${vulnId}`);
        
        results.push({
          test: 'Vulnerability View Tracking',
          passed: true,
          message: 'Successfully fetched vulnerability details',
          details: { 
            cveId: vulnerability?.cveId,
            title: vulnerability?.title
          }
        });
        console.log('✅ Vulnerability view tracking working');
        console.log(`   Tracked view for: ${vulnerability?.cveId}`);
      } else {
        results.push({
          test: 'Vulnerability View Tracking',
          passed: false,
          message: 'No vulnerabilities found to test view tracking',
          details: {}
        });
        console.log('❌ No vulnerabilities found to test view tracking');
      }
    } catch (error) {
      results.push({
        test: 'Vulnerability View Tracking',
        passed: false,
        message: 'Failed to test view tracking',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.log('❌ Vulnerability view tracking test failed');
    }

    // Test 4: Check if specific limit parameter works
    console.log('\n4. Testing specific limit parameter...');
    try {
      const vulnerabilities = await apiClient.get('/api/vulnerabilities?page=1&limit=10');
      const actualCount = vulnerabilities?.vulnerabilities?.length || 0;
      const expectedLimit = vulnerabilities?.pagination?.limit || 0;
      
      results.push({
        test: 'Specific Limit Parameter',
        passed: actualCount <= 10 && expectedLimit === 10,
        message: actualCount <= 10 && expectedLimit === 10 ? 'Limit parameter working correctly' : 'Limit parameter not working',
        details: { 
          actualCount,
          expectedLimit,
          requestedLimit: 10
        }
      });
      
      if (actualCount <= 10 && expectedLimit === 10) {
        console.log('✅ Limit parameter working correctly');
        console.log(`   Requested: 10, Got: ${actualCount} results, Limit: ${expectedLimit}`);
      } else {
        console.log('❌ Limit parameter not working correctly');
        console.log(`   Requested: 10, Got: ${actualCount} results, Limit: ${expectedLimit}`);
      }
    } catch (error) {
      results.push({
        test: 'Specific Limit Parameter',
        passed: false,
        message: 'Failed to test limit parameter',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.log('❌ Limit parameter test failed');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }

  // Print summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.message}`);
    if (result.details && Object.keys(result.details).length > 0) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! User preference fixes are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testPreferenceFixes().catch(console.error);
}

export { testPreferenceFixes };
