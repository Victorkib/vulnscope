-- Supabase Real-time Comment System Setup
-- This script sets up the necessary tables and RLS policies for real-time comments

-- Enable real-time for vulnerability_comments table
CREATE TABLE IF NOT EXISTS vulnerability_comments (
  _id TEXT PRIMARY KEY,
  vulnerabilityId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userEmail TEXT NOT NULL,
  userDisplayName TEXT NOT NULL,
  content TEXT NOT NULL,
  isPublic BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  parentId TEXT,
  isEdited BOOLEAN DEFAULT false
);

-- Enable real-time for comment_votes table
CREATE TABLE IF NOT EXISTS comment_votes (
  id TEXT PRIMARY KEY,
  commentId TEXT NOT NULL,
  userId TEXT NOT NULL,
  voteType TEXT NOT NULL CHECK (voteType IN ('like', 'dislike')),
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_vulnerability_id ON vulnerability_comments(vulnerabilityId);
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_user_id ON vulnerability_comments(userId);
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_parent_id ON vulnerability_comments(parentId);
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_created_at ON vulnerability_comments(createdAt);

CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(commentId);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(userId);
CREATE INDEX IF NOT EXISTS idx_comment_votes_created_at ON comment_votes(createdAt);

-- Enable Row Level Security (RLS)
ALTER TABLE vulnerability_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vulnerability_comments
-- Allow authenticated users to read all public comments
CREATE POLICY "Allow authenticated users to read comments" ON vulnerability_comments
  FOR SELECT USING (auth.role() = 'authenticated' AND isPublic = true);

-- Allow users to insert their own comments
CREATE POLICY "Allow users to insert their own comments" ON vulnerability_comments
  FOR INSERT WITH CHECK (auth.uid()::text = userId);

-- Allow users to update their own comments
CREATE POLICY "Allow users to update their own comments" ON vulnerability_comments
  FOR UPDATE USING (auth.uid()::text = userId);

-- Allow users to delete their own comments
CREATE POLICY "Allow users to delete their own comments" ON vulnerability_comments
  FOR DELETE USING (auth.uid()::text = userId);

-- RLS Policies for comment_votes
-- Allow authenticated users to read all votes
CREATE POLICY "Allow authenticated users to read votes" ON comment_votes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own votes
CREATE POLICY "Allow users to insert their own votes" ON comment_votes
  FOR INSERT WITH CHECK (auth.uid()::text = userId);

-- Allow users to update their own votes
CREATE POLICY "Allow users to update their own votes" ON comment_votes
  FOR UPDATE USING (auth.uid()::text = userId);

-- Allow users to delete their own votes
CREATE POLICY "Allow users to delete their own votes" ON comment_votes
  FOR DELETE USING (auth.uid()::text = userId);

-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE vulnerability_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_votes;

-- Create a function to handle comment notifications
CREATE OR REPLACE FUNCTION notify_comment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about comment changes
  PERFORM pg_notify(
    'comment_changes',
    json_build_object(
      'eventType', TG_OP,
      'vulnerabilityId', COALESCE(NEW.vulnerabilityId, OLD.vulnerabilityId),
      'commentId', COALESCE(NEW._id, OLD._id),
      'userId', COALESCE(NEW.userId, OLD.userId)
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for comment notifications
CREATE TRIGGER comment_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON vulnerability_comments
  FOR EACH ROW EXECUTE FUNCTION notify_comment_changes();

-- Create a function to handle vote notifications
CREATE OR REPLACE FUNCTION notify_vote_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about vote changes
  PERFORM pg_notify(
    'vote_changes',
    json_build_object(
      'eventType', TG_OP,
      'commentId', COALESCE(NEW.commentId, OLD.commentId),
      'userId', COALESCE(NEW.userId, OLD.userId),
      'voteType', COALESCE(NEW.voteType, OLD.voteType)
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for vote notifications
CREATE TRIGGER vote_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON comment_votes
  FOR EACH ROW EXECUTE FUNCTION notify_vote_changes();

-- Grant necessary permissions
GRANT ALL ON vulnerability_comments TO authenticated;
GRANT ALL ON comment_votes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create a view for comment statistics
CREATE OR REPLACE VIEW comment_stats AS
SELECT 
  vulnerabilityId,
  COUNT(*) as total_comments,
  COUNT(CASE WHEN parentId IS NULL THEN 1 END) as top_level_comments,
  COUNT(CASE WHEN parentId IS NOT NULL THEN 1 END) as replies,
  COUNT(DISTINCT userId) as unique_commenters,
  MAX(createdAt) as last_comment_at
FROM vulnerability_comments
WHERE isPublic = true
GROUP BY vulnerabilityId;

-- Grant access to the view
GRANT SELECT ON comment_stats TO authenticated;

-- Add comment_reply notification type to notifications table if it doesn't exist
-- This is handled by the existing notification system, but we ensure the type is supported
DO $$
BEGIN
  -- Check if comment_reply type exists in notifications table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'type' 
    AND table_schema = 'public'
  ) THEN
    -- Create notifications table if it doesn't exist
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data JSONB,
      priority TEXT DEFAULT 'medium',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS for notifications
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    
    -- RLS policies for notifications
    CREATE POLICY "Users can read their own notifications" ON notifications
      FOR SELECT USING (auth.uid()::text = user_id);
    
    CREATE POLICY "Users can update their own notifications" ON notifications
      FOR UPDATE USING (auth.uid()::text = user_id);
    
    -- Enable real-time for notifications
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
