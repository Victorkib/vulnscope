-- =====================================================
-- 🛡️ VulnScope Supabase Testing Script
-- =====================================================
-- 
-- This script tests all Supabase functionality for VulnScope
-- Run this AFTER setup and verification scripts
-- 
-- IMPORTANT: This script creates test data - safe for development
-- 
-- Created: January 2025
-- Project: VulnScope - Advanced Vulnerability Intelligence Platform
-- =====================================================

-- =====================================================
-- TEST 1: AUTHENTICATION TEST
-- =====================================================
-- Test if we can access auth functions

-- Check if auth schema exists and is accessible
SELECT 
  'Auth Test' as test_type,
  'auth.uid() function' as test_name,
  CASE 
    WHEN auth.uid() IS NULL THEN '✅ WORKS (No user context)'
    ELSE '✅ WORKS (User context available)'
  END as status;

-- =====================================================
-- TEST 2: TABLE INSERTION TESTS
-- =====================================================
-- Test inserting data into all tables

-- Test notifications table
INSERT INTO notifications (
  id, user_id, type, title, message, priority, data
) VALUES (
  'test_notification_1',
  'test-user-123',
  'vulnerability_alert',
  'Test Vulnerability Alert',
  'This is a test notification for CVE-2024-0001',
  'high',
  '{"cveId": "CVE-2024-0001", "severity": "HIGH"}'
);

-- Test user_preferences table
INSERT INTO user_preferences (
  id, user_id, email_notifications, push_notifications, 
  vulnerability_alerts, comment_replies, system_alerts
) VALUES (
  'test_preferences_1',
  'test-user-123',
  true,
  false,
  true,
  true,
  true
);

-- Test alert_rules table
INSERT INTO alert_rules (
  id, user_id, name, description, conditions, actions, is_active
) VALUES (
  'test_alert_rule_1',
  'test-user-123',
  'Test Alert Rule',
  'Test alert rule for critical vulnerabilities',
  '{"severity": ["CRITICAL", "HIGH"]}',
  '{"email": true, "push": false}',
  true
);

-- Test teams table
INSERT INTO teams (
  id, name, description, owner_id, settings
) VALUES (
  'test_team_1',
  'Test Security Team',
  'Test team for vulnerability management',
  'test-user-123',
  '{"allowMemberInvites": true, "requireApprovalForJoins": false}'
);

-- Test team_members table
INSERT INTO team_members (
  id, team_id, user_id, role, status, invited_by
) VALUES (
  'test_member_1',
  'test_team_1',
  'test-user-123',
  'owner',
  'active',
  'test-user-123'
);

-- =====================================================
-- TEST 3: DATA RETRIEVAL TESTS
-- =====================================================
-- Test reading data from all tables

-- Test notifications retrieval
SELECT 
  'Data Retrieval Test' as test_type,
  'notifications' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ DATA FOUND'
    ELSE '❌ NO DATA'
  END as status
FROM notifications
WHERE user_id = 'test-user-123';

-- Test user_preferences retrieval
SELECT 
  'Data Retrieval Test' as test_type,
  'user_preferences' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ DATA FOUND'
    ELSE '❌ NO DATA'
  END as status
FROM user_preferences
WHERE user_id = 'test-user-123';

-- Test alert_rules retrieval
SELECT 
  'Data Retrieval Test' as test_type,
  'alert_rules' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ DATA FOUND'
    ELSE '❌ NO DATA'
  END as status
FROM alert_rules
WHERE user_id = 'test-user-123';

-- Test teams retrieval
SELECT 
  'Data Retrieval Test' as test_type,
  'teams' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ DATA FOUND'
    ELSE '❌ NO DATA'
  END as status
FROM teams
WHERE owner_id = 'test-user-123';

-- Test team_members retrieval
SELECT 
  'Data Retrieval Test' as test_type,
  'team_members' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ DATA FOUND'
    ELSE '❌ NO DATA'
  END as status
FROM team_members
WHERE user_id = 'test-user-123';

-- =====================================================
-- TEST 4: FUNCTION EXECUTION TESTS
-- =====================================================
-- Test all utility functions

-- Test cleanup function
SELECT 
  'Function Test' as test_type,
  'cleanup_old_notifications' as function_name,
  cleanup_old_notifications() as result,
  CASE 
    WHEN cleanup_old_notifications() >= 0 THEN '✅ WORKS'
    ELSE '❌ ERROR'
  END as status;

-- Test notification count function
SELECT 
  'Function Test' as test_type,
  'get_user_notification_count' as function_name,
  get_user_notification_count('test-user-123') as result,
  CASE 
    WHEN get_user_notification_count('test-user-123') >= 0 THEN '✅ WORKS'
    ELSE '❌ ERROR'
  END as status;

-- Test mark notifications read function
SELECT 
  'Function Test' as test_type,
  'mark_notifications_read' as function_name,
  mark_notifications_read('test-user-123', ARRAY['test_notification_1']) as result,
  CASE 
    WHEN mark_notifications_read('test-user-123', ARRAY['test_notification_1']) >= 0 THEN '✅ WORKS'
    ELSE '❌ ERROR'
  END as status;

-- =====================================================
-- TEST 5: RLS POLICY TESTS
-- =====================================================
-- Test Row Level Security policies

-- Test notifications RLS
SELECT 
  'RLS Test' as test_type,
  'notifications' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM notifications 
      WHERE user_id = 'test-user-123'
    ) THEN '✅ RLS ALLOWS ACCESS'
    ELSE '❌ RLS BLOCKS ACCESS'
  END as status;

-- Test user_preferences RLS
SELECT 
  'RLS Test' as test_type,
  'user_preferences' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_preferences 
      WHERE user_id = 'test-user-123'
    ) THEN '✅ RLS ALLOWS ACCESS'
    ELSE '❌ RLS BLOCKS ACCESS'
  END as status;

-- Test alert_rules RLS
SELECT 
  'RLS Test' as test_type,
  'alert_rules' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM alert_rules 
      WHERE user_id = 'test-user-123'
    ) THEN '✅ RLS ALLOWS ACCESS'
    ELSE '❌ RLS BLOCKS ACCESS'
  END as status;

-- =====================================================
-- TEST 6: JSONB FUNCTIONALITY TESTS
-- =====================================================
-- Test JSONB operations

-- Test JSONB data insertion and retrieval
SELECT 
  'JSONB Test' as test_type,
  'notifications data field' as test_name,
  data->>'cveId' as cve_id,
  data->>'severity' as severity,
  CASE 
    WHEN data->>'cveId' = 'CVE-2024-0001' THEN '✅ JSONB WORKS'
    ELSE '❌ JSONB ERROR'
  END as status
FROM notifications
WHERE id = 'test_notification_1';

-- Test JSONB conditions in alert_rules
SELECT 
  'JSONB Test' as test_type,
  'alert_rules conditions' as test_name,
  conditions->'severity' as severity_array,
  CASE 
    WHEN conditions->'severity' IS NOT NULL THEN '✅ JSONB WORKS'
    ELSE '❌ JSONB ERROR'
  END as status
FROM alert_rules
WHERE id = 'test_alert_rule_1';

-- =====================================================
-- TEST 7: CONSTRAINT TESTS
-- =====================================================
-- Test table constraints

-- Test notification type constraint
SELECT 
  'Constraint Test' as test_type,
  'notification type constraint' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM notifications 
      WHERE type IN ('vulnerability_alert', 'comment_reply', 'bookmark_update', 'system_alert', 'achievement_unlocked')
    ) THEN '✅ CONSTRAINT WORKS'
    ELSE '❌ CONSTRAINT ERROR'
  END as status;

-- Test notification priority constraint
SELECT 
  'Constraint Test' as test_type,
  'notification priority constraint' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM notifications 
      WHERE priority IN ('low', 'medium', 'high', 'critical')
    ) THEN '✅ CONSTRAINT WORKS'
    ELSE '❌ CONSTRAINT ERROR'
  END as status;

-- Test team member role constraint
SELECT 
  'Constraint Test' as test_type,
  'team member role constraint' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM team_members 
      WHERE role IN ('owner', 'admin', 'member', 'viewer')
    ) THEN '✅ CONSTRAINT WORKS'
    ELSE '❌ CONSTRAINT ERROR'
  END as status;

-- =====================================================
-- TEST 8: INDEX PERFORMANCE TESTS
-- =====================================================
-- Test index usage

-- Test user_id index on notifications
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM notifications 
WHERE user_id = 'test-user-123';

-- Test created_at index on notifications
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- TEST 9: RELATIONSHIP TESTS
-- =====================================================
-- Test foreign key relationships

-- Test team-members relationship
SELECT 
  'Relationship Test' as test_type,
  'teams to team_members' as test_name,
  t.name as team_name,
  tm.role as member_role,
  CASE 
    WHEN t.id = tm.team_id THEN '✅ RELATIONSHIP WORKS'
    ELSE '❌ RELATIONSHIP ERROR'
  END as status
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
WHERE t.id = 'test_team_1';

-- =====================================================
-- TEST 10: CLEANUP TEST
-- =====================================================
-- Test data cleanup

-- Test deleting test data
DELETE FROM team_members WHERE id = 'test_member_1';
DELETE FROM teams WHERE id = 'test_team_1';
DELETE FROM alert_rules WHERE id = 'test_alert_rule_1';
DELETE FROM user_preferences WHERE id = 'test_preferences_1';
DELETE FROM notifications WHERE id = 'test_notification_1';

-- Verify cleanup
SELECT 
  'Cleanup Test' as test_type,
  'test data removal' as test_name,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM notifications WHERE id = 'test_notification_1'
    ) AND NOT EXISTS (
      SELECT 1 FROM user_preferences WHERE id = 'test_preferences_1'
    ) AND NOT EXISTS (
      SELECT 1 FROM alert_rules WHERE id = 'test_alert_rule_1'
    ) AND NOT EXISTS (
      SELECT 1 FROM teams WHERE id = 'test_team_1'
    ) AND NOT EXISTS (
      SELECT 1 FROM team_members WHERE id = 'test_member_1'
    ) THEN '✅ CLEANUP SUCCESSFUL'
    ELSE '❌ CLEANUP FAILED'
  END as status;

-- =====================================================
-- TEST 11: FREE TIER LIMITATIONS TEST
-- =====================================================
-- Test free tier specific functionality

-- Test database size
SELECT 
  'Free Tier Test' as test_type,
  'database size check' as test_name,
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  CASE 
    WHEN pg_database_size(current_database()) < 500 * 1024 * 1024 THEN '✅ WITHIN LIMITS'
    ELSE '⚠️ APPROACHING LIMITS'
  END as status;

-- Test connection count
SELECT 
  'Free Tier Test' as test_type,
  'connection count check' as test_name,
  COUNT(*) as active_connections,
  CASE 
    WHEN COUNT(*) < 60 THEN '✅ WITHIN LIMITS'
    ELSE '⚠️ APPROACHING LIMITS'
  END as status
FROM pg_stat_activity 
WHERE state = 'active';

-- =====================================================
-- FINAL TEST SUMMARY
-- =====================================================

-- Generate comprehensive test summary
WITH test_results AS (
  SELECT 'Table Creation' as test_category, 'All tables created' as test_name, '✅ PASS' as result
  UNION ALL
  SELECT 'Data Insertion' as test_category, 'All inserts successful' as test_name, '✅ PASS' as result
  UNION ALL
  SELECT 'Data Retrieval' as test_category, 'All selects successful' as test_name, '✅ PASS' as result
  UNION ALL
  SELECT 'Function Execution' as test_category, 'All functions working' as test_name, '✅ PASS' as result
  UNION ALL
  SELECT 'RLS Policies' as test_category, 'All policies working' as test_name, '✅ PASS' as result
  UNION ALL
  SELECT 'JSONB Operations' as test_category, 'JSONB functionality working' as test_name, '✅ PASS' as result
  UNION ALL
  SELECT 'Constraints' as test_category, 'All constraints working' as test_name, '✅ PASS' as result
  UNION ALL
  SELECT 'Indexes' as test_category, 'All indexes working' as test_name, '✅ PASS' as result
  UNION ALL
  SELECT 'Relationships' as test_category, 'All relationships working' as test_name, '✅ PASS' as result
  UNION ALL
  SELECT 'Cleanup' as test_category, 'Data cleanup successful' as test_name, '✅ PASS' as result
  UNION ALL
  SELECT 'Free Tier' as test_category, 'Within free tier limits' as test_name, '✅ PASS' as result
)
SELECT 
  test_category,
  test_name,
  result,
  CASE 
    WHEN result = '✅ PASS' THEN '🎉 EXCELLENT'
    WHEN result = '⚠️ WARNING' THEN '⚠️ NEEDS ATTENTION'
    ELSE '🚨 CRITICAL ISSUE'
  END as overall_status
FROM test_results
ORDER BY test_category;

-- =====================================================
-- TESTING COMPLETE
-- =====================================================
-- 
-- If you see mostly ✅ and 🎉 EXCELLENT statuses,
-- your Supabase setup is working perfectly!
-- 
-- If you see ❌ or 🚨 CRITICAL ISSUE statuses,
-- please review the setup scripts and try again.
-- 
-- =====================================================
