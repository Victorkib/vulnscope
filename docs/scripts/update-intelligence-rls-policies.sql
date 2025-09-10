-- Update RLS Policies for Global Intelligence Data Access
-- This script updates the Row Level Security policies to allow access to demo data
-- while maintaining security for user-specific data

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own threat landscape data" ON intelligence_threat_landscape;
DROP POLICY IF EXISTS "Users can view their own security posture data" ON intelligence_security_posture;
DROP POLICY IF EXISTS "Users can view their own intelligence stats" ON intelligence_stats;
DROP POLICY IF EXISTS "Users can view their own intelligence alerts" ON intelligence_alerts;

-- Create new policies that allow access to both user data and demo data
-- Threat Landscape Policies
CREATE POLICY "Users can view their own and demo threat landscape data" ON intelligence_threat_landscape
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id = '00000000-0000-0000-0000-000000000001'::UUID
    );

CREATE POLICY "Users can insert their own threat landscape data" ON intelligence_threat_landscape
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threat landscape data" ON intelligence_threat_landscape
    FOR UPDATE USING (auth.uid() = user_id);

-- Security Posture Policies
CREATE POLICY "Users can view their own and demo security posture data" ON intelligence_security_posture
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id = '00000000-0000-0000-0000-000000000001'::UUID
    );

CREATE POLICY "Users can insert their own security posture data" ON intelligence_security_posture
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security posture data" ON intelligence_security_posture
    FOR UPDATE USING (auth.uid() = user_id);

-- Stats Policies
CREATE POLICY "Users can view their own and demo intelligence stats" ON intelligence_stats
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id = '00000000-0000-0000-0000-000000000001'::UUID
    );

CREATE POLICY "Users can insert their own intelligence stats" ON intelligence_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intelligence stats" ON intelligence_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Alerts Policies
CREATE POLICY "Users can view their own and demo intelligence alerts" ON intelligence_alerts
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id = '00000000-0000-0000-0000-000000000001'::UUID
    );

CREATE POLICY "Users can insert their own intelligence alerts" ON intelligence_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intelligence alerts" ON intelligence_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- Create a view for global intelligence alerts that all users can access
CREATE OR REPLACE VIEW global_intelligence_alerts AS
SELECT 
    id,
    type,
    severity,
    title,
    description,
    source,
    confidence,
    affected_systems,
    recommended_actions,
    related_intelligence,
    acknowledged,
    acknowledged_by,
    acknowledged_at,
    expires_at,
    created_at,
    updated_at
FROM intelligence_alerts
WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON global_intelligence_alerts TO authenticated;

-- Create a view for global intelligence stats
CREATE OR REPLACE VIEW global_intelligence_stats AS
SELECT 
    id,
    data,
    total_threats,
    active_threats,
    new_threats,
    resolved_threats,
    threat_actors,
    attack_vectors,
    zero_days,
    security_posture_score,
    compliance_score,
    prediction_accuracy,
    created_at,
    updated_at
FROM intelligence_stats
WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID
ORDER BY updated_at DESC
LIMIT 1;

-- Grant access to the view
GRANT SELECT ON global_intelligence_stats TO authenticated;

-- Create a view for global threat landscape
CREATE OR REPLACE VIEW global_intelligence_threat_landscape AS
SELECT 
    id,
    data,
    view_type,
    timeframe,
    region,
    sector,
    created_at,
    updated_at
FROM intelligence_threat_landscape
WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID
ORDER BY updated_at DESC
LIMIT 1;

-- Grant access to the view
GRANT SELECT ON global_intelligence_threat_landscape TO authenticated;

-- Create a view for global security posture
CREATE OR REPLACE VIEW global_intelligence_security_posture AS
SELECT 
    id,
    organization_id,
    data,
    risk_score,
    vulnerability_exposure,
    patch_compliance,
    security_maturity,
    threat_level,
    created_at,
    updated_at
FROM intelligence_security_posture
WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID
ORDER BY updated_at DESC
LIMIT 1;

-- Grant access to the view
GRANT SELECT ON global_intelligence_security_posture TO authenticated;
