#!/usr/bin/env tsx

/**
 * Comprehensive test script for team functionality and email system
 * This script tests the complete team workflow including email invitations
 */

import { apiClient } from '../lib/api-client';
import { emailService } from '../lib/email-service';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

async function testTeamEmailSystem() {
  console.log('🧪 Testing Team Functionality and Email System...\n');

  const results: TestResult[] = [];

  try {
    // Test 1: Check Email Service Configuration
    console.log('1️⃣ Testing Email Service Configuration...');
    try {
      const config = emailService.getConfigStatus();
      results.push({
        test: 'Email Service Configuration',
        status: 'PASS',
        message: 'Email service configuration loaded successfully',
        details: config
      });
      console.log('✅ Email service configuration:', config);
    } catch (error) {
      results.push({
        test: 'Email Service Configuration',
        status: 'FAIL',
        message: `Email service configuration failed: ${error.message}`,
        details: error
      });
      console.log('❌ Email service configuration failed:', error.message);
    }

    // Test 2: Test Email Service Methods
    console.log('\n2️⃣ Testing Email Service Methods...');
    try {
      // Test if sendTeamInvitation method exists and is callable
      if (typeof emailService.sendTeamInvitation === 'function') {
        results.push({
          test: 'Email Service Methods',
          status: 'PASS',
          message: 'sendTeamInvitation method is available'
        });
        console.log('✅ sendTeamInvitation method is available');
      } else {
        results.push({
          test: 'Email Service Methods',
          status: 'FAIL',
          message: 'sendTeamInvitation method is not available'
        });
        console.log('❌ sendTeamInvitation method is not available');
      }
    } catch (error) {
      results.push({
        test: 'Email Service Methods',
        status: 'FAIL',
        message: `Email service methods test failed: ${error.message}`,
        details: error
      });
      console.log('❌ Email service methods test failed:', error.message);
    }

    // Test 3: Test Teams API - GET
    console.log('\n3️⃣ Testing Teams API - GET...');
    try {
      const teams = await apiClient.get('/api/teams');
      results.push({
        test: 'Teams API - GET',
        status: 'PASS',
        message: `Successfully fetched ${teams.length} teams`,
        details: { teamCount: teams.length }
      });
      console.log('✅ Teams API GET successful:', teams.length, 'teams found');
    } catch (error) {
      results.push({
        test: 'Teams API - GET',
        status: 'FAIL',
        message: `Teams API GET failed: ${error.message}`,
        details: error
      });
      console.log('❌ Teams API GET failed:', error.message);
    }

    // Test 4: Test Team Creation
    console.log('\n4️⃣ Testing Team Creation...');
    let testTeamId: string | null = null;
    try {
      const testTeam = await apiClient.post('/api/teams', {
        name: `Test Team ${Date.now()}`,
        description: 'Test team for email system verification'
      });
      
      testTeamId = testTeam.id;
      results.push({
        test: 'Team Creation',
        status: 'PASS',
        message: 'Team created successfully',
        details: { teamId: testTeamId, teamName: testTeam.name }
      });
      console.log('✅ Team created successfully:', testTeam.name);
    } catch (error) {
      results.push({
        test: 'Team Creation',
        status: 'FAIL',
        message: `Team creation failed: ${error.message}`,
        details: error
      });
      console.log('❌ Team creation failed:', error.message);
    }

    // Test 5: Test Team Member Addition (if team was created)
    if (testTeamId) {
      console.log('\n5️⃣ Testing Team Member Addition...');
      try {
        const testEmail = 'test@example.com';
        const newMember = await apiClient.post(`/api/teams/${testTeamId}/members`, {
          email: testEmail,
          role: 'member'
        });
        
        results.push({
          test: 'Team Member Addition',
          status: 'PASS',
          message: 'Team member added successfully',
          details: { memberEmail: testEmail, memberRole: 'member' }
        });
        console.log('✅ Team member added successfully:', testEmail);
      } catch (error) {
        results.push({
          test: 'Team Member Addition',
          status: 'FAIL',
          message: `Team member addition failed: ${error.message}`,
          details: error
        });
        console.log('❌ Team member addition failed:', error.message);
      }

      // Test 6: Test Team Member Fetching
      console.log('\n6️⃣ Testing Team Member Fetching...');
      try {
        const members = await apiClient.get(`/api/teams/${testTeamId}/members`);
        results.push({
          test: 'Team Member Fetching',
          status: 'PASS',
          message: `Successfully fetched ${members.length} team members`,
          details: { memberCount: members.length }
        });
        console.log('✅ Team members fetched successfully:', members.length, 'members');
      } catch (error) {
        results.push({
          test: 'Team Member Fetching',
          status: 'FAIL',
          message: `Team member fetching failed: ${error.message}`,
          details: error
        });
        console.log('❌ Team member fetching failed:', error.message);
      }

      // Test 7: Clean up - Delete test team
      console.log('\n7️⃣ Cleaning up test team...');
      try {
        await apiClient.delete(`/api/teams/${testTeamId}`);
        results.push({
          test: 'Team Cleanup',
          status: 'PASS',
          message: 'Test team deleted successfully'
        });
        console.log('✅ Test team deleted successfully');
      } catch (error) {
        results.push({
          test: 'Team Cleanup',
          status: 'FAIL',
          message: `Team cleanup failed: ${error.message}`,
          details: error
        });
        console.log('❌ Team cleanup failed:', error.message);
      }
    } else {
      results.push({
        test: 'Team Member Addition',
        status: 'SKIP',
        message: 'Skipped - no test team available'
      });
      results.push({
        test: 'Team Member Fetching',
        status: 'SKIP',
        message: 'Skipped - no test team available'
      });
      results.push({
        test: 'Team Cleanup',
        status: 'SKIP',
        message: 'Skipped - no test team available'
      });
    }

    // Test 8: Test Email Service Directly (if configured)
    console.log('\n8️⃣ Testing Email Service Directly...');
    try {
      const config = emailService.getConfigStatus();
      if (config.primaryProvider !== 'none' || config.secondaryProvider !== 'none') {
        // Try to send a test team invitation
        const emailResult = await emailService.sendTeamInvitation(
          'test@example.com',
          'Test Team',
          'Test User',
          'member',
          'Test team description'
        );
        
        results.push({
          test: 'Email Service Direct Test',
          status: emailResult.success ? 'PASS' : 'FAIL',
          message: emailResult.success ? 'Email sent successfully' : `Email failed: ${emailResult.error}`,
          details: emailResult
        });
        console.log('✅ Email service direct test:', emailResult.success ? 'SUCCESS' : 'FAILED');
        if (!emailResult.success) {
          console.log('   Error:', emailResult.error);
        }
      } else {
        results.push({
          test: 'Email Service Direct Test',
          status: 'SKIP',
          message: 'Skipped - no email providers configured'
        });
        console.log('⏭️ Email service direct test skipped - no providers configured');
      }
    } catch (error) {
      results.push({
        test: 'Email Service Direct Test',
        status: 'FAIL',
        message: `Email service direct test failed: ${error.message}`,
        details: error
      });
      console.log('❌ Email service direct test failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    results.push({
      test: 'Test Suite',
      status: 'FAIL',
      message: `Test suite failed: ${error.message}`,
      details: error
    });
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${icon} ${result.test}: ${result.message}`);
    if (result.details && result.status === 'FAIL') {
      console.log(`   Details:`, result.details);
    }
  });
  
  console.log('\n🎯 Final Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Team functionality and email system are working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the details above.');
  }

  return results;
}

// Run the test
if (require.main === module) {
  testTeamEmailSystem()
    .then((results) => {
      const failed = results.filter(r => r.status === 'FAIL').length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite crashed:', error);
      process.exit(1);
    });
}

export { testTeamEmailSystem };
