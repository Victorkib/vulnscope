-- =====================================================
-- 🔧 Fix Comment System Triggers
-- =====================================================
-- 
-- This script cleans up duplicate triggers and ensures
-- we have exactly the right triggers for the comment system.
-- 
-- SAFETY: This script only removes duplicate triggers
-- and creates the correct ones.
-- 
-- =====================================================

-- =====================================================
-- STEP 1: ANALYZE CURRENT TRIGGERS
-- =====================================================

-- Show all current triggers on comment tables
SELECT 
  'Current Triggers Analysis' as check_type,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('vulnerability_comments', 'comment_votes')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- STEP 2: CLEAN UP DUPLICATE TRIGGERS
-- =====================================================

-- Drop all existing triggers on vulnerability_comments
DROP TRIGGER IF EXISTS update_vulnerability_comments_updated_at ON vulnerability_comments;
DROP TRIGGER IF EXISTS update_updated_at_column ON vulnerability_comments;
DROP TRIGGER IF EXISTS vulnerability_comments_updated_at ON vulnerability_comments;
DROP TRIGGER IF EXISTS comment_changes_trigger ON vulnerability_comments;

-- Drop all existing triggers on comment_votes
DROP TRIGGER IF EXISTS update_comment_vote_counts_trigger ON comment_votes;
DROP TRIGGER IF EXISTS update_comment_vote_counts ON comment_votes;
DROP TRIGGER IF EXISTS comment_votes_trigger ON comment_votes;
DROP TRIGGER IF EXISTS vote_changes_trigger ON comment_votes;

-- =====================================================
-- STEP 3: CREATE CORRECT TRIGGERS
-- =====================================================

-- Create the correct trigger for updated_at on vulnerability_comments
CREATE TRIGGER update_vulnerability_comments_updated_at
  BEFORE UPDATE ON vulnerability_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create the correct trigger for vote counts on comment_votes
CREATE TRIGGER update_comment_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_vote_counts();

-- =====================================================
-- STEP 4: VERIFY TRIGGER SETUP
-- =====================================================

-- Verify we have exactly 2 triggers
SELECT 
  'Trigger Verification' as check_type,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  CASE 
    WHEN trigger_name IN (
      'update_vulnerability_comments_updated_at',
      'update_comment_vote_counts_trigger'
    ) 
    THEN '✅ CORRECT' 
    ELSE '❌ UNEXPECTED' 
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('vulnerability_comments', 'comment_votes')
ORDER BY event_object_table, trigger_name;

-- Count triggers to ensure we have exactly 4 (2 per table)
SELECT 
  'Trigger Count' as check_type,
  COUNT(*) as total_triggers,
  CASE 
    WHEN COUNT(*) = 4 
    THEN '✅ PERFECT' 
    WHEN COUNT(*) >= 2 
    THEN '⚠️ PARTIAL - Some triggers missing'
    ELSE '❌ CRITICAL - No triggers found' 
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('vulnerability_comments', 'comment_votes');

-- =====================================================
-- STEP 5: TEST TRIGGER FUNCTIONALITY
-- =====================================================

-- Test the updated_at trigger
DO $$
DECLARE
  test_comment_id UUID;
  test_user_id UUID;
  original_updated_at TIMESTAMPTZ;
  new_updated_at TIMESTAMPTZ;
BEGIN
  -- Get a test user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Insert a test comment
    INSERT INTO vulnerability_comments (
      vulnerabilityid, user_id, user_email, user_display_name, 
      content, is_public
    ) VALUES (
      'TEST-CVE-2025-0002', test_user_id, 'test@example.com', 'Test User',
      'Test comment for trigger verification', true
    ) RETURNING id, updated_at INTO test_comment_id, original_updated_at;
    
    -- Wait a moment to ensure timestamp difference
    PERFORM pg_sleep(1);
    
    -- Update the comment to trigger updated_at
    UPDATE vulnerability_comments 
    SET content = 'Updated test comment'
    WHERE id = test_comment_id
    RETURNING updated_at INTO new_updated_at;
    
    -- Verify the trigger worked
    IF new_updated_at > original_updated_at THEN
      RAISE NOTICE '✅ Updated_at trigger working correctly';
    ELSE
      RAISE NOTICE '❌ Updated_at trigger not working';
    END IF;
    
    -- Clean up
    DELETE FROM vulnerability_comments WHERE id = test_comment_id;
    RAISE NOTICE '✅ Test comment cleaned up';
  ELSE
    RAISE NOTICE '⚠️ No users found for testing';
  END IF;
END $$;

-- Test the vote count trigger
DO $$
DECLARE
  test_comment_id UUID;
  test_user_id UUID;
  original_likes INTEGER;
  new_likes INTEGER;
BEGIN
  -- Get a test user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Insert a test comment
    INSERT INTO vulnerability_comments (
      vulnerabilityid, user_id, user_email, user_display_name, 
      content, is_public, likes
    ) VALUES (
      'TEST-CVE-2025-0003', test_user_id, 'test@example.com', 'Test User',
      'Test comment for vote trigger', true, 0
    ) RETURNING id, likes INTO test_comment_id, original_likes;
    
    -- Insert a vote to trigger vote count update
    INSERT INTO comment_votes (comment_id, user_id, vote_type)
    VALUES (test_comment_id, test_user_id, 'like');
    
    -- Check if likes count was updated
    SELECT likes INTO new_likes FROM vulnerability_comments WHERE id = test_comment_id;
    
    -- Verify the trigger worked
    IF new_likes = original_likes + 1 THEN
      RAISE NOTICE '✅ Vote count trigger working correctly';
    ELSE
      RAISE NOTICE '❌ Vote count trigger not working';
    END IF;
    
    -- Clean up
    DELETE FROM comment_votes WHERE comment_id = test_comment_id;
    DELETE FROM vulnerability_comments WHERE id = test_comment_id;
    RAISE NOTICE '✅ Test data cleaned up';
  ELSE
    RAISE NOTICE '⚠️ No users found for testing';
  END IF;
END $$;

-- =====================================================
-- STEP 6: FINAL VERIFICATION
-- =====================================================

-- Final trigger count check
SELECT 
  'Final Trigger Count' as check_type,
  COUNT(*) as total_triggers,
  CASE 
    WHEN COUNT(*) = 4 
    THEN '🎉 PERFECT - MIGRATION COMPLETE' 
    WHEN COUNT(*) >= 2 
    THEN '⚠️ PARTIAL - Some triggers missing'
    ELSE '❌ CRITICAL - No triggers found' 
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('vulnerability_comments', 'comment_votes');

-- =====================================================
-- TRIGGER FIX COMPLETE
-- =====================================================
-- 
-- After running this script, you should see:
-- - Exactly 4 triggers (2 per table)
-- - All triggers working correctly
-- - Migration status: 🎉 PERFECT
-- 
-- =====================================================
