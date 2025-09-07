-- =====================================================
-- 🆓 VulnScope Supabase Free Tier Adjustments
-- =====================================================
-- 
-- This script applies additional optimizations for the free tier
-- Run this AFTER the main setup scripts
-- 
-- IMPORTANT: These are optimizations and adjustments for existing setup
-- 
-- Created: January 2025
-- Project: VulnScope - Advanced Vulnerability Intelligence Platform
-- =====================================================

-- =====================================================
-- ADJUSTMENT 1: ADD MONITORING FUNCTIONS
-- =====================================================
-- Add functions to monitor free tier usage

-- Function to check database size
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS TABLE(
  database_size TEXT,
  notifications_size TEXT,
  user_preferences_size TEXT,
  alert_rules_size TEXT,
  teams_size TEXT,
  team_members_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    pg_size_pretty(pg_total_relation_size('notifications')) as notifications_size,
    pg_size_pretty(pg_total_relation_size('user_preferences')) as user_preferences_size,
    pg_size_pretty(pg_total_relation_size('alert_rules')) as alert_rules_size,
    pg_size_pretty(pg_total_relation_size('teams')) as teams_size,
    pg_size_pretty(pg_total_relation_size('team_members')) as team_members_size;
END;
$$ LANGUAGE plpgsql;

-- Function to check active connections
CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM pg_stat_activity 
    WHERE state = 'active' 
    AND datname = current_database()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get notification count by user
CREATE OR REPLACE FUNCTION get_user_notification_stats(user_uuid TEXT)
RETURNS TABLE(
  total_notifications BIGINT,
  unread_notifications BIGINT,
  notifications_by_type JSONB,
  oldest_notification TIMESTAMPTZ,
  newest_notification TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE is_read = FALSE) as unread_notifications,
    jsonb_object_agg(type, type_count) as notifications_by_type,
    MIN(created_at) as oldest_notification,
    MAX(created_at) as newest_notification
  FROM (
    SELECT 
      type,
      COUNT(*) as type_count
    FROM notifications 
    WHERE user_id = user_uuid
    GROUP BY type
  ) type_stats
  CROSS JOIN (
    SELECT COUNT(*) as total_count
    FROM notifications 
    WHERE user_id = user_uuid
  ) total_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADJUSTMENT 2: ENHANCED CLEANUP FUNCTIONS
-- =====================================================
-- More aggressive cleanup for free tier

-- Enhanced cleanup function with more options
CREATE OR REPLACE FUNCTION cleanup_old_data(
  notification_days INTEGER DEFAULT 30,
  archive_old_data BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
  deleted_notifications INTEGER,
  deleted_old_preferences INTEGER,
  deleted_inactive_teams INTEGER
) AS $$
DECLARE
  deleted_notifications_count INTEGER := 0;
  deleted_preferences_count INTEGER := 0;
  deleted_teams_count INTEGER := 0;
BEGIN
  -- Delete old notifications
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '1 day' * notification_days;
  
  GET DIAGNOSTICS deleted_notifications_count = ROW_COUNT;
  
  -- Delete preferences for users who haven't been active (if no auth.users reference)
  -- Note: This is a simplified version - in production you'd check auth.users
  DELETE FROM user_preferences 
  WHERE updated_at < NOW() - INTERVAL '90 days'
  AND user_id NOT IN (
    SELECT user_id FROM notifications 
    WHERE created_at > NOW() - INTERVAL '90 days'
  );
  
  GET DIAGNOSTICS deleted_preferences_count = ROW_COUNT;
  
  -- Delete inactive teams (no activity in 180 days)
  DELETE FROM teams 
  WHERE updated_at < NOW() - INTERVAL '180 days'
  AND id NOT IN (
    SELECT DISTINCT team_id FROM team_members 
    WHERE joined_at > NOW() - INTERVAL '180 days'
  );
  
  GET DIAGNOSTICS deleted_teams_count = ROW_COUNT;
  
  RETURN QUERY SELECT 
    deleted_notifications_count,
    deleted_preferences_count,
    deleted_teams_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old notifications to JSON
CREATE OR REPLACE FUNCTION archive_old_notifications(
  days_old INTEGER DEFAULT 30
)
RETURNS TABLE(
  archived_count INTEGER,
  archived_data JSONB
) AS $$
DECLARE
  archived_count INTEGER := 0;
  archived_data JSONB;
BEGIN
  -- Get old notifications
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'user_id', user_id,
      'type', type,
      'title', title,
      'message', message,
      'data', data,
      'priority', priority,
      'created_at', created_at
    )
  ) INTO archived_data
  FROM notifications 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
  
  -- Count notifications to be archived
  SELECT COUNT(*) INTO archived_count
  FROM notifications 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
  
  -- Delete old notifications
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
  
  RETURN QUERY SELECT archived_count, archived_data;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADJUSTMENT 3: PERFORMANCE OPTIMIZATIONS
-- =====================================================
-- Add composite indexes for common queries

-- Composite index for user notifications with read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_id, is_read, created_at DESC);

-- Composite index for alert rules with active status
CREATE INDEX IF NOT EXISTS idx_alert_rules_user_active_updated 
ON alert_rules(user_id, is_active, updated_at DESC);

-- Composite index for team members with status
CREATE INDEX IF NOT EXISTS idx_team_members_team_status_role 
ON team_members(team_id, status, role);

-- =====================================================
-- ADJUSTMENT 4: BANDWIDTH OPTIMIZATION FUNCTIONS
-- =====================================================
-- Functions to minimize data transfer

-- Function to get minimal notification data
CREATE OR REPLACE FUNCTION get_minimal_notifications(
  user_uuid TEXT,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id TEXT,
  type TEXT,
  title TEXT,
  priority TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.priority,
    n.is_read,
    n.created_at
  FROM notifications n
  WHERE n.user_id = user_uuid
  ORDER BY n.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification count only (for badges)
CREATE OR REPLACE FUNCTION get_notification_badge_count(user_uuid TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM notifications 
    WHERE user_id = user_uuid 
    AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADJUSTMENT 5: CONNECTION MANAGEMENT FUNCTIONS
-- =====================================================
-- Functions to help manage connections

-- Function to check if user has active real-time connections
CREATE OR REPLACE FUNCTION check_user_connection_status(user_uuid TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- This is a simplified check - in production you'd track this in a separate table
  -- For now, we'll return true to allow connections
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get connection usage stats
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE(
  active_connections INTEGER,
  max_connections INTEGER,
  connection_usage_percent NUMERIC
) AS $$
DECLARE
  active_count INTEGER;
  max_connections INTEGER := 60; -- Free tier limit
BEGIN
  SELECT get_active_connections() INTO active_count;
  
  RETURN QUERY SELECT 
    active_count,
    max_connections,
    ROUND((active_count::NUMERIC / max_connections::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADJUSTMENT 6: GRANT PERMISSIONS FOR NEW FUNCTIONS
-- =====================================================

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION get_database_size() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_connections() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notification_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data(INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_old_notifications(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_minimal_notifications(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_badge_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_connection_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_stats() TO authenticated;

-- =====================================================
-- ADJUSTMENT 7: CREATE MONITORING VIEWS
-- =====================================================
-- Views for easy monitoring

-- View for database size monitoring
CREATE OR REPLACE VIEW database_size_monitor AS
SELECT 
  'Database Size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as current_value,
  '500MB' as limit_value,
  CASE 
    WHEN pg_database_size(current_database()) > 400 * 1024 * 1024 THEN 'WARNING'
    WHEN pg_database_size(current_database()) > 450 * 1024 * 1024 THEN 'CRITICAL'
    ELSE 'OK'
  END as status;

-- View for connection monitoring
CREATE OR REPLACE VIEW connection_monitor AS
SELECT 
  'Active Connections' as metric,
  get_active_connections()::TEXT as current_value,
  '60' as limit_value,
  CASE 
    WHEN get_active_connections() > 50 THEN 'WARNING'
    WHEN get_active_connections() > 55 THEN 'CRITICAL'
    ELSE 'OK'
  END as status;

-- View for notification count monitoring
CREATE OR REPLACE VIEW notification_monitor AS
SELECT 
  'Total Notifications' as metric,
  COUNT(*)::TEXT as current_value,
  '10000' as recommended_limit,
  CASE 
    WHEN COUNT(*) > 8000 THEN 'WARNING'
    WHEN COUNT(*) > 9500 THEN 'CRITICAL'
    ELSE 'OK'
  END as status
FROM notifications;

-- =====================================================
-- ADJUSTMENT 8: CREATE CLEANUP SCHEDULE FUNCTION
-- =====================================================
-- Function to run all cleanup tasks

CREATE OR REPLACE FUNCTION run_maintenance_tasks()
RETURNS TABLE(
  task_name TEXT,
  result TEXT,
  details JSONB
) AS $$
DECLARE
  cleanup_result RECORD;
  archive_result RECORD;
  db_size RECORD;
  connection_stats RECORD;
BEGIN
  -- Run cleanup
  SELECT * INTO cleanup_result FROM cleanup_old_data(30, true);
  
  -- Run archiving
  SELECT * INTO archive_result FROM archive_old_notifications(30);
  
  -- Get database size
  SELECT * INTO db_size FROM get_database_size();
  
  -- Get connection stats
  SELECT * INTO connection_stats FROM get_connection_stats();
  
  -- Return results
  RETURN QUERY VALUES 
    ('cleanup', 'SUCCESS', jsonb_build_object(
      'deleted_notifications', cleanup_result.deleted_notifications,
      'deleted_preferences', cleanup_result.deleted_old_preferences,
      'deleted_teams', cleanup_result.deleted_inactive_teams
    )),
    ('archive', 'SUCCESS', jsonb_build_object(
      'archived_count', archive_result.archived_count
    )),
    ('database_size', 'INFO', jsonb_build_object(
      'database_size', db_size.database_size,
      'notifications_size', db_size.notifications_size
    )),
    ('connections', 'INFO', jsonb_build_object(
      'active_connections', connection_stats.active_connections,
      'usage_percent', connection_stats.connection_usage_percent
    ));
END;
$$ LANGUAGE plpgsql;

-- Grant permission on maintenance function
GRANT EXECUTE ON FUNCTION run_maintenance_tasks() TO authenticated;

-- =====================================================
-- ADJUSTMENT 9: CREATE USAGE ALERTS FUNCTION
-- =====================================================
-- Function to check if approaching limits

CREATE OR REPLACE FUNCTION check_usage_alerts()
RETURNS TABLE(
  alert_type TEXT,
  alert_level TEXT,
  message TEXT,
  current_value TEXT,
  limit_value TEXT
) AS $$
DECLARE
  db_size BIGINT;
  active_connections INTEGER;
  notification_count BIGINT;
BEGIN
  -- Check database size
  SELECT pg_database_size(current_database()) INTO db_size;
  
  IF db_size > 450 * 1024 * 1024 THEN -- 450MB
    RETURN QUERY VALUES (
      'database_size',
      'CRITICAL',
      'Database size is approaching the 500MB free tier limit',
      pg_size_pretty(db_size),
      '500MB'
    );
  ELSIF db_size > 400 * 1024 * 1024 THEN -- 400MB
    RETURN QUERY VALUES (
      'database_size',
      'WARNING',
      'Database size is getting large, consider cleanup',
      pg_size_pretty(db_size),
      '500MB'
    );
  END IF;
  
  -- Check connections
  SELECT get_active_connections() INTO active_connections;
  
  IF active_connections > 55 THEN
    RETURN QUERY VALUES (
      'connections',
      'CRITICAL',
      'Active connections approaching limit',
      active_connections::TEXT,
      '60'
    );
  ELSIF active_connections > 50 THEN
    RETURN QUERY VALUES (
      'connections',
      'WARNING',
      'High number of active connections',
      active_connections::TEXT,
      '60'
    );
  END IF;
  
  -- Check notification count
  SELECT COUNT(*) INTO notification_count FROM notifications;
  
  IF notification_count > 9500 THEN
    RETURN QUERY VALUES (
      'notifications',
      'CRITICAL',
      'Too many notifications, consider cleanup',
      notification_count::TEXT,
      '10000'
    );
  ELSIF notification_count > 8000 THEN
    RETURN QUERY VALUES (
      'notifications',
      'WARNING',
      'High notification count, consider cleanup',
      notification_count::TEXT,
      '10000'
    );
  END IF;
  
  -- If no alerts, return success
  IF NOT FOUND THEN
    RETURN QUERY VALUES (
      'all_systems',
      'OK',
      'All systems operating within limits',
      'N/A',
      'N/A'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permission on alerts function
GRANT EXECUTE ON FUNCTION check_usage_alerts() TO authenticated;

-- =====================================================
-- FREE TIER ADJUSTMENTS COMPLETE
-- =====================================================
-- 
-- Your Supabase setup is now optimized for the free tier!
-- 
-- New features added:
-- ✅ Database size monitoring
-- ✅ Connection monitoring  
-- ✅ Enhanced cleanup functions
-- ✅ Bandwidth optimization
-- ✅ Performance improvements
-- ✅ Usage alerts
-- ✅ Maintenance tasks
-- 
-- Next steps:
-- 1. Update your application code with the optimizations
-- 2. Set up regular maintenance tasks
-- 3. Monitor usage with the new functions
-- 
-- =====================================================
