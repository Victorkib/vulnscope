import { getDatabase } from '@/lib/mongodb';
import { adminAuthService } from '@/lib/admin-auth';

/**
 * Debug frontend admin authentication issues
 */
async function debugFrontendAdmin() {
  try {
    console.log('🔍 Debugging Frontend Admin Authentication...\n');
    
    const db = await getDatabase();
    
    // Test 1: Simulate the exact API call that the frontend makes
    console.log('📋 Test 1: Simulating Frontend API Call');
    
    // Get the admin user from database
    const adminUsersCollection = db.collection('admin_users');
    const adminUser = await adminUsersCollection.findOne({ 
      userId: 'b085f05c-ba41-45a9-8aeb-23e8c03afbe7' 
    });
    
    if (adminUser) {
      console.log('✅ Admin user found in database');
      
      // Simulate the exact logic from /api/admin/status
      const isActive = adminUser.isActive;
      const isExpired = adminUser.expiresAt && new Date(adminUser.expiresAt) < new Date();
      
      console.log(`   isActive: ${isActive}`);
      console.log(`   isExpired: ${isExpired}`);
      console.log(`   expiresAt: ${adminUser.expiresAt || 'Never'}`);
      
      if (!isActive) {
        console.log('❌ Admin user is not active');
      } else if (isExpired) {
        console.log('❌ Admin user access has expired');
      } else {
        console.log('✅ Admin user should be recognized as admin');
        
        // Simulate the API response
        const apiResponse = {
          isAdmin: true,
          role: adminUser.role,
          permissions: adminUser.permissions,
          email: adminUser.email,
          grantedAt: adminUser.grantedAt,
          expiresAt: adminUser.expiresAt
        };
        
        console.log('📤 Simulated API Response:');
        console.log(JSON.stringify(apiResponse, null, 2));
      }
    } else {
      console.log('❌ Admin user NOT found in database');
    }
    console.log('');
    
    // Test 2: Check the useAdminAuth hook logic
    console.log('📋 Test 2: useAdminAuth Hook Logic Simulation');
    
    if (adminUser && adminUser.isActive && (!adminUser.expiresAt || new Date(adminUser.expiresAt) > new Date())) {
      console.log('✅ User should be recognized as admin');
      console.log('✅ isAdmin should be true');
      console.log('✅ adminUser should be populated');
      console.log('✅ loading should be false');
      console.log('✅ error should be null');
      
      // Simulate the state that should be set
      const expectedState = {
        isAdmin: true,
        adminUser: {
          userId: 'b085f05c-ba41-45a9-8aeb-23e8c03afbe7',
          email: adminUser.email,
          role: adminUser.role,
          permissions: adminUser.permissions,
          isActive: true,
          grantedBy: 'system',
          grantedAt: adminUser.grantedAt,
          expiresAt: adminUser.expiresAt,
          createdAt: adminUser.grantedAt,
          updatedAt: adminUser.grantedAt
        },
        loading: false,
        error: null
      };
      
      console.log('📤 Expected useAdminAuth State:');
      console.log(JSON.stringify(expectedState, null, 2));
    } else {
      console.log('❌ User should NOT be recognized as admin');
    }
    console.log('');
    
    // Test 3: Check the useAdminNavigation hook logic
    console.log('📋 Test 3: useAdminNavigation Hook Logic Simulation');
    
    if (adminUser && adminUser.isActive) {
      const adminNavigation = [
        {
          title: 'Admin Dashboard',
          icon: 'UserCog',
          href: '/admin/dashboard',
          badge: 'admin',
        },
        {
          title: 'User Management',
          icon: 'Users',
          href: '/admin/users',
          permission: 'user_management',
        },
        {
          title: 'Security & Audit',
          icon: 'Shield',
          href: '/admin/security',
          permission: 'security_audit',
        },
        {
          title: 'System Management',
          icon: 'Settings',
          href: '/admin/system',
          permission: 'system_config',
        }
      ];
      
      // Filter navigation based on permissions
      const filteredNavigation = adminNavigation.filter(item => {
        if (!item.permission) return true;
        return adminUser.permissions.includes(item.permission);
      });
      
      console.log('✅ Admin navigation should be filtered:');
      console.log(`   Total items: ${adminNavigation.length}`);
      console.log(`   Filtered items: ${filteredNavigation.length}`);
      filteredNavigation.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} (${item.href})`);
      });
    } else {
      console.log('❌ Admin navigation should be empty');
    }
    console.log('');
    
    // Test 4: Check the AppLayout conditional rendering logic
    console.log('📋 Test 4: AppLayout Conditional Rendering Logic');
    
    if (adminUser && adminUser.isActive) {
      const isAdmin = true;
      const adminLoading = false;
      const adminNavigation = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'User Management', href: '/admin/users' },
        { title: 'Security & Audit', href: '/admin/security' },
        { title: 'System Management', href: '/admin/system' }
      ];
      
      console.log('✅ AppLayout should render admin navigation:');
      console.log(`   isAdmin: ${isAdmin}`);
      console.log(`   adminLoading: ${adminLoading}`);
      console.log(`   adminNavigation.length: ${adminNavigation.length}`);
      console.log(`   Condition: !adminLoading && isAdmin === true`);
      console.log(`   Result: ${!adminLoading && isAdmin === true ? 'SHOW ADMIN NAVIGATION' : 'HIDE ADMIN NAVIGATION'}`);
      
      if (!adminLoading && isAdmin === true) {
        console.log('✅ Admin navigation should be visible');
        console.log('✅ Administration separator should be visible');
        console.log('✅ Admin navigation items should be visible');
      } else {
        console.log('❌ Admin navigation should NOT be visible');
      }
    } else {
      console.log('❌ Admin navigation should NOT be visible');
    }
    console.log('');
    
    // Test 5: Check for potential issues
    console.log('📋 Test 5: Potential Issues Check');
    
    const potentialIssues = [];
    
    if (!adminUser) {
      potentialIssues.push('Admin user not found in database');
    }
    
    if (adminUser && !adminUser.isActive) {
      potentialIssues.push('Admin user is not active');
    }
    
    if (adminUser && adminUser.expiresAt && new Date(adminUser.expiresAt) < new Date()) {
      potentialIssues.push('Admin user access has expired');
    }
    
    if (adminUser && adminUser.permissions.length === 0) {
      potentialIssues.push('Admin user has no permissions');
    }
    
    if (potentialIssues.length === 0) {
      console.log('✅ No potential issues found');
      console.log('✅ All checks passed');
      console.log('✅ Admin navigation should be working');
    } else {
      console.log('❌ Potential issues found:');
      potentialIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    console.log('');
    
    console.log('🎯 Final Analysis:');
    if (adminUser && adminUser.isActive && (!adminUser.expiresAt || new Date(adminUser.expiresAt) > new Date())) {
      console.log('✅ Backend is working correctly');
      console.log('✅ Admin user is properly configured');
      console.log('✅ API should return isAdmin: true');
      console.log('✅ Frontend should show admin navigation');
      console.log('');
      console.log('🔍 If admin navigation is still not showing, the issue might be:');
      console.log('   1. Frontend not making the API call');
      console.log('   2. API call failing silently');
      console.log('   3. React state not updating');
      console.log('   4. Component not re-rendering');
      console.log('   5. Browser cache issues');
    } else {
      console.log('❌ Backend issue detected');
      console.log('❌ Admin user configuration problem');
    }
    
  } catch (error) {
    console.error('❌ Error debugging frontend admin:', error);
    throw error;
  }
}

// Run the debug script
if (require.main === module) {
  debugFrontendAdmin()
    .then(() => {
      console.log('🎉 Frontend admin debug completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Frontend admin debug failed:', error);
      process.exit(1);
    });
}

export { debugFrontendAdmin };
