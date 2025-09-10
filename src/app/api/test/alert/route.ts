import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { alertService } from '@/lib/alert-service';
import type { Vulnerability } from '@/types/vulnerability';

export async function POST() {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a test vulnerability to trigger alerts
    const testVulnerability: Vulnerability = {
      cveId: 'CVE-2024-TEST-001',
      title: 'Test Critical Vulnerability',
      description: 'This is a test vulnerability to demonstrate the alert system functionality.',
      severity: 'CRITICAL',
      cvssScore: 9.8,
      publishedDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      affectedSoftware: ['Test Software 1.0', 'Test Framework 2.0'],
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
      cvssScore: 9.8,
      vectorString: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      kev: true,
      trending: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Process the test vulnerability through the alert system
    await alertService.processVulnerability(testVulnerability);

    return NextResponse.json({ 
      success: true, 
      message: 'Test alert processed successfully',
      vulnerability: testVulnerability,
    });
  } catch (error) {
    console.error('Error processing test alert:', error);
    return NextResponse.json(
      { error: 'Failed to process test alert' },
      { status: 500 }
    );
  }
}
