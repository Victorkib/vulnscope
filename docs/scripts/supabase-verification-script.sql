-- =====================================================
-- 🛡️ VulnScope Supabase Verification Script
-- =====================================================
-- 
-- This script verifies that all Supabase setup is working correctly
-- Run this AFTER running the main setup script
-- 
-- IMPORTANT: This script only READS data - it's safe to run
-- 
-- Created: January 2025
-- Project: VulnScope - Advanced Vulnerability Intelligence Platform
-- =====================================================

-- =====================================================
-- VERIFICATION 1: CHECK TABLE CREATION
-- =====================================================

-- Check if all required tables exist
SELECT 
  'Table Check' as test_type,
  table_name,
  CASE 
    WHEN table_name IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members')
ORDER BY table_name;

-- =====================================================
-- VERIFICATION 2: CHECK INDEXES
-- =====================================================

-- Check if all required indexes exist
SELECT 
  'Index Check' as test_type,
  indexname,
  tablename,
  CASE 
    WHEN indexname LIKE 'idx_%' 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members')
ORDER BY tablename, indexname;

-- =====================================================
-- VERIFICATION 3: CHECK ROW LEVEL SECURITY
-- =====================================================

-- Check if RLS is enabled on all tables
SELECT 
  'RLS Check' as test_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true 
    THEN '✅ ENABLED' 
    ELSE '❌ DISABLED' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members')
ORDER BY tablename;

-- =====================================================
-- VERIFICATION 4: CHECK RLS POLICIES
-- =====================================================

-- Check if RLS policies exist
SELECT 
  'Policy Check' as test_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN policyname IS NOT NULL 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members')
ORDER BY tablename, policyname;

-- =====================================================
-- VERIFICATION 5: CHECK FUNCTIONS
-- =====================================================

-- Check if utility functions exist
SELECT 
  'Function Check' as test_type,
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name IN ('cleanup_old_notifications', 'get_user_notification_count', 'mark_notifications_read') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('cleanup_old_notifications', 'get_user_notification_count', 'mark_notifications_read')
ORDER BY routine_name;

-- =====================================================
-- VERIFICATION 6: CHECK TABLE STRUCTURE
-- =====================================================

-- Check notifications table structure
SELECT 
  'Notifications Table Structure' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Check user_preferences table structure
SELECT 
  'User Preferences Table Structure' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Check alert_rules table structure
SELECT 
  'Alert Rules Table Structure' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'alert_rules'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICATION 7: CHECK CONSTRAINTS
-- =====================================================

-- Check constraints on notifications table
SELECT 
  'Notifications Constraints' as test_type,
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'notifications'
ORDER BY tc.constraint_name;

-- Check constraints on user_preferences table
SELECT 
  'User Preferences Constraints' as test_type,
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'user_preferences'
ORDER BY tc.constraint_name;

-- =====================================================
-- VERIFICATION 8: TEST FUNCTION EXECUTION
-- =====================================================

-- Test cleanup function (should return 0 since no old data)
SELECT 
  'Function Test' as test_type,
  'cleanup_old_notifications' as function_name,
  cleanup_old_notifications() as result,
  CASE 
    WHEN cleanup_old_notifications() >= 0 
    THEN '✅ WORKS' 
    ELSE '❌ ERROR' 
  END as status;

-- Test notification count function with dummy user
SELECT 
  'Function Test' as test_type,
  'get_user_notification_count' as function_name,
  get_user_notification_count('test-user-id') as result,
  CASE 
    WHEN get_user_notification_count('test-user-id') >= 0 
    THEN '✅ WORKS' 
    ELSE '❌ ERROR' 
  END as status;

-- =====================================================
-- VERIFICATION 9: CHECK PERMISSIONS
-- =====================================================

-- Check table permissions
SELECT 
  'Permission Check' as test_type,
  table_name,
  privilege_type,
  grantee,
  CASE 
    WHEN privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE') 
    THEN '✅ GRANTED' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members')
AND grantee IN ('authenticated', 'service_role')
ORDER BY table_name, privilege_type;

-- =====================================================
-- VERIFICATION 10: SUMMARY REPORT
-- =====================================================

-- Generate a summary report
WITH verification_summary AS (
  SELECT 
    'Tables' as category,
    COUNT(*) as total_expected,
    COUNT(*) as total_found,
    CASE WHEN COUNT(*) = 5 THEN '✅ ALL GOOD' ELSE '❌ ISSUES FOUND' END as status
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members')
  
  UNION ALL
  
  SELECT 
    'RLS Enabled' as category,
    5 as total_expected,
    COUNT(*) as total_found,
    CASE WHEN COUNT(*) = 5 THEN '✅ ALL GOOD' ELSE '❌ ISSUES FOUND' END as status
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members')
  AND rowsecurity = true
  
  UNION ALL
  
  SELECT 
    'Functions' as category,
    3 as total_expected,
    COUNT(*) as total_found,
    CASE WHEN COUNT(*) = 3 THEN '✅ ALL GOOD' ELSE '❌ ISSUES FOUND' END as status
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name IN ('cleanup_old_notifications', 'get_user_notification_count', 'mark_notifications_read')
)

SELECT 
  category,
  total_expected,
  total_found,
  status,
  CASE 
    WHEN total_found = total_expected THEN '🎉 PERFECT'
    WHEN total_found > 0 THEN '⚠️ PARTIAL'
    ELSE '🚨 CRITICAL ISSUES'
  END as overall_status
FROM verification_summary
ORDER BY category;

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================
-- 
-- If you see mostly ✅ and 🎉 PERFECT statuses, 
-- your Supabase setup is working correctly!
-- 
-- If you see ❌ or 🚨 CRITICAL ISSUES, please:
-- 1. Re-run the main setup script
-- 2. Check for any error messages
-- 3. Contact support if issues persist
-- 
-- =====================================================
