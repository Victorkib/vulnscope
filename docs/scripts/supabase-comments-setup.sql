-- Enable Row Level Security
ALTER TABLE IF EXISTS vulnerability_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comment_votes ENABLE ROW LEVEL SECURITY;

-- Create vulnerability_comments table
CREATE TABLE IF NOT EXISTS vulnerability_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vulnerability_id TEXT NOT NULL,
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

-- Create comment_votes table
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES vulnerability_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_vulnerability_id ON vulnerability_comments(vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_user_id ON vulnerability_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_parent_id ON vulnerability_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_vulnerability_comments_created_at ON vulnerability_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);

-- Row Level Security Policies for vulnerability_comments
CREATE POLICY "Users can view public comments" ON vulnerability_comments
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own comments" ON vulnerability_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON vulnerability_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON vulnerability_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Row Level Security Policies for comment_votes
CREATE POLICY "Users can view all votes" ON comment_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON comment_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON comment_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON comment_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_vulnerability_comments_updated_at
  BEFORE UPDATE ON vulnerability_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update comment vote counts
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

-- Trigger to update vote counts
CREATE TRIGGER update_comment_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_vote_counts();

-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE vulnerability_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_votes;

