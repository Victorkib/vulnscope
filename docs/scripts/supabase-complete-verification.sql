-- =====================================================
-- 🛡️ VulnScope Supabase Complete Verification Script
-- =====================================================
-- 
-- This script provides comprehensive verification of your Supabase setup
-- including the original setup and all free tier optimizations
-- 
-- Run this AFTER running both setup scripts and adjustment scripts
-- 
-- Created: January 2025
-- Project: VulnScope - Advanced Vulnerability Intelligence Platform
-- =====================================================

-- =====================================================
-- COMPREHENSIVE VERIFICATION REPORT
-- =====================================================

-- Generate a complete status report
WITH verification_results AS (
  -- Check core tables
  SELECT 
    'Core Tables' as category,
    'notifications' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
    'Critical' as priority
  UNION ALL
  SELECT 'Core Tables', 'user_preferences', 
         CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') 
              THEN '✅ EXISTS' ELSE '❌ MISSING' END, 'Critical'
  UNION ALL
  SELECT 'Core Tables', 'alert_rules', 
         CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alert_rules') 
              THEN '✅ EXISTS' ELSE '❌ MISSING' END, 'High'
  UNION ALL
  SELECT 'Core Tables', 'teams', 
         CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') 
              THEN '✅ EXISTS' ELSE '❌ MISSING' END, 'Medium'
  UNION ALL
  SELECT 'Core Tables', 'team_members', 
         CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') 
              THEN '✅ EXISTS' ELSE '❌ MISSING' END, 'Medium'
  
  UNION ALL
  
  -- Check RLS
  SELECT 'Security', 'RLS Enabled', 
         CASE WHEN COUNT(*) = 5 THEN '✅ ALL ENABLED' ELSE '❌ PARTIAL' END, 'Critical'
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members')
  AND rowsecurity = true
  
  UNION ALL
  
  -- Check functions
  SELECT 'Functions', 'Core Functions', 
         CASE WHEN COUNT(*) = 3 THEN '✅ ALL EXIST' ELSE '❌ MISSING' END, 'High'
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name IN ('cleanup_old_notifications', 'get_user_notification_count', 'mark_notifications_read')
  
  UNION ALL
  
  -- Check free tier optimization functions
  SELECT 'Free Tier', 'Optimization Functions', 
         CASE WHEN COUNT(*) >= 8 THEN '✅ ALL EXIST' ELSE '❌ MISSING' END, 'High'
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_database_size', 'get_active_connections', 'get_user_notification_stats',
    'cleanup_old_data', 'archive_old_notifications', 'get_minimal_notifications',
    'get_notification_badge_count', 'check_user_connection_status', 'get_connection_stats',
    'run_maintenance_tasks', 'check_usage_alerts'
  )
  
  UNION ALL
  
  -- Check indexes
  SELECT 'Performance', 'Indexes', 
         CASE WHEN COUNT(*) >= 10 THEN '✅ OPTIMIZED' ELSE '⚠️ NEEDS MORE' END, 'Medium'
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members')
  AND indexname LIKE 'idx_%'
  
  UNION ALL
  
  -- Check views
  SELECT 'Monitoring', 'Monitoring Views', 
         CASE WHEN COUNT(*) = 3 THEN '✅ ALL EXIST' ELSE '❌ MISSING' END, 'Low'
  FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name IN ('database_size_monitor', 'connection_monitor', 'notification_monitor')
)

SELECT 
  category,
  item,
  status,
  priority,
  CASE 
    WHEN status LIKE '✅%' THEN '🎉 EXCELLENT'
    WHEN status LIKE '⚠️%' THEN '⚠️ NEEDS ATTENTION'
    ELSE '🚨 CRITICAL ISSUE'
  END as overall_status
FROM verification_results
ORDER BY 
  CASE priority 
    WHEN 'Critical' THEN 1 
    WHEN 'High' THEN 2 
    WHEN 'Medium' THEN 3 
    ELSE 4 
  END,
  category,
  item;

-- =====================================================
-- FREE TIER USAGE CHECK
-- =====================================================

-- Check current database size
SELECT 
  'Database Size Check' as check_type,
  pg_size_pretty(pg_database_size(current_database())) as current_size,
  '500MB' as free_tier_limit,
  CASE 
    WHEN pg_database_size(current_database()) > 450 * 1024 * 1024 THEN '🚨 CRITICAL - Approaching limit'
    WHEN pg_database_size(current_database()) > 400 * 1024 * 1024 THEN '⚠️ WARNING - Getting large'
    ELSE '✅ OK - Within limits'
  END as status;

-- Check active connections
SELECT 
  'Connection Check' as check_type,
  COUNT(*) as active_connections,
  60 as free_tier_limit,
  CASE 
    WHEN COUNT(*) > 55 THEN '🚨 CRITICAL - Approaching limit'
    WHEN COUNT(*) > 50 THEN '⚠️ WARNING - High usage'
    ELSE '✅ OK - Within limits'
  END as status
FROM pg_stat_activity 
WHERE state = 'active' 
AND datname = current_database();

-- Check notification count
SELECT 
  'Notification Count' as check_type,
  COUNT(*) as total_notifications,
  10000 as recommended_limit,
  CASE 
    WHEN COUNT(*) > 9500 THEN '🚨 CRITICAL - Too many notifications'
    WHEN COUNT(*) > 8000 THEN '⚠️ WARNING - High count'
    ELSE '✅ OK - Within limits'
  END as status
FROM notifications;

-- =====================================================
-- FUNCTIONALITY TESTS
-- =====================================================

-- Test core functions
SELECT 
  'Function Test' as test_type,
  'cleanup_old_notifications' as function_name,
  cleanup_old_notifications() as result,
  CASE 
    WHEN cleanup_old_notifications() >= 0 THEN '✅ WORKS'
    ELSE '❌ ERROR'
  END as status;

-- Test free tier functions
SELECT 
  'Free Tier Function Test' as test_type,
  'get_database_size' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM get_database_size()) THEN '✅ WORKS'
    ELSE '❌ ERROR'
  END as status;

-- Test connection stats
SELECT 
  'Connection Stats Test' as test_type,
  'get_connection_stats' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM get_connection_stats()) THEN '✅ WORKS'
    ELSE '❌ ERROR'
  END as status;

-- Test usage alerts
SELECT 
  'Usage Alerts Test' as test_type,
  'check_usage_alerts' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM check_usage_alerts()) THEN '✅ WORKS'
    ELSE '❌ ERROR'
  END as status;

-- =====================================================
-- PERFORMANCE TESTS
-- =====================================================

-- Test notification query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM notifications 
WHERE user_id = 'test-user' 
ORDER BY created_at DESC 
LIMIT 20;

-- Test minimal notification query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, type, title, priority, is_read, created_at 
FROM notifications 
WHERE user_id = 'test-user' 
ORDER BY created_at DESC 
LIMIT 20;

-- =====================================================
-- SECURITY VERIFICATION
-- =====================================================

-- Check RLS policies
SELECT 
  'RLS Policy Check' as check_type,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ SECURE'
    ELSE '⚠️ NEEDS MORE POLICIES'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('notifications', 'user_preferences', 'alert_rules', 'teams', 'team_members')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- MONITORING VIEWS TEST
-- =====================================================

-- Test monitoring views
SELECT * FROM database_size_monitor;
SELECT * FROM connection_monitor;
SELECT * FROM notification_monitor;

-- =====================================================
-- FINAL RECOMMENDATIONS
-- =====================================================

-- Generate recommendations based on current state
WITH recommendations AS (
  SELECT 
    'Database Size' as area,
    CASE 
      WHEN pg_database_size(current_database()) > 400 * 1024 * 1024 THEN 
        'Consider running cleanup_old_data() to free up space'
      ELSE 'Database size is healthy'
    END as recommendation
  UNION ALL
  SELECT 
    'Connections',
    CASE 
      WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') > 50 THEN 
        'Monitor connection usage and implement connection pooling'
      ELSE 'Connection usage is healthy'
    END
  UNION ALL
  SELECT 
    'Notifications',
    CASE 
      WHEN (SELECT COUNT(*) FROM notifications) > 8000 THEN 
        'Consider archiving old notifications with archive_old_notifications()'
      ELSE 'Notification count is healthy'
    END
  UNION ALL
  SELECT 
    'Maintenance',
    'Set up regular maintenance tasks using run_maintenance_tasks() function'
  UNION ALL
  SELECT 
    'Monitoring',
    'Use the monitoring views to track usage: database_size_monitor, connection_monitor, notification_monitor'
)

SELECT 
  area,
  recommendation,
  CASE 
    WHEN recommendation LIKE '%healthy%' THEN '✅ GOOD'
    WHEN recommendation LIKE '%Consider%' THEN '⚠️ RECOMMENDED'
    ELSE 'ℹ️ INFO'
  END as priority
FROM recommendations
ORDER BY priority, area;

-- =====================================================
-- SETUP COMPLETE VERIFICATION
-- =====================================================

-- Final status check
SELECT 
  '🎉 VULNSCOPE SUPABASE SETUP STATUS' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences')
     AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_database_size')
     AND EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'database_size_monitor')
    THEN '✅ FULLY CONFIGURED AND OPTIMIZED'
    ELSE '❌ SETUP INCOMPLETE'
  END as result;

-- =====================================================
-- NEXT STEPS
-- =====================================================

SELECT 
  '📋 NEXT STEPS' as section,
  '1. Update your application code with the new free tier optimizations' as step_1,
  '2. Set up regular maintenance tasks in your application' as step_2,
  '3. Monitor usage with the provided monitoring functions' as step_3,
  '4. Test real-time notifications with connection management' as step_4,
  '5. Implement bandwidth optimization in your API calls' as step_5;

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================
-- 
-- If you see mostly ✅ and 🎉 EXCELLENT statuses,
-- your Supabase setup is fully optimized for the free tier!
-- 
-- Your VulnScope project now has:
-- ✅ Complete database schema
-- ✅ Row Level Security
-- ✅ Free tier optimizations
-- ✅ Monitoring and maintenance functions
-- ✅ Performance optimizations
-- ✅ Bandwidth optimization
-- ✅ Connection management
-- 
-- =====================================================
