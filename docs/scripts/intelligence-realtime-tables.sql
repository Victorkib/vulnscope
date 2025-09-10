-- Intelligence Real-time Tables for Supabase
-- This script creates the necessary tables for real-time intelligence updates

-- Enable Row Level Security
ALTER TABLE IF EXISTS intelligence_threat_landscape ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS intelligence_security_posture ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS intelligence_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS intelligence_alerts ENABLE ROW LEVEL SECURITY;

-- 1. Intelligence Threat Landscape Table
CREATE TABLE IF NOT EXISTS intelligence_threat_landscape (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    data JSONB NOT NULL,
    view_type VARCHAR(50) DEFAULT 'global',
    timeframe VARCHAR(10) DEFAULT '30d',
    region VARCHAR(100),
    sector VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Intelligence Security Posture Table
CREATE TABLE IF NOT EXISTS intelligence_security_posture (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    organization_id VARCHAR(255),
    data JSONB NOT NULL,
    risk_score INTEGER NOT NULL,
    vulnerability_exposure INTEGER NOT NULL,
    patch_compliance INTEGER NOT NULL,
    security_maturity INTEGER NOT NULL,
    threat_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Intelligence Stats Table
CREATE TABLE IF NOT EXISTS intelligence_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    data JSONB NOT NULL,
    total_threats INTEGER NOT NULL,
    active_threats INTEGER NOT NULL,
    new_threats INTEGER NOT NULL,
    resolved_threats INTEGER NOT NULL,
    threat_actors INTEGER NOT NULL,
    attack_vectors INTEGER NOT NULL,
    zero_days INTEGER NOT NULL,
    security_posture_score INTEGER NOT NULL,
    compliance_score INTEGER NOT NULL,
    prediction_accuracy INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Intelligence Alerts Table
CREATE TABLE IF NOT EXISTS intelligence_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(100),
    confidence INTEGER,
    affected_systems JSONB,
    recommended_actions JSONB,
    related_intelligence JSONB,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_intelligence_threat_landscape_user_id ON intelligence_threat_landscape(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_threat_landscape_updated_at ON intelligence_threat_landscape(updated_at);

CREATE INDEX IF NOT EXISTS idx_intelligence_security_posture_user_id ON intelligence_security_posture(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_security_posture_updated_at ON intelligence_security_posture(updated_at);

CREATE INDEX IF NOT EXISTS idx_intelligence_stats_user_id ON intelligence_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_stats_updated_at ON intelligence_stats(updated_at);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_user_id ON intelligence_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_created_at ON intelligence_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_severity ON intelligence_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_acknowledged ON intelligence_alerts(acknowledged);

-- Row Level Security Policies

-- Threat Landscape Policies
CREATE POLICY "Users can view their own threat landscape data" ON intelligence_threat_landscape
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threat landscape data" ON intelligence_threat_landscape
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threat landscape data" ON intelligence_threat_landscape
    FOR UPDATE USING (auth.uid() = user_id);

-- Security Posture Policies
CREATE POLICY "Users can view their own security posture data" ON intelligence_security_posture
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security posture data" ON intelligence_security_posture
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security posture data" ON intelligence_security_posture
    FOR UPDATE USING (auth.uid() = user_id);

-- Stats Policies
CREATE POLICY "Users can view their own intelligence stats" ON intelligence_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intelligence stats" ON intelligence_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intelligence stats" ON intelligence_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Alerts Policies
CREATE POLICY "Users can view their own intelligence alerts" ON intelligence_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intelligence alerts" ON intelligence_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intelligence alerts" ON intelligence_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_intelligence_threat_landscape_updated_at 
    BEFORE UPDATE ON intelligence_threat_landscape 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_security_posture_updated_at 
    BEFORE UPDATE ON intelligence_security_posture 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_stats_updated_at 
    BEFORE UPDATE ON intelligence_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_alerts_updated_at 
    BEFORE UPDATE ON intelligence_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_intelligence_data()
RETURNS void AS $$
BEGIN
    -- Delete threat landscape data older than 30 days
    DELETE FROM intelligence_threat_landscape 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete old alerts that are acknowledged and older than 7 days
    DELETE FROM intelligence_alerts 
    WHERE acknowledged = true 
    AND created_at < NOW() - INTERVAL '7 days';
    
    -- Delete expired alerts
    DELETE FROM intelligence_alerts 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old data (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-intelligence-data', '0 2 * * *', 'SELECT cleanup_old_intelligence_data();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON intelligence_threat_landscape TO authenticated;
GRANT ALL ON intelligence_security_posture TO authenticated;
GRANT ALL ON intelligence_stats TO authenticated;
GRANT ALL ON intelligence_alerts TO authenticated;

