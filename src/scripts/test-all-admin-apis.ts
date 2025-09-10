#!/usr/bin/env tsx

/**
 * Comprehensive Admin API Testing Script
 * Tests all admin API endpoints to ensure they're working correctly
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vulnscope';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  statusCode?: number;
  responseTime?: number;
  error?: string;
  data?: any;
}

class AdminAPITester {
  private results: TestResult[] = [];
  private adminToken: string | null = null;
  private adminUserId: string | null = null;

  async runAllTests() {
    console.log('🧪 Starting Comprehensive Admin API Tests...\n');
    
    try {
      // Test database connection
      await this.testDatabaseConnection();
      
      // Test admin authentication
      await this.testAdminAuthentication();
      
      if (!this.adminToken) {
        console.log('❌ Cannot proceed without admin authentication');
        return;
      }
      
      // Test all API endpoints
      await this.testAdminStatusAPI();
      await this.testAdminUsersAPI();
      await this.testRegularUsersAPI();
      await this.testAdminDashboardStatsAPI();
      await this.testAuditLogsAPI();
      await this.testSystemConfigAPI();
      await this.testSystemMaintenanceAPI();
      await this.testSystemPerformanceAPI();
      await this.testSecuritySessionsAPI();
      await this.testSecurityAlertsAPI();
      await this.testSystemAlertsAPI();
      await this.testNotificationsAPI();
      await this.testInitializeAPI();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  private async testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      await client.db().admin().ping();
      await client.close();
      console.log('✅ Database connection successful\n');
    } catch (error) {
      console.log('❌ Database connection failed:', error);
      throw error;
    }
  }

  private async testAdminAuthentication() {
    console.log('🔍 Testing admin authentication...');
    
    // Check if admin user exists
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      const db = client.db();
      
      const adminUsers = await db.collection('admin_users').find({}).toArray();
      console.log(`📋 Found ${adminUsers.length} admin users in database`);
      
      if (adminUsers.length > 0) {
        const adminUser = adminUsers[0];
        this.adminUserId = adminUser.userId;
        console.log(`✅ Using admin user: ${adminUser.email} (${adminUser.role})`);
      } else {
        console.log('⚠️  No admin users found. Please run: npm run admin:create');
      }
      
      await client.close();
    } catch (error) {
      console.log('❌ Admin authentication test failed:', error);
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<TestResult> {
    const startTime = Date.now();
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;
      const data = await response.json().catch(() => null);
      
      return {
        endpoint,
        method,
        status: response.ok ? 'PASS' : 'FAIL',
        statusCode: response.status,
        responseTime,
        data,
        error: response.ok ? undefined : `HTTP ${response.status}: ${data?.error || 'Unknown error'}`
      };
    } catch (error) {
      return {
        endpoint,
        method,
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testAdminStatusAPI() {
    console.log('🔍 Testing Admin Status API...');
    
    const result = await this.makeRequest('/api/admin/status');
    this.results.push(result);
    
    if (result.status === 'PASS') {
      console.log(`✅ GET /api/admin/status - ${result.statusCode} (${result.responseTime}ms)`);
      if (result.data?.isAdmin) {
        console.log(`   Admin: ${result.data.email} (${result.data.role})`);
      }
    } else {
      console.log(`❌ GET /api/admin/status - ${result.error}`);
    }
    console.log('');
  }

  private async testAdminUsersAPI() {
    console.log('🔍 Testing Admin Users API...');
    
    // Test GET /api/admin/users
    const getResult = await this.makeRequest('/api/admin/users');
    this.results.push(getResult);
    
    if (getResult.status === 'PASS') {
      console.log(`✅ GET /api/admin/users - ${getResult.statusCode} (${getResult.responseTime}ms)`);
      console.log(`   Found ${getResult.data?.count || 0} admin users`);
    } else {
      console.log(`❌ GET /api/admin/users - ${getResult.error}`);
    }
    
    // Test POST /api/admin/users (create new admin)
    if (this.adminUserId) {
      const postResult = await this.makeRequest('/api/admin/users', 'POST', {
        userId: 'test-admin-user',
        email: 'test-admin@example.com',
        role: 'analyst'
      });
      this.results.push(postResult);
      
      if (postResult.status === 'PASS') {
        console.log(`✅ POST /api/admin/users - ${postResult.statusCode} (${postResult.responseTime}ms)`);
      } else {
        console.log(`❌ POST /api/admin/users - ${postResult.error}`);
      }
    }
    
    console.log('');
  }

  private async testRegularUsersAPI() {
    console.log('🔍 Testing Regular Users API...');
    
    // Test GET /api/admin/regular-users
    const getResult = await this.makeRequest('/api/admin/regular-users');
    this.results.push(getResult);
    
    if (getResult.status === 'PASS') {
      console.log(`✅ GET /api/admin/regular-users - ${getResult.statusCode} (${getResult.responseTime}ms)`);
      console.log(`   Found ${getResult.data?.pagination?.total || 0} regular users`);
    } else {
      console.log(`❌ GET /api/admin/regular-users - ${getResult.error}`);
    }
    
    console.log('');
  }

  private async testAdminDashboardStatsAPI() {
    console.log('🔍 Testing Admin Dashboard Stats API...');
    
    const result = await this.makeRequest('/api/admin/dashboard/stats');
    this.results.push(result);
    
    if (result.status === 'PASS') {
      console.log(`✅ GET /api/admin/dashboard/stats - ${result.statusCode} (${result.responseTime}ms)`);
      const stats = result.data?.data;
      if (stats) {
        console.log(`   Users: ${stats.totalUsers} total, ${stats.activeUsers} active`);
        console.log(`   Vulnerabilities: ${stats.totalVulnerabilities} total`);
        console.log(`   System Health: ${stats.systemHealth?.databaseStatus || 'unknown'}`);
      }
    } else {
      console.log(`❌ GET /api/admin/dashboard/stats - ${result.error}`);
    }
    console.log('');
  }

  private async testAuditLogsAPI() {
    console.log('🔍 Testing Audit Logs API...');
    
    const result = await this.makeRequest('/api/admin/audit-logs');
    this.results.push(result);
    
    if (result.status === 'PASS') {
      console.log(`✅ GET /api/admin/audit-logs - ${result.statusCode} (${result.responseTime}ms)`);
      console.log(`   Found ${result.data?.count || 0} audit logs`);
    } else {
      console.log(`❌ GET /api/admin/audit-logs - ${result.error}`);
    }
    console.log('');
  }

  private async testSystemConfigAPI() {
    console.log('🔍 Testing System Config API...');
    
    // Test GET /api/admin/system/config
    const getResult = await this.makeRequest('/api/admin/system/config');
    this.results.push(getResult);
    
    if (getResult.status === 'PASS') {
      console.log(`✅ GET /api/admin/system/config - ${getResult.statusCode} (${getResult.responseTime}ms)`);
      console.log(`   Found ${getResult.data?.count || 0} config items`);
    } else {
      console.log(`❌ GET /api/admin/system/config - ${getResult.error}`);
    }
    
    // Test POST /api/admin/system/config
    const postResult = await this.makeRequest('/api/admin/system/config', 'POST', {
      key: 'test_config',
      value: 'test_value',
      category: 'features',
      description: 'Test configuration item'
    });
    this.results.push(postResult);
    
    if (postResult.status === 'PASS') {
      console.log(`✅ POST /api/admin/system/config - ${postResult.statusCode} (${postResult.responseTime}ms)`);
    } else {
      console.log(`❌ POST /api/admin/system/config - ${postResult.error}`);
    }
    
    console.log('');
  }

  private async testSystemMaintenanceAPI() {
    console.log('🔍 Testing System Maintenance API...');
    
    // Test GET /api/admin/system/maintenance
    const getResult = await this.makeRequest('/api/admin/system/maintenance');
    this.results.push(getResult);
    
    if (getResult.status === 'PASS') {
      console.log(`✅ GET /api/admin/system/maintenance - ${getResult.statusCode} (${getResult.responseTime}ms)`);
      const data = getResult.data?.data;
      if (data) {
        console.log(`   Database Status: ${data.database?.status || 'unknown'}`);
        console.log(`   Collections: ${data.database?.collections || 0}`);
        console.log(`   Uptime: ${data.uptime || 0}s`);
      }
    } else {
      console.log(`❌ GET /api/admin/system/maintenance - ${getResult.error}`);
    }
    
    // Test POST /api/admin/system/maintenance (health check)
    const postResult = await this.makeRequest('/api/admin/system/maintenance', 'POST', {
      operation: 'health_check'
    });
    this.results.push(postResult);
    
    if (postResult.status === 'PASS') {
      console.log(`✅ POST /api/admin/system/maintenance - ${postResult.statusCode} (${postResult.responseTime}ms)`);
    } else {
      console.log(`❌ POST /api/admin/system/maintenance - ${postResult.error}`);
    }
    
    console.log('');
  }

  private async testSystemPerformanceAPI() {
    console.log('🔍 Testing System Performance API...');
    
    const result = await this.makeRequest('/api/admin/system/performance');
    this.results.push(result);
    
    if (result.status === 'PASS') {
      console.log(`✅ GET /api/admin/system/performance - ${result.statusCode} (${result.responseTime}ms)`);
      const data = result.data?.data;
      if (data) {
        console.log(`   Memory Usage: ${Math.round(data.system?.memory?.used / 1024 / 1024)}MB`);
        console.log(`   Uptime: ${Math.round(data.system?.uptime || 0)}s`);
        console.log(`   Response Time: ${data.trends?.responseTime?.average || 0}ms`);
      }
    } else {
      console.log(`❌ GET /api/admin/system/performance - ${result.error}`);
    }
    console.log('');
  }

  private async testSecuritySessionsAPI() {
    console.log('🔍 Testing Security Sessions API...');
    
    const result = await this.makeRequest('/api/admin/security/sessions');
    this.results.push(result);
    
    if (result.status === 'PASS') {
      console.log(`✅ GET /api/admin/security/sessions - ${result.statusCode} (${result.responseTime}ms)`);
      console.log(`   Found ${result.data?.pagination?.total || 0} sessions`);
    } else {
      console.log(`❌ GET /api/admin/security/sessions - ${result.error}`);
    }
    console.log('');
  }

  private async testSecurityAlertsAPI() {
    console.log('🔍 Testing Security Alerts API...');
    
    const result = await this.makeRequest('/api/admin/security/alerts');
    this.results.push(result);
    
    if (result.status === 'PASS') {
      console.log(`✅ GET /api/admin/security/alerts - ${result.statusCode} (${result.responseTime}ms)`);
      console.log(`   Found ${result.data?.pagination?.total || 0} security alerts`);
    } else {
      console.log(`❌ GET /api/admin/security/alerts - ${result.error}`);
    }
    console.log('');
  }

  private async testSystemAlertsAPI() {
    console.log('🔍 Testing System Alerts API...');
    
    const result = await this.makeRequest('/api/admin/system-alerts');
    this.results.push(result);
    
    if (result.status === 'PASS') {
      console.log(`✅ GET /api/admin/system-alerts - ${result.statusCode} (${result.responseTime}ms)`);
    } else {
      console.log(`❌ GET /api/admin/system-alerts - ${result.error}`);
    }
    console.log('');
  }

  private async testNotificationsAPI() {
    console.log('🔍 Testing Notifications API...');
    
    const result = await this.makeRequest('/api/admin/notifications');
    this.results.push(result);
    
    if (result.status === 'PASS') {
      console.log(`✅ GET /api/admin/notifications - ${result.statusCode} (${result.responseTime}ms)`);
    } else {
      console.log(`❌ GET /api/admin/notifications - ${result.error}`);
    }
    console.log('');
  }

  private async testInitializeAPI() {
    console.log('🔍 Testing Initialize API...');
    
    const result = await this.makeRequest('/api/admin/initialize');
    this.results.push(result);
    
    if (result.status === 'PASS') {
      console.log(`✅ GET /api/admin/initialize - ${result.statusCode} (${result.responseTime}ms)`);
      const status = result.data?.status;
      if (status) {
        console.log(`   Initialized: ${status.initialized}`);
        console.log(`   Admin Count: ${status.adminCount}`);
      }
    } else {
      console.log(`❌ GET /api/admin/initialize - ${result.error}`);
    }
    console.log('');
  }

  private generateReport() {
    console.log('📊 Test Results Summary');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
    console.log('');
    
    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   ${result.method} ${result.endpoint} - ${result.error}`);
        });
      console.log('');
    }
    
    const avgResponseTime = this.results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + (r.responseTime || 0), 0) / 
      this.results.filter(r => r.responseTime).length;
    
    console.log(`⚡ Average Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log('');
    
    if (passed === total) {
      console.log('🎉 All Admin API endpoints are working correctly!');
    } else {
      console.log('⚠️  Some API endpoints need attention. Please check the failed tests above.');
    }
  }
}

// Run the tests
async function main() {
  const tester = new AdminAPITester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { AdminAPITester };
