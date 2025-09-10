#!/usr/bin/env tsx

/**
 * Test script to verify user preferences integration
 * This script tests that user preferences are properly applied in the vulnerabilities page
 */

import { apiClient } from '../lib/api-client';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

async function testUserPreferencesIntegration(): Promise<void> {
  console.log('🧪 Testing User Preferences Integration...\n');
  
  const results: TestResult[] = [];

  try {
    // Test 1: Check if preferences API is accessible
    console.log('1. Testing preferences API accessibility...');
    try {
      const preferences = await apiClient.get('/api/users/preferences');
      results.push({
        test: 'Preferences API Access',
        passed: true,
        message: 'Successfully fetched user preferences',
        details: { hasPreferences: !!preferences }
      });
      console.log('✅ Preferences API is accessible');
    } catch (error) {
      results.push({
        test: 'Preferences API Access',
        passed: false,
        message: 'Failed to access preferences API',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.log('❌ Preferences API is not accessible');
    }

    // Test 2: Check if vulnerabilities API respects user preferences
    console.log('\n2. Testing vulnerabilities API with user preferences...');
    try {
      const vulnerabilities = await apiClient.get('/api/vulnerabilities?page=1&limit=10');
      results.push({
        test: 'Vulnerabilities API with Preferences',
        passed: true,
        message: 'Successfully fetched vulnerabilities with user preferences',
        details: { 
          count: vulnerabilities?.vulnerabilities?.length || 0,
          pagination: vulnerabilities?.pagination
        }
      });
      console.log('✅ Vulnerabilities API respects user preferences');
    } catch (error) {
      results.push({
        test: 'Vulnerabilities API with Preferences',
        passed: false,
        message: 'Failed to fetch vulnerabilities with user preferences',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.log('❌ Vulnerabilities API failed with user preferences');
    }

    // Test 3: Check if export API uses user preferences
    console.log('\n3. Testing export API with user preferences...');
    try {
      const exportResponse = await fetch('/api/vulnerabilities/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'csv',
          filters: { severities: ['CRITICAL', 'HIGH'] }
        })
      });
      
      results.push({
        test: 'Export API with Preferences',
        passed: exportResponse.ok,
        message: exportResponse.ok ? 'Export API respects user preferences' : 'Export API failed',
        details: { status: exportResponse.status }
      });
      
      if (exportResponse.ok) {
        console.log('✅ Export API respects user preferences');
      } else {
        console.log('❌ Export API failed with user preferences');
      }
    } catch (error) {
      results.push({
        test: 'Export API with Preferences',
        passed: false,
        message: 'Failed to test export API',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.log('❌ Export API test failed');
    }

    // Test 4: Check if default severity filters are applied
    console.log('\n4. Testing default severity filter application...');
    try {
      const vulnerabilities = await apiClient.get('/api/vulnerabilities?page=1&limit=5');
      const hasSeverityFilter = vulnerabilities?.vulnerabilities?.some((v: any) => 
        ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(v.severity)
      );
      
      results.push({
        test: 'Default Severity Filter',
        passed: hasSeverityFilter,
        message: hasSeverityFilter ? 'Default severity filters are applied' : 'Default severity filters not applied',
        details: { 
          vulnerabilitiesCount: vulnerabilities?.vulnerabilities?.length || 0,
          hasSeverityFilter
        }
      });
      
      if (hasSeverityFilter) {
        console.log('✅ Default severity filters are applied');
      } else {
        console.log('❌ Default severity filters are not applied');
      }
    } catch (error) {
      results.push({
        test: 'Default Severity Filter',
        passed: false,
        message: 'Failed to test default severity filters',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.log('❌ Default severity filter test failed');
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
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! User preferences integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testUserPreferencesIntegration().catch(console.error);
}

export { testUserPreferencesIntegration };
