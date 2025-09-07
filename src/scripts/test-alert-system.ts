import { getDatabase } from '../lib/mongodb';
import { alertService } from '../lib/alert-service';
import { getServerUser } from '../lib/supabase-server';
import type { AlertRule, AlertConditions, AlertActions } from '../types/alert';
import type { Vulnerability } from '../types/vulnerability';

export async function testAlertSystem() {
  try {
    console.log('🧪 Testing Alert System...');

    // Get current user (you'll need to be authenticated)
    const { user, error } = await getServerUser();
    if (error || !user) {
      console.log('❌ No authenticated user found. Please log in first.');
      return;
    }

    console.log(`✅ Authenticated as: ${user.email}`);

    const db = await getDatabase();
    const alertRulesCollection = db.collection<AlertRule>('alert_rules');

    // Create a test alert rule
    const testAlertRule: AlertRule = {
      id: `test_alert_${Date.now()}`,
      userId: user.id,
      name: 'Test Critical Alert',
      description: 'Test alert for critical vulnerabilities',
      conditions: {
        severity: ['CRITICAL'],
        cvssScore: { min: 9.0, max: 10.0 },
      } as AlertConditions,
      actions: {
        email: true,
        push: true,
      } as AlertActions,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: 0,
      cooldownMinutes: 5, // Short cooldown for testing
    };

    // Insert test alert rule
    await alertRulesCollection.insertOne(testAlertRule);
    console.log('✅ Created test alert rule');

    // Create a test vulnerability that should trigger the alert
    const testVulnerability: Vulnerability = {
      cveId: 'CVE-2024-TEST-ALERT',
      title: 'Test Critical Vulnerability for Alert System',
      description: 'This is a test vulnerability to verify the alert system is working correctly.',
      severity: 'CRITICAL',
      cvssScore: 9.8,
      publishedDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      affectedSoftware: ['Test Software 1.0'],
      references: ['https://example.com/test-cve'],
      exploitAvailable: true,
      patchAvailable: false,
      tags: ['test', 'critical', 'rce'],
      category: 'Test Category',
      attackVector: 'NETWORK',
      attackComplexity: 'LOW',
      privilegesRequired: 'NONE',
      userInteraction: 'NONE',
      scope: 'CHANGED',
      confidentialityImpact: 'HIGH',
      integrityImpact: 'HIGH',
      availabilityImpact: 'HIGH',
      baseScore: 9.8,
      temporalScore: 9.8,
      environmentalScore: 9.8,
      vectorString: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      kev: true,
      trending: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Process the test vulnerability through the alert system
    console.log('🚨 Processing test vulnerability through alert system...');
    await alertService.processVulnerability(testVulnerability);
    console.log('✅ Alert processing completed');

    // Check if the alert rule was triggered
    const updatedRule = await alertRulesCollection.findOne({ id: testAlertRule.id });
    if (updatedRule && updatedRule.triggerCount > 0) {
      console.log(`✅ Alert rule was triggered! Trigger count: ${updatedRule.triggerCount}`);
      console.log(`✅ Last triggered: ${updatedRule.lastTriggered}`);
    } else {
      console.log('⚠️  Alert rule was not triggered. Check the conditions and alert service logic.');
    }

    // Clean up test data
    await alertRulesCollection.deleteOne({ id: testAlertRule.id });
    console.log('🧹 Cleaned up test alert rule');

    console.log('🎉 Alert system test completed successfully!');
    
    return {
      success: true,
      alertRuleTriggered: updatedRule?.triggerCount > 0,
      triggerCount: updatedRule?.triggerCount || 0,
    };

  } catch (error) {
    console.error('❌ Alert system test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAlertSystem()
    .then((result) => {
      console.log('Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
