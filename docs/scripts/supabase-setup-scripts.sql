-- =====================================================
-- 🛡️ VulnScope Supabase Setup Scripts (Free Tier)
-- =====================================================
-- 
-- This file contains all SQL scripts needed to set up
-- Supabase for the VulnScope project on the FREE TIER
-- 
-- IMPORTANT: Run these scripts in order in the Supabase SQL Editor
-- 
-- Created: January 2025
-- Project: VulnScope - Advanced Vulnerability Intelligence Platform
-- =====================================================

-- =====================================================
-- SCRIPT 1: CORE NOTIFICATIONS TABLE
-- =====================================================
-- This creates the main notifications table for real-time alerts

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'vulnerability_alert', 
    'comment_reply', 
    'bookmark_update', 
    'system_alert', 
    'achievement_unlocked',
    'team_invitation',
    'discussion_update',
    'alert_triggered'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create indexes for performance (Free tier allows basic indexing)
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- SCRIPT 2: USER PREFERENCES TABLE
-- =====================================================
-- This stores user notification preferences and settings

-- Drop table if exists
DROP TABLE IF EXISTS user_preferences CASCADE;

-- Create user preferences table
CREATE TABLE user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  vulnerability_alerts BOOLEAN DEFAULT TRUE,
  comment_replies BOOLEAN DEFAULT TRUE,
  bookmark_updates BOOLEAN DEFAULT FALSE,
  system_alerts BOOLEAN DEFAULT TRUE,
  achievement_notifications BOOLEAN DEFAULT TRUE,
  team_notifications BOOLEAN DEFAULT TRUE,
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'UTC',
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================================
-- SCRIPT 3: ALERT RULES TABLE
-- =====================================================
-- This stores user-defined alert rules for vulnerability monitoring

-- Drop table if exists
DROP TABLE IF EXISTS alert_rules CASCADE;

-- Create alert rules table
CREATE TABLE alert_rules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  cooldown_minutes INTEGER DEFAULT 60,
  last_triggered TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX idx_alert_rules_is_active ON alert_rules(is_active);
CREATE INDEX idx_alert_rules_last_triggered ON alert_rules(last_triggered);

-- =====================================================
-- SCRIPT 4: TEAM COLLABORATION TABLES
-- =====================================================
-- These tables support team features and collaboration

-- Drop tables if exist
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Create teams table
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team members table
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'suspended')) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by TEXT,
  invited_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);

-- =====================================================
-- SCRIPT 5: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS and create security policies for all tables

-- Enable RLS on all tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own notifications
CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid()::text = user_id);

-- =====================================================
-- USER PREFERENCES TABLE POLICIES
-- =====================================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid()::text = user_id);

-- =====================================================
-- ALERT RULES TABLE POLICIES
-- =====================================================

-- Users can view their own alert rules
CREATE POLICY "Users can view own alert rules" ON alert_rules
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own alert rules
CREATE POLICY "Users can insert own alert rules" ON alert_rules
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own alert rules
CREATE POLICY "Users can update own alert rules" ON alert_rules
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own alert rules
CREATE POLICY "Users can delete own alert rules" ON alert_rules
  FOR DELETE USING (auth.uid()::text = user_id);

-- =====================================================
-- TEAMS TABLE POLICIES
-- =====================================================

-- Users can view teams they own or are members of
CREATE POLICY "Users can view accessible teams" ON teams
  FOR SELECT USING (
    auth.uid()::text = owner_id OR 
    auth.uid()::text IN (
      SELECT user_id FROM team_members 
      WHERE team_id = teams.id AND status = 'active'
    )
  );

-- Users can insert teams (become owner)
CREATE POLICY "Users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

-- Users can update teams they own
CREATE POLICY "Users can update owned teams" ON teams
  FOR UPDATE USING (auth.uid()::text = owner_id);

-- Users can delete teams they own
CREATE POLICY "Users can delete owned teams" ON teams
  FOR DELETE USING (auth.uid()::text = owner_id);

-- =====================================================
-- TEAM MEMBERS TABLE POLICIES
-- =====================================================

-- Users can view team members of teams they have access to
CREATE POLICY "Users can view accessible team members" ON team_members
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    auth.uid()::text IN (
      SELECT owner_id FROM teams WHERE id = team_members.team_id
    ) OR
    auth.uid()::text IN (
      SELECT user_id FROM team_members tm2 
      WHERE tm2.team_id = team_members.team_id 
      AND tm2.role IN ('owner', 'admin') 
      AND tm2.status = 'active'
    )
  );

-- Team owners and admins can insert team members
CREATE POLICY "Team owners and admins can add members" ON team_members
  FOR INSERT WITH CHECK (
    auth.uid()::text IN (
      SELECT owner_id FROM teams WHERE id = team_members.team_id
    ) OR
    auth.uid()::text IN (
      SELECT user_id FROM team_members tm2 
      WHERE tm2.team_id = team_members.team_id 
      AND tm2.role IN ('owner', 'admin') 
      AND tm2.status = 'active'
    )
  );

-- Team owners and admins can update team members
CREATE POLICY "Team owners and admins can update members" ON team_members
  FOR UPDATE USING (
    auth.uid()::text IN (
      SELECT owner_id FROM teams WHERE id = team_members.team_id
    ) OR
    auth.uid()::text IN (
      SELECT user_id FROM team_members tm2 
      WHERE tm2.team_id = team_members.team_id 
      AND tm2.role IN ('owner', 'admin') 
      AND tm2.status = 'active'
    )
  );

-- Team owners and admins can delete team members
CREATE POLICY "Team owners and admins can remove members" ON team_members
  FOR DELETE USING (
    auth.uid()::text IN (
      SELECT owner_id FROM teams WHERE id = team_members.team_id
    ) OR
    auth.uid()::text IN (
      SELECT user_id FROM team_members tm2 
      WHERE tm2.team_id = team_members.team_id 
      AND tm2.role IN ('owner', 'admin') 
      AND tm2.status = 'active'
    )
  );

-- =====================================================
-- SCRIPT 6: UTILITY FUNCTIONS
-- =====================================================
-- Helper functions for common operations

-- Function to clean up old notifications (Free tier compatible)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete notifications older than 30 days
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user notification count
CREATE OR REPLACE FUNCTION get_user_notification_count(user_uuid TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM notifications 
    WHERE user_id = user_uuid AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(user_uuid TEXT, notification_ids TEXT[])
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = user_uuid 
  AND id = ANY(notification_ids)
  AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCRIPT 7: GRANT PERMISSIONS
-- =====================================================
-- Grant necessary permissions to authenticated users

-- Grant permissions on notifications table
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- Grant permissions on user_preferences table
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON user_preferences TO service_role;

-- Grant permissions on alert_rules table
GRANT ALL ON alert_rules TO authenticated;
GRANT ALL ON alert_rules TO service_role;

-- Grant permissions on teams table
GRANT ALL ON teams TO authenticated;
GRANT ALL ON teams TO service_role;

-- Grant permissions on team_members table
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON team_members TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notification_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read(TEXT, TEXT[]) TO authenticated;

-- =====================================================
-- SCRIPT 8: SAMPLE DATA (OPTIONAL)
-- =====================================================
-- Insert sample data for testing (remove in production)

-- Sample user preferences (replace with actual user ID)
-- INSERT INTO user_preferences (
--   id, user_id, email_notifications, push_notifications, 
--   vulnerability_alerts, comment_replies, system_alerts
-- ) VALUES (
--   'pref_sample_1', 'sample-user-id', true, false, true, true, true
-- );

-- Sample alert rule (replace with actual user ID)
-- INSERT INTO alert_rules (
--   id, user_id, name, description, conditions, actions, is_active
-- ) VALUES (
--   'rule_sample_1', 'sample-user-id', 'Critical Vulnerabilities', 
--   'Alert for all critical vulnerabilities', 
--   '{"severity": ["CRITICAL"]}', 
--   '{"email": true, "push": true}', 
--   true
-- );

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- 
-- Your Supabase database is now ready for VulnScope!
-- 
-- Next steps:
-- 1. Run the verification script to test everything
-- 2. Update your environment variables
-- 3. Test the application
-- 
-- =====================================================
