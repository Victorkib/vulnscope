-- =====================================================
-- 🔍 Comprehensive Trigger Analysis Script
-- =====================================================
-- 
-- This script analyzes all triggers on the comment system tables
-- and explains their purpose and functionality.
-- 
-- IMPORTANT: This script is READ-ONLY and safe to run
-- 
-- =====================================================

-- =====================================================
-- STEP 1: DETAILED TRIGGER ANALYSIS
-- =====================================================

-- Show all triggers with detailed information
SELECT 
  'Trigger Analysis' as analysis_type,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event_type,
  action_statement,
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
  END as purpose,
  CASE 
    WHEN trigger_name IN (
      'update_vulnerability_comments_updated_at',
      'comment_changes_trigger',
      'update_comment_vote_counts_trigger',
      'vote_changes_trigger'
    ) 
    THEN '✅ REQUIRED' 
    ELSE '⚠️ UNEXPECTED' 
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('vulnerability_comments', 'comment_votes')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- STEP 2: TRIGGER COUNT BY TABLE
-- =====================================================

-- Count triggers per table
SELECT 
  'Trigger Count by Table' as analysis_type,
  event_object_table as table_name,
  COUNT(*) as trigger_count,
  CASE 
    WHEN event_object_table = 'vulnerability_comments' AND COUNT(*) = 2 
    THEN '✅ PERFECT - Has timestamp + notification triggers'
    WHEN event_object_table = 'comment_votes' AND COUNT(*) = 2 
    THEN '✅ PERFECT - Has vote count + notification triggers'
    WHEN COUNT(*) > 2 
    THEN '⚠️ TOO MANY - May have duplicates'
    WHEN COUNT(*) < 2 
    THEN '❌ INCOMPLETE - Missing required triggers'
    ELSE '❓ UNEXPECTED COUNT'
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('vulnerability_comments', 'comment_votes')
GROUP BY event_object_table
ORDER BY event_object_table;

-- =====================================================
-- STEP 3: TOTAL TRIGGER COUNT
-- =====================================================

-- Overall trigger count
SELECT 
  'Total Trigger Count' as analysis_type,
  COUNT(*) as total_triggers,
  CASE 
    WHEN COUNT(*) = 4 
    THEN '🎉 PERFECT - All required triggers present'
    WHEN COUNT(*) > 4 
    THEN '⚠️ TOO MANY - May have duplicate triggers'
    WHEN COUNT(*) < 4 
    THEN '❌ INCOMPLETE - Missing required triggers'
    ELSE '❓ UNEXPECTED COUNT'
  END as status,
  CASE 
    WHEN COUNT(*) = 4 
    THEN 'Your comment system has all required triggers for full functionality'
    WHEN COUNT(*) > 4 
    THEN 'You may have duplicate triggers that should be cleaned up'
    WHEN COUNT(*) < 4 
    THEN 'You are missing some required triggers for full functionality'
    ELSE 'Unexpected trigger count - please investigate'
  END as recommendation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('vulnerability_comments', 'comment_votes');

-- =====================================================
-- STEP 4: TRIGGER FUNCTIONALITY BREAKDOWN
-- =====================================================

-- Break down what each trigger does
WITH trigger_breakdown AS (
  SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    CASE 
      WHEN trigger_name = 'update_vulnerability_comments_updated_at' 
      THEN 'Updates the updated_at timestamp whenever a comment is modified'
      WHEN trigger_name = 'comment_changes_trigger' 
      THEN 'Sends real-time notifications to connected clients when comments change'
      WHEN trigger_name = 'update_comment_vote_counts_trigger' 
      THEN 'Automatically updates like/dislike counts when votes are added/changed/removed'
      WHEN trigger_name = 'vote_changes_trigger' 
      THEN 'Sends real-time notifications to connected clients when votes change'
      ELSE 'Unknown functionality'
    END as functionality,
    CASE 
      WHEN trigger_name IN ('update_vulnerability_comments_updated_at', 'update_comment_vote_counts_trigger')
      THEN 'Data Integrity'
      WHEN trigger_name IN ('comment_changes_trigger', 'vote_changes_trigger')
      THEN 'Real-time Communication'
      ELSE 'Unknown'
    END as category
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public' 
  AND event_object_table IN ('vulnerability_comments', 'comment_votes')
)
SELECT 
  'Trigger Functionality' as analysis_type,
  trigger_name,
  event_object_table as table_name,
  category,
  functionality,
  action_timing,
  event_manipulation as event_type
FROM trigger_breakdown
ORDER BY event_object_table, category, trigger_name;

-- =====================================================
-- STEP 5: MIGRATION STATUS ASSESSMENT
-- =====================================================

-- Assess migration status based on triggers
SELECT 
  'Migration Status' as analysis_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) = 4
    THEN '🎉 MIGRATION COMPLETE'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) > 4
    THEN '⚠️ MIGRATION NEEDS CLEANUP'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) < 4
    THEN '❌ MIGRATION INCOMPLETE'
    ELSE '❓ MIGRATION STATUS UNKNOWN'
  END as status,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) = 4
    THEN 'All required triggers are present. Your comment system is fully functional.'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) > 4
    THEN 'You have more triggers than expected. This may indicate duplicate triggers that should be cleaned up.'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) < 4
    THEN 'You are missing some required triggers. Run the migration scripts to complete the setup.'
    ELSE 'Unable to determine migration status. Please check your trigger setup manually.'
  END as recommendation;

-- =====================================================
-- STEP 6: NEXT STEPS RECOMMENDATION
-- =====================================================

-- Provide next steps based on current state
SELECT 
  'Next Steps' as analysis_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) = 4
    THEN '✅ PROCEED TO API TESTING'
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
    THEN 'Your triggers are perfect! You can now test the API endpoints and enable Supabase in your environment variables.'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) > 4
    THEN 'You have duplicate triggers. Run the fix-triggers.sql script to clean them up.'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers 
          WHERE trigger_schema = 'public' 
          AND event_object_table IN ('vulnerability_comments', 'comment_votes')) < 4
    THEN 'You are missing required triggers. Run the supabase-comments-unified-setup.sql script to complete the setup.'
    ELSE 'Please investigate your current trigger setup and determine what needs to be done.'
  END as instructions;

-- =====================================================
-- TRIGGER ANALYSIS COMPLETE
-- =====================================================
-- 
-- This analysis shows you exactly what triggers you have
-- and whether your comment system is ready for production.
-- 
-- Expected Result: 4 triggers total
-- - 2 on vulnerability_comments (timestamp + notifications)
-- - 2 on comment_votes (vote counts + notifications)
-- 
-- =====================================================
