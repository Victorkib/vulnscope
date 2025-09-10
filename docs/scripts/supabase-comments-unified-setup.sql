-- =====================================================
-- 🛡️ VulnScope Unified Comment System Setup
-- =====================================================
-- 
-- This script creates a unified comment system schema that matches
-- the current working API implementation exactly
-- 
-- IMPORTANT: This script is SAFE to run - it uses IF NOT EXISTS
-- and won't break existing data
-- 
-- Created: January 2025
-- Project: VulnScope - Comment System Migration
-- =====================================================

-- =====================================================
-- STEP 1: CREATE UNIFIED COMMENT TABLES
-- =====================================================

-- Create vulnerability_comments table (matching current API schema)
CREATE TABLE IF NOT EXISTS vulnerability_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vulnerabilityid TEXT NOT NULL,  -- Matches current API exactly
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_display_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 2000),
  is_public BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES vulnerability_comments(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_votes table (matching current API schema)
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES vulnerability_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- =====================================================
-- STEP 2: CREATE PERFORMANCE INDEXES
-- =====================================================

-- Indexes for vulnerability_comments
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_vulnerabilityid ON vulnerability_comments(vulnerabilityid);
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_user_id ON vulnerability_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_parent_id ON vulnerability_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_created_at ON vulnerability_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_is_public ON vulnerability_comments(is_public);

-- Indexes for comment_votes
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_created_at ON comment_votes(created_at);

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE vulnerability_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE SECURITY POLICIES
-- =====================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view public comments" ON vulnerability_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON vulnerability_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON vulnerability_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON vulnerability_comments;

DROP POLICY IF EXISTS "Users can view all votes" ON comment_votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON comment_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON comment_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON comment_votes;

-- Create new policies for vulnerability_comments
CREATE POLICY "Users can view public comments" ON vulnerability_comments
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own comments" ON vulnerability_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON vulnerability_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON vulnerability_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create new policies for comment_votes
CREATE POLICY "Users can view all votes" ON comment_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON comment_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON comment_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON comment_votes
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: CREATE UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update comment vote counts automatically
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE vulnerability_comments SET likes = likes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE vulnerability_comments SET dislikes = dislikes + 1 WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove old vote
    IF OLD.vote_type = 'like' THEN
      UPDATE vulnerability_comments SET likes = likes - 1 WHERE id = OLD.comment_id;
    ELSE
      UPDATE vulnerability_comments SET dislikes = dislikes - 1 WHERE id = OLD.comment_id;
    END IF;
    -- Add new vote
    IF NEW.vote_type = 'like' THEN
      UPDATE vulnerability_comments SET likes = likes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE vulnerability_comments SET dislikes = dislikes + 1 WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'like' THEN
      UPDATE vulnerability_comments SET likes = likes - 1 WHERE id = OLD.comment_id;
    ELSE
      UPDATE vulnerability_comments SET dislikes = dislikes - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_vulnerability_comments_updated_at ON vulnerability_comments;
DROP TRIGGER IF EXISTS update_comment_vote_counts_trigger ON comment_votes;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_vulnerability_comments_updated_at
  BEFORE UPDATE ON vulnerability_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update vote counts
CREATE TRIGGER update_comment_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_vote_counts();

-- =====================================================
-- STEP 7: ENABLE REAL-TIME
-- =====================================================

-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE vulnerability_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_votes;

-- =====================================================
-- STEP 8: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON vulnerability_comments TO authenticated;
GRANT ALL ON comment_votes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_comment_vote_counts() TO authenticated;

-- =====================================================
-- STEP 9: CREATE HELPER VIEWS
-- =====================================================

-- Create a view for comment statistics
CREATE OR REPLACE VIEW comment_stats AS
SELECT 
  vulnerabilityid,
  COUNT(*) as total_comments,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as top_level_comments,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as replies,
  COUNT(DISTINCT user_id) as unique_commenters,
  MAX(created_at) as last_comment_at
FROM vulnerability_comments
WHERE is_public = true
GROUP BY vulnerabilityid;

-- Grant access to the view
GRANT SELECT ON comment_stats TO authenticated;

-- =====================================================
-- STEP 10: VERIFICATION QUERIES
-- =====================================================

-- Verify table creation
SELECT 
  'Table Creation' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('vulnerability_comments', 'comment_votes') 
    THEN '✅ CREATED' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('vulnerability_comments', 'comment_votes')
ORDER BY table_name;

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
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 
    THEN '✅ SECURE' 
    ELSE '⚠️ NEEDS MORE POLICIES' 
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('vulnerability_comments', 'comment_votes')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- 
-- Your unified comment system is now ready!
-- 
-- Next steps:
-- 1. Run the API migration scripts
-- 2. Test the comment functionality
-- 3. Verify real-time updates work
-- 
-- =====================================================
