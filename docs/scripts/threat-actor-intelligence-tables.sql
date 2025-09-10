-- Threat Actor Intelligence Tables for Supabase
-- This script creates the necessary tables for advanced threat actor intelligence

-- Enable Row Level Security
ALTER TABLE IF EXISTS threat_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS apt_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS threat_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS threat_actor_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS threat_actor_indicators ENABLE ROW LEVEL SECURITY;

-- 1. Threat Actors Table
CREATE TABLE IF NOT EXISTS threat_actors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    aliases JSONB DEFAULT '[]',
    type VARCHAR(50) NOT NULL,
    country VARCHAR(100),
    region VARCHAR(100),
    description TEXT,
    motivation JSONB DEFAULT '[]',
    capabilities JSONB NOT NULL,
    tactics JSONB DEFAULT '[]',
    techniques JSONB DEFAULT '[]',
    tools JSONB DEFAULT '[]',
    infrastructure JSONB NOT NULL,
    targets JSONB NOT NULL,
    timeline JSONB NOT NULL,
    attribution JSONB NOT NULL,
    threat_level VARCHAR(20) NOT NULL,
    confidence INTEGER NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. APT Campaigns Table
CREATE TABLE IF NOT EXISTS apt_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    aliases JSONB DEFAULT '[]',
    threat_actors JSONB DEFAULT '[]',
    description TEXT,
    objectives JSONB DEFAULT '[]',
    targets JSONB NOT NULL,
    timeline JSONB NOT NULL,
    techniques JSONB NOT NULL,
    infrastructure JSONB NOT NULL,
    indicators JSONB NOT NULL,
    attribution JSONB NOT NULL,
    impact JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    threat_level VARCHAR(20) NOT NULL,
    confidence INTEGER NOT NULL,
    first_seen TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Threat Attributions Table
CREATE TABLE IF NOT EXISTS threat_attributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    incident_id VARCHAR(255) NOT NULL,
    threat_actor_id UUID REFERENCES threat_actors(id),
    campaign_id UUID REFERENCES apt_campaigns(id),
    confidence INTEGER NOT NULL,
    evidence JSONB DEFAULT '[]',
    assessments JSONB DEFAULT '[]',
    methodology JSONB NOT NULL,
    timeline JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    assessor VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Threat Actor Relationships Table
CREATE TABLE IF NOT EXISTS threat_actor_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    actor1_id UUID NOT NULL REFERENCES threat_actors(id),
    actor2_id UUID NOT NULL REFERENCES threat_actors(id),
    relationship_type VARCHAR(50) NOT NULL,
    confidence INTEGER NOT NULL,
    evidence JSONB DEFAULT '[]',
    description TEXT,
    first_observed TIMESTAMP WITH TIME ZONE,
    last_observed TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(actor1_id, actor2_id, relationship_type)
);

-- 5. Threat Actor Indicators Table
CREATE TABLE IF NOT EXISTS threat_actor_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    threat_actor_id UUID REFERENCES threat_actors(id),
    campaign_id UUID REFERENCES apt_campaigns(id),
    type VARCHAR(50) NOT NULL,
    value VARCHAR(1000) NOT NULL,
    context TEXT,
    confidence INTEGER NOT NULL,
    first_seen TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE,
    sources JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Threat Actor Intelligence Stats Table
CREATE TABLE IF NOT EXISTS threat_actor_intelligence_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    data JSONB NOT NULL,
    total_actors INTEGER NOT NULL,
    active_actors INTEGER NOT NULL,
    dormant_actors INTEGER NOT NULL,
    disrupted_actors INTEGER NOT NULL,
    high_threat_actors INTEGER NOT NULL,
    recent_activity INTEGER NOT NULL,
    attribution_accuracy INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_threat_actors_user_id ON threat_actors(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_actors_type ON threat_actors(type);
CREATE INDEX IF NOT EXISTS idx_threat_actors_country ON threat_actors(country);
CREATE INDEX IF NOT EXISTS idx_threat_actors_threat_level ON threat_actors(threat_level);
CREATE INDEX IF NOT EXISTS idx_threat_actors_status ON threat_actors(status);
CREATE INDEX IF NOT EXISTS idx_threat_actors_last_seen ON threat_actors(last_seen);
CREATE INDEX IF NOT EXISTS idx_threat_actors_updated_at ON threat_actors(updated_at);

CREATE INDEX IF NOT EXISTS idx_apt_campaigns_user_id ON apt_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_apt_campaigns_status ON apt_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_apt_campaigns_threat_level ON apt_campaigns(threat_level);
CREATE INDEX IF NOT EXISTS idx_apt_campaigns_first_seen ON apt_campaigns(first_seen);
CREATE INDEX IF NOT EXISTS idx_apt_campaigns_last_seen ON apt_campaigns(last_seen);
CREATE INDEX IF NOT EXISTS idx_apt_campaigns_updated_at ON apt_campaigns(updated_at);

CREATE INDEX IF NOT EXISTS idx_threat_attributions_user_id ON threat_attributions(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_attributions_incident_id ON threat_attributions(incident_id);
CREATE INDEX IF NOT EXISTS idx_threat_attributions_threat_actor_id ON threat_attributions(threat_actor_id);
CREATE INDEX IF NOT EXISTS idx_threat_attributions_campaign_id ON threat_attributions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_threat_attributions_status ON threat_attributions(status);
CREATE INDEX IF NOT EXISTS idx_threat_attributions_created_at ON threat_attributions(created_at);

CREATE INDEX IF NOT EXISTS idx_threat_actor_relationships_user_id ON threat_actor_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_actor_relationships_actor1_id ON threat_actor_relationships(actor1_id);
CREATE INDEX IF NOT EXISTS idx_threat_actor_relationships_actor2_id ON threat_actor_relationships(actor2_id);
CREATE INDEX IF NOT EXISTS idx_threat_actor_relationships_type ON threat_actor_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_threat_actor_indicators_user_id ON threat_actor_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_actor_indicators_threat_actor_id ON threat_actor_indicators(threat_actor_id);
CREATE INDEX IF NOT EXISTS idx_threat_actor_indicators_campaign_id ON threat_actor_indicators(campaign_id);
CREATE INDEX IF NOT EXISTS idx_threat_actor_indicators_type ON threat_actor_indicators(type);
CREATE INDEX IF NOT EXISTS idx_threat_actor_indicators_value ON threat_actor_indicators(value);
CREATE INDEX IF NOT EXISTS idx_threat_actor_indicators_status ON threat_actor_indicators(status);

CREATE INDEX IF NOT EXISTS idx_threat_actor_intelligence_stats_user_id ON threat_actor_intelligence_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_actor_intelligence_stats_updated_at ON threat_actor_intelligence_stats(updated_at);

-- Row Level Security Policies

-- Threat Actors Policies
CREATE POLICY "Users can view their own threat actors" ON threat_actors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threat actors" ON threat_actors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threat actors" ON threat_actors
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threat actors" ON threat_actors
    FOR DELETE USING (auth.uid() = user_id);

-- APT Campaigns Policies
CREATE POLICY "Users can view their own APT campaigns" ON apt_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own APT campaigns" ON apt_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own APT campaigns" ON apt_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own APT campaigns" ON apt_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Threat Attributions Policies
CREATE POLICY "Users can view their own threat attributions" ON threat_attributions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threat attributions" ON threat_attributions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threat attributions" ON threat_attributions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threat attributions" ON threat_attributions
    FOR DELETE USING (auth.uid() = user_id);

-- Threat Actor Relationships Policies
CREATE POLICY "Users can view their own threat actor relationships" ON threat_actor_relationships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threat actor relationships" ON threat_actor_relationships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threat actor relationships" ON threat_actor_relationships
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threat actor relationships" ON threat_actor_relationships
    FOR DELETE USING (auth.uid() = user_id);

-- Threat Actor Indicators Policies
CREATE POLICY "Users can view their own threat actor indicators" ON threat_actor_indicators
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threat actor indicators" ON threat_actor_indicators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threat actor indicators" ON threat_actor_indicators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threat actor indicators" ON threat_actor_indicators
    FOR DELETE USING (auth.uid() = user_id);

-- Threat Actor Intelligence Stats Policies
CREATE POLICY "Users can view their own threat actor intelligence stats" ON threat_actor_intelligence_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threat actor intelligence stats" ON threat_actor_intelligence_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threat actor intelligence stats" ON threat_actor_intelligence_stats
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
CREATE TRIGGER update_threat_actors_updated_at 
    BEFORE UPDATE ON threat_actors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apt_campaigns_updated_at 
    BEFORE UPDATE ON apt_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threat_attributions_updated_at 
    BEFORE UPDATE ON threat_attributions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threat_actor_relationships_updated_at 
    BEFORE UPDATE ON threat_actor_relationships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threat_actor_indicators_updated_at 
    BEFORE UPDATE ON threat_actor_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threat_actor_intelligence_stats_updated_at 
    BEFORE UPDATE ON threat_actor_intelligence_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_threat_actor_data()
RETURNS void AS $$
BEGIN
    -- Delete old threat actor indicators that are inactive and older than 90 days
    DELETE FROM threat_actor_indicators 
    WHERE status = 'INACTIVE' 
    AND created_at < NOW() - INTERVAL '90 days';
    
    -- Delete old threat attributions that are completed and older than 1 year
    DELETE FROM threat_attributions 
    WHERE status = 'COMPLETED' 
    AND created_at < NOW() - INTERVAL '1 year';
    
    -- Delete old threat actor relationships that are inactive and older than 6 months
    DELETE FROM threat_actor_relationships 
    WHERE status = 'INACTIVE' 
    AND created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old data (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-threat-actor-data', '0 3 * * *', 'SELECT cleanup_old_threat_actor_data();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON threat_actors TO authenticated;
GRANT ALL ON apt_campaigns TO authenticated;
GRANT ALL ON threat_attributions TO authenticated;
GRANT ALL ON threat_actor_relationships TO authenticated;
GRANT ALL ON threat_actor_indicators TO authenticated;
GRANT ALL ON threat_actor_intelligence_stats TO authenticated;

-- Create views for common queries
CREATE OR REPLACE VIEW active_threat_actors AS
SELECT 
    ta.*,
    COUNT(tai.id) as indicator_count,
    COUNT(tar.id) as relationship_count
FROM threat_actors ta
LEFT JOIN threat_actor_indicators tai ON ta.id = tai.threat_actor_id AND tai.status = 'ACTIVE'
LEFT JOIN threat_actor_relationships tar ON (ta.id = tar.actor1_id OR ta.id = tar.actor2_id) AND tar.status = 'ACTIVE'
WHERE ta.status = 'ACTIVE'
GROUP BY ta.id;

CREATE OR REPLACE VIEW threat_actor_summary AS
SELECT 
    ta.id,
    ta.name,
    ta.type,
    ta.country,
    ta.threat_level,
    ta.status,
    ta.last_seen,
    ta.confidence,
    COUNT(DISTINCT ac.id) as campaign_count,
    COUNT(DISTINCT tai.id) as indicator_count,
    COUNT(DISTINCT tar.id) as relationship_count
FROM threat_actors ta
LEFT JOIN apt_campaigns ac ON ta.id::text = ANY (
    ARRAY(SELECT jsonb_array_elements_text(ac.threat_actors))
)
LEFT JOIN threat_actor_indicators tai ON ta.id = tai.threat_actor_id AND tai.status = 'ACTIVE'
LEFT JOIN threat_actor_relationships tar ON (ta.id = tar.actor1_id OR ta.id = tar.actor2_id) AND tar.status = 'ACTIVE'
GROUP BY ta.id, ta.name, ta.type, ta.country, ta.threat_level, ta.status, ta.last_seen, ta.confidence;
