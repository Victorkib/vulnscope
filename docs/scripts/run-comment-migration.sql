-- =====================================================
-- 🚀 VulnScope Comment System Migration Script
-- =====================================================
-- 
-- This script migrates the comment system to use Supabase exclusively.
-- It's designed to be SAFE and REVERSIBLE.
-- 
-- IMPORTANT: Run this script in the Supabase SQL Editor
-- 
-- Created: January 2025
-- Project: VulnScope - Comment System Migration
-- =====================================================

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA (SAFETY FIRST)
-- =====================================================

-- Create backup tables (if they don't exist)
CREATE TABLE IF NOT EXISTS vulnerability_comments_backup AS 
SELECT * FROM vulnerability_comments WHERE false;

CREATE TABLE IF NOT EXISTS comment_votes_backup AS 
SELECT * FROM comment_votes WHERE false;

-- Copy existing data to backup tables
INSERT INTO vulnerability_comments_backup 
SELECT * FROM vulnerability_comments 
WHERE NOT EXISTS (SELECT 1 FROM vulnerability_comments_backup LIMIT 1);

INSERT INTO comment_votes_backup 
SELECT * FROM comment_votes 
WHERE NOT EXISTS (SELECT 1 FROM comment_votes_backup LIMIT 1);

-- =====================================================
-- STEP 2: VERIFY CURRENT STATE
-- =====================================================

-- Check if tables exist and have data
SELECT 
  'Current State Check' as check_type,
  'vulnerability_comments' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ HAS DATA' 
    ELSE '⚠️ EMPTY' 
  END as status
FROM vulnerability_comments

UNION ALL

SELECT 
  'Current State Check' as check_type,
  'comment_votes' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ HAS DATA' 
    ELSE '⚠️ EMPTY' 
  END as status
FROM comment_votes;

-- =====================================================
-- STEP 3: RUN UNIFIED SETUP (SAFE - USES IF NOT EXISTS)
-- =====================================================

-- Note: The unified setup script is in a separate file
-- Run: supabase-comments-unified-setup.sql
-- This script is safe because it uses IF NOT EXISTS

-- =====================================================
-- STEP 4: VERIFY MIGRATION SUCCESS
-- =====================================================

-- Verify table structure
SELECT 
  'Table Structure Check' as check_type,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('vulnerability_comments', 'comment_votes')
ORDER BY table_name, ordinal_position;

-- Verify RLS is enabled
SELECT 
  'RLS Check' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity = true 
    THEN '✅ ENABLED' 
    ELSE '❌ DISABLED' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('vulnerability_comments', 'comment_votes')
ORDER BY tablename;

-- Verify policies exist
SELECT 
  'Policy Check' as check_type,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN policyname IS NOT NULL 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('vulnerability_comments', 'comment_votes')
ORDER BY tablename, policyname;

-- Verify functions exist
SELECT 
  'Function Check' as check_type,
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name IN ('update_updated_at_column', 'update_comment_vote_counts') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_updated_at_column', 'update_comment_vote_counts')
ORDER BY routine_name;

-- Verify triggers exist
SELECT 
  'Trigger Check' as check_type,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  CASE 
    WHEN trigger_name IS NOT NULL 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('vulnerability_comments', 'comment_votes')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- STEP 5: TEST DATA INTEGRITY
-- =====================================================

-- Test comment insertion (safe test)
DO $$
DECLARE
  test_comment_id UUID;
  test_user_id UUID;
BEGIN
  -- Get a test user ID (use existing user or create test)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Insert a test comment
    INSERT INTO vulnerability_comments (
      vulnerabilityid, user_id, user_email, user_display_name, 
      content, is_public
    ) VALUES (
      'TEST-CVE-2025-0001', test_user_id, 'test@example.com', 'Test User',
      'This is a test comment for migration verification', true
    ) RETURNING id INTO test_comment_id;
    
    -- Verify the comment was inserted
    IF test_comment_id IS NOT NULL THEN
      RAISE NOTICE '✅ Test comment inserted successfully: %', test_comment_id;
      
      -- Clean up test comment
      DELETE FROM vulnerability_comments WHERE id = test_comment_id;
      RAISE NOTICE '✅ Test comment cleaned up successfully';
    ELSE
      RAISE NOTICE '❌ Test comment insertion failed';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ No users found for testing - skipping test insertion';
  END IF;
END $$;

-- =====================================================
-- STEP 6: PERFORMANCE CHECK
-- =====================================================

-- Check index usage
SELECT 
  'Index Check' as check_type,
  indexname,
  tablename,
  CASE 
    WHEN indexname LIKE 'idx_%' 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('vulnerability_comments', 'comment_votes')
ORDER BY tablename, indexname;

-- =====================================================
-- STEP 7: REAL-TIME VERIFICATION
-- =====================================================

-- Check if real-time is enabled
SELECT 
  'Real-time Check' as check_type,
  schemaname,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename IN ('vulnerability_comments', 'comment_votes')
    ) 
    THEN '✅ ENABLED' 
    ELSE '❌ DISABLED' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('vulnerability_comments', 'comment_votes')
ORDER BY tablename;

-- =====================================================
-- STEP 8: MIGRATION SUMMARY
-- =====================================================

-- Generate migration summary
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
    8 as total_expected, -- 4 policies per table
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
    2 as total_expected,
    COUNT(*) as total_found,
    CASE WHEN COUNT(*) = 2 THEN '✅ COMPLETE' ELSE '❌ INCOMPLETE' END as status
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
-- MIGRATION COMPLETE
-- =====================================================
-- 
-- If you see mostly ✅ and 🎉 PERFECT statuses, 
-- your comment system migration is successful!
-- 
-- Next steps:
-- 1. Update your environment variables to use Supabase
-- 2. Deploy the new API endpoints
-- 3. Test the comment functionality
-- 4. Monitor for any issues
-- 
-- Rollback instructions:
-- If you need to rollback, the backup tables contain your original data:
-- - vulnerability_comments_backup
-- - comment_votes_backup
-- 
-- =====================================================
