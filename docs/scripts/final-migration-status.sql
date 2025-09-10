-- =====================================================
-- 🎯 Final Migration Status Check
-- =====================================================
-- 
-- This script provides the final status of your comment system migration
-- and confirms that 4 triggers is the CORRECT and EXPECTED state.
-- 
-- IMPORTANT: 4 triggers = PERFECT migration status
-- 
-- =====================================================

-- =====================================================
-- FINAL MIGRATION STATUS
-- =====================================================

-- Check final migration status with correct expectations
WITH migration_summary AS (
  SELECT 
    'Tables' as category,
    COUNT(*) as total_expected,
    COUNT(*) as total_found,
    CASE WHEN COUNT(*) = 2 THEN '✅ COMPLETE' ELSE '❌ INCOMPLETE' END as status
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('vulnerability_comments', 'comment_votes')
  
  UNION ALL
  
  SELECT 
    'RLS Enabled' as category,
    2 as total_expected,
    COUNT(*) as total_found,
    CASE WHEN COUNT(*) = 2 THEN '✅ COMPLETE' ELSE '❌ INCOMPLETE' END as status
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('vulnerability_comments', 'comment_votes')
  AND rowsecurity = true
  
  UNION ALL
  
  SELECT 
    'Policies' as category,
    8 as total_expected,
    COUNT(*) as total_found,
    CASE WHEN COUNT(*) >= 8 THEN '✅ COMPLETE' ELSE '❌ INCOMPLETE' END as status
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename IN ('vulnerability_comments', 'comment_votes')
  
  UNION ALL
  
  SELECT 
    'Functions' as category,
    2 as total_expected,
    COUNT(*) as total_found,
    CASE WHEN COUNT(*) = 2 THEN '✅ COMPLETE' ELSE '❌ INCOMPLETE' END as status
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name IN ('update_updated_at_column', 'update_comment_vote_counts')
  
  UNION ALL
  
  SELECT 
    'Triggers' as category,
    4 as total_expected,  -- CORRECTED: 4 is the expected number
    COUNT(*) as total_found,
    CASE WHEN COUNT(*) = 4 THEN '✅ COMPLETE' ELSE '❌ INCOMPLETE' END as status
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public' 
  AND event_object_table IN ('vulnerability_comments', 'comment_votes')
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
FROM migration_summary
ORDER BY category;

-- =====================================================
-- TRIGGER BREAKDOWN
-- =====================================================

-- Show exactly what triggers you have
SELECT 
  'Trigger Details' as check_type,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event_type,
  CASE 
    WHEN trigger_name = 'update_vulnerability_comments_updated_at' 
    THEN '✅ Updates timestamp when comment is edited'
    WHEN trigger_name = 'comment_changes_trigger' 
    THEN '✅ Sends real-time notifications for comment changes'
    WHEN trigger_name = 'update_comment_vote_counts_trigger' 
    THEN '✅ Updates like/dislike counts when votes change'
    WHEN trigger_name = 'vote_changes_trigger' 
    THEN '✅ Sends real-time notifications for vote changes'
    ELSE '❓ Unknown trigger purpose'
  END as purpose
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('vulnerability_comments', 'comment_votes')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- MIGRATION COMPLETION STATUS
-- =====================================================

-- Final status assessment
SELECT 
  '🎉 MIGRATION STATUS' as status,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) = 4
    THEN '✅ COMPLETE - All 4 triggers present'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) > 4
    THEN '⚠️ OVER-COMPLETE - More than 4 triggers (may have duplicates)'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) < 4
    THEN '❌ INCOMPLETE - Missing required triggers'
    ELSE '❓ UNKNOWN STATE'
  END as trigger_status,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) = 4
    THEN 'Your comment system migration is PERFECT! You have all required triggers for full functionality.'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) > 4
    THEN 'You have more triggers than expected. This may indicate duplicate triggers that should be cleaned up.'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) < 4
    THEN 'You are missing some required triggers. Run the migration scripts to complete the setup.'
    ELSE 'Unable to determine migration status. Please check your trigger setup manually.'
  END as message;

-- =====================================================
-- NEXT STEPS
-- =====================================================

-- Provide next steps based on current state
SELECT 
  'Next Steps' as action_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) = 4
    THEN '🚀 PROCEED TO API TESTING'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) > 4
    THEN '🔧 CLEAN UP DUPLICATE TRIGGERS'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) < 4
    THEN '📋 COMPLETE MIGRATION SETUP'
    ELSE '❓ INVESTIGATE CURRENT STATE'
  END as action,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) = 4
    THEN '1. Set environment variables to enable Supabase
2. Test comment functionality in your application
3. Verify real-time updates work
4. Monitor performance and user experience'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) > 4
    THEN '1. Run the fix-triggers.sql script to clean up duplicates
2. Verify you have exactly 4 triggers
3. Then proceed with API testing'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) < 4
    THEN '1. Run the supabase-comments-unified-setup.sql script
2. Verify you have exactly 4 triggers
3. Then proceed with API testing'
    ELSE 'Please investigate your current trigger setup and determine what needs to be done.'
  END as instructions;

-- =====================================================
-- FINAL MIGRATION STATUS COMPLETE
-- =====================================================
-- 
-- If you see 4 triggers, your migration is PERFECT!
-- 
-- The 4 triggers provide:
-- 1. Timestamp updates (when comments are edited)
-- 2. Real-time notifications (for live updates)
-- 3. Vote count management (automatic like/dislike counts)
-- 4. Vote notifications (for real-time vote updates)
-- 
-- This is the optimal setup for a production comment system.
-- 
-- =====================================================
