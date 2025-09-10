-- =====================================================
-- Threat Actor Intelligence Data Seeding Script
-- Run this script in Supabase SQL Editor to populate
-- threat actor intelligence tables with sample data
-- =====================================================

-- Clear existing data (optional - remove if you want to keep existing data)
-- DELETE FROM threat_actor_relationships;
-- DELETE FROM threat_actor_indicators;
-- DELETE FROM threat_attributions;
-- DELETE FROM apt_campaigns;
-- DELETE FROM threat_actors;

-- Create a demo user ID for sample data (this will be used for demonstration purposes)
-- In production, this should be replaced with actual user IDs
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- This ensures we have a consistent demo user ID for all sample data
    -- In a real application, you would use actual authenticated user IDs
    NULL;
END $$;

-- Insert Threat Actors
INSERT INTO threat_actors (
    id,
    user_id,
    name,
    aliases,
    type,
    country,
    region,
    description,
    motivation,
    capabilities,
    tactics,
    techniques,
    tools,
    infrastructure,
    targets,
    timeline,
    attribution,
    threat_level,
    confidence,
    last_seen,
    status,
    metadata,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'APT29',
    '["Cozy Bear", "The Dukes", "Yttrium"]'::jsonb,
    'APT',
    'Russia',
    'Eastern Europe',
    'APT29 is a sophisticated threat actor group believed to be associated with the Russian government. Known for long-term espionage campaigns targeting government, diplomatic, and corporate entities.',
    '["Espionage", "Intelligence gathering", "Political influence"]'::jsonb,
    '{
        "technical_skills": "Advanced",
        "persistence": "High",
        "stealth": "Very High",
        "social_engineering": "High",
        "custom_tools": true,
        "zero_day_access": true,
        "infrastructure_management": "Advanced"
    }'::jsonb,
    '["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Collection", "Exfiltration"]'::jsonb,
    '{
        "initial_access": ["Phishing", "Watering hole", "Supply chain"],
        "execution": ["PowerShell", "WMI", "Scheduled tasks"],
        "persistence": ["Registry", "Services", "Scheduled tasks"],
        "privilege_escalation": ["Token manipulation", "Process injection"],
        "defense_evasion": ["Living off the land", "Fileless techniques"],
        "credential_access": ["LSASS dumping", "Keyloggers"],
        "discovery": ["Network scanning", "System enumeration"],
        "lateral_movement": ["RDP", "SMB", "WMI"],
        "collection": ["File collection", "Screen capture"],
        "exfiltration": ["DNS tunneling", "HTTP", "FTP"]
    }'::jsonb,
    '["SUNBURST", "TEARDROP", "Raindrop", "Cobalt Strike", "PowerShell Empire"]'::jsonb,
    '{
        "domains": ["cozy-bear-domains.com", "apt29-infra.net"],
        "ips": ["192.168.100.1", "10.0.0.100"],
        "servers": ["C2-Server-1", "C2-Server-2"],
        "cloud_infrastructure": ["AWS", "Azure"]
    }'::jsonb,
    '{
        "primary": ["Government", "Diplomatic", "Defense"],
        "secondary": ["Technology", "Healthcare", "Energy"],
        "geographic": ["US", "EU", "NATO countries"]
    }'::jsonb,
    '{
        "first_seen": "2014-01-01",
        "recent_activity": "2024-01-15",
        "campaigns": ["SolarWinds", "COVID-19", "Ukraine conflict"],
        "milestones": [
            "2014: First attribution",
            "2016: Democratic National Committee breach",
            "2020: SolarWinds supply chain attack",
            "2022: Ukraine-related campaigns"
        ]
    }'::jsonb,
    '{
        "attribution_methodology": "Technical analysis, infrastructure analysis, behavioral analysis",
        "confidence_factors": ["Code similarities", "Infrastructure patterns", "Behavioral patterns"],
        "attribution_sources": ["Government agencies", "Security researchers", "Threat intelligence"]
    }'::jsonb,
    'CRITICAL',
    95,
    '2024-01-15',
    'ACTIVE',
    '{
        "aliases_count": 3,
        "campaigns_count": 15,
        "attribution_confidence": 95,
        "last_attribution": "2024-01-15"
    }'::jsonb,
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'Lazarus Group',
    '["Hidden Cobra", "Guardians of Peace", "ZINC"]'::jsonb,
    'APT',
    'North Korea',
    'East Asia',
    'Lazarus Group is a North Korean state-sponsored threat actor group known for conducting cyber espionage, financial theft, and destructive attacks. Responsible for major cryptocurrency heists and destructive malware campaigns.',
    '["Financial gain", "Espionage", "Destructive attacks", "Cryptocurrency theft"]'::jsonb,
    '{
        "technical_skills": "Advanced",
        "persistence": "High",
        "stealth": "High",
        "social_engineering": "Very High",
        "custom_tools": true,
        "zero_day_access": true,
        "cryptocurrency_expertise": true,
        "destructive_capabilities": true
    }'::jsonb,
    '["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Collection", "Exfiltration", "Impact"]'::jsonb,
    '{
        "initial_access": ["Spear phishing", "Watering hole", "Social engineering"],
        "execution": ["Malware", "Scripts", "Living off the land"],
        "persistence": ["Registry", "Services", "Scheduled tasks"],
        "privilege_escalation": ["Token manipulation", "Process injection"],
        "defense_evasion": ["Anti-analysis", "Packing", "Obfuscation"],
        "credential_access": ["Keyloggers", "Credential dumping"],
        "discovery": ["Network scanning", "System enumeration"],
        "lateral_movement": ["RDP", "SMB", "WMI"],
        "collection": ["File collection", "Screen capture", "Keylogging"],
        "exfiltration": ["HTTP", "FTP", "Email"],
        "impact": ["Data destruction", "Financial theft", "Cryptocurrency theft"]
    }'::jsonb,
    '["WannaCry", "Hermes", "Ryuk", "Maze", "Egregor", "Conti"]'::jsonb,
    '{
        "domains": ["lazarus-domains.com", "nk-infra.net"],
        "ips": ["192.168.200.1", "10.0.0.200"],
        "servers": ["Lazarus-C2-1", "Lazarus-C2-2"],
        "cryptocurrency_wallets": ["BTC-address-1", "ETH-address-2"]
    }'::jsonb,
    '{
        "primary": ["Financial institutions", "Cryptocurrency exchanges", "Government"],
        "secondary": ["Defense", "Technology", "Media"],
        "geographic": ["South Korea", "US", "Global"]
    }'::jsonb,
    '{
        "first_seen": "2009-01-01",
        "recent_activity": "2024-01-10",
        "campaigns": ["Sony Pictures", "WannaCry", "Cryptocurrency heists"],
        "milestones": [
            "2009: First attribution",
            "2014: Sony Pictures attack",
            "2017: WannaCry ransomware",
            "2020: Cryptocurrency exchange heists",
            "2022: Ronin Bridge heist ($625M)"
        ]
    }'::jsonb,
    '{
        "attribution_methodology": "Technical analysis, infrastructure analysis, behavioral analysis",
        "confidence_factors": ["Code similarities", "Infrastructure patterns", "Behavioral patterns"],
        "attribution_sources": ["Government agencies", "Security researchers", "Threat intelligence"]
    }'::jsonb,
    'CRITICAL',
    90,
    '2024-01-10',
    'ACTIVE',
    '{
        "aliases_count": 3,
        "campaigns_count": 25,
        "attribution_confidence": 90,
        "last_attribution": "2024-01-10"
    }'::jsonb,
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'FIN7',
    '["Carbanak", "Navigator Group", "JokerStash"]'::jsonb,
    'Cybercriminal',
    'Unknown',
    'Eastern Europe',
    'FIN7 is a financially motivated threat actor group known for targeting retail, restaurant, and hospitality industries. Specializes in point-of-sale (POS) malware and credit card theft.',
    '["Financial gain", "Credit card theft", "Identity theft"]'::jsonb,
    '{
        "technical_skills": "Advanced",
        "persistence": "Medium",
        "stealth": "High",
        "social_engineering": "Very High",
        "custom_tools": true,
        "pos_malware_expertise": true,
        "card_fraud_expertise": true
    }'::jsonb,
    '["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Collection", "Exfiltration", "Impact"]'::jsonb,
    '{
        "initial_access": ["Spear phishing", "Malvertising", "Social engineering"],
        "execution": ["POS malware", "Scripts", "Living off the land"],
        "persistence": ["Registry", "Services", "Scheduled tasks"],
        "privilege_escalation": ["Token manipulation", "Process injection"],
        "defense_evasion": ["Anti-analysis", "Packing", "Obfuscation"],
        "credential_access": ["Keyloggers", "Credential dumping"],
        "discovery": ["Network scanning", "System enumeration"],
        "lateral_movement": ["RDP", "SMB", "WMI"],
        "collection": ["Credit card data", "PII", "Financial records"],
        "exfiltration": ["HTTP", "FTP", "Email"],
        "impact": ["Financial theft", "Credit card fraud", "Identity theft"]
    }'::jsonb,
    '["Carbanak", "FIN7 POS malware", "Card skimming tools", "Cobalt Strike"]'::jsonb,
    '{
        "domains": ["fin7-domains.com", "card-shop.net"],
        "ips": ["192.168.300.1", "10.0.0.300"],
        "servers": ["FIN7-C2-1", "FIN7-C2-2"],
        "card_shops": ["JokerStash", "Cardplanet"]
    }'::jsonb,
    '{
        "primary": ["Retail", "Restaurant", "Hospitality"],
        "secondary": ["Healthcare", "Education", "Government"],
        "geographic": ["US", "Canada", "UK", "Australia"]
    }'::jsonb,
    '{
        "first_seen": "2015-01-01",
        "recent_activity": "2024-01-05",
        "campaigns": ["POS malware campaigns", "Card fraud operations"],
        "milestones": [
            "2015: First attribution",
            "2016: Major retail breaches",
            "2018: Restaurant chain attacks",
            "2020: Healthcare targeting",
            "2022: Continued POS attacks"
        ]
    }'::jsonb,
    '{
        "attribution_methodology": "Technical analysis, infrastructure analysis, behavioral analysis",
        "confidence_factors": ["Code similarities", "Infrastructure patterns", "Behavioral patterns"],
        "attribution_sources": ["Law enforcement", "Security researchers", "Threat intelligence"]
    }'::jsonb,
    'HIGH',
    85,
    '2024-01-05',
    'ACTIVE',
    '{
        "aliases_count": 3,
        "campaigns_count": 20,
        "attribution_confidence": 85,
        "last_attribution": "2024-01-05"
    }'::jsonb,
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'APT1',
    '["Comment Crew", "Comment Panda", "Shanghai Group"]'::jsonb,
    'APT',
    'China',
    'East Asia',
    'APT1 is a Chinese state-sponsored threat actor group known for conducting cyber espionage against government, defense, and technology sectors. One of the most prolific APT groups.',
    '["Espionage", "Intelligence gathering", "Technology theft"]'::jsonb,
    '{
        "technical_skills": "Advanced",
        "persistence": "Very High",
        "stealth": "High",
        "social_engineering": "High",
        "custom_tools": true,
        "zero_day_access": true,
        "infrastructure_management": "Advanced"
    }'::jsonb,
    '["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Collection", "Exfiltration"]'::jsonb,
    '{
        "initial_access": ["Spear phishing", "Watering hole", "Supply chain"],
        "execution": ["Custom malware", "Scripts", "Living off the land"],
        "persistence": ["Registry", "Services", "Scheduled tasks"],
        "privilege_escalation": ["Token manipulation", "Process injection"],
        "defense_evasion": ["Anti-analysis", "Packing", "Obfuscation"],
        "credential_access": ["Keyloggers", "Credential dumping"],
        "discovery": ["Network scanning", "System enumeration"],
        "lateral_movement": ["RDP", "SMB", "WMI"],
        "collection": ["File collection", "Screen capture", "Keylogging"],
        "exfiltration": ["HTTP", "FTP", "Email"]
    }'::jsonb,
    '["APT1 malware", "Custom backdoors", "Keyloggers", "Screen capture tools"]'::jsonb,
    '{
        "domains": ["apt1-domains.com", "comment-crew.net"],
        "ips": ["192.168.400.1", "10.0.0.400"],
        "servers": ["APT1-C2-1", "APT1-C2-2"],
        "cloud_infrastructure": ["AWS", "Azure"]
    }'::jsonb,
    '{
        "primary": ["Government", "Defense", "Technology"],
        "secondary": ["Healthcare", "Energy", "Financial"],
        "geographic": ["US", "EU", "Asia-Pacific"]
    }'::jsonb,
    '{
        "first_seen": "2006-01-01",
        "recent_activity": "2024-01-01",
        "campaigns": ["Operation Aurora", "Comment Crew", "Shanghai Group"],
        "milestones": [
            "2006: First attribution",
            "2009: Operation Aurora",
            "2013: Mandiant report",
            "2020: Continued espionage campaigns"
        ]
    }'::jsonb,
    '{
        "attribution_methodology": "Technical analysis, infrastructure analysis, behavioral analysis",
        "confidence_factors": ["Code similarities", "Infrastructure patterns", "Behavioral patterns"],
        "attribution_sources": ["Government agencies", "Security researchers", "Threat intelligence"]
    }'::jsonb,
    'CRITICAL',
    88,
    '2024-01-01',
    'ACTIVE',
    '{
        "aliases_count": 3,
        "campaigns_count": 30,
        "attribution_confidence": 88,
        "last_attribution": "2024-01-01"
    }'::jsonb,
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'APT28',
    '["Fancy Bear", "Sofacy", "Pawn Storm"]'::jsonb,
    'APT',
    'Russia',
    'Eastern Europe',
    'APT28 is a Russian state-sponsored threat actor group known for conducting cyber espionage and influence operations. Associated with the Russian military intelligence service GRU.',
    '["Espionage", "Influence operations", "Political interference"]'::jsonb,
    '{
        "technical_skills": "Advanced",
        "persistence": "High",
        "stealth": "High",
        "social_engineering": "Very High",
        "custom_tools": true,
        "zero_day_access": true,
        "influence_operations": true
    }'::jsonb,
    '["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Collection", "Exfiltration", "Impact"]'::jsonb,
    '{
        "initial_access": ["Spear phishing", "Watering hole", "Social engineering"],
        "execution": ["Custom malware", "Scripts", "Living off the land"],
        "persistence": ["Registry", "Services", "Scheduled tasks"],
        "privilege_escalation": ["Token manipulation", "Process injection"],
        "defense_evasion": ["Anti-analysis", "Packing", "Obfuscation"],
        "credential_access": ["Keyloggers", "Credential dumping"],
        "discovery": ["Network scanning", "System enumeration"],
        "lateral_movement": ["RDP", "SMB", "WMI"],
        "collection": ["File collection", "Screen capture", "Keylogging"],
        "exfiltration": ["HTTP", "FTP", "Email"],
        "impact": ["Data theft", "Influence operations", "Political interference"]
    }'::jsonb,
    '["Sofacy", "X-Agent", "X-Tunnel", "Zebrocy", "Cannon"]'::jsonb,
    '{
        "domains": ["fancy-bear-domains.com", "apt28-infra.net"],
        "ips": ["192.168.500.1", "10.0.0.500"],
        "servers": ["APT28-C2-1", "APT28-C2-2"],
        "cloud_infrastructure": ["AWS", "Azure"]
    }'::jsonb,
    '{
        "primary": ["Government", "Defense", "Media"],
        "secondary": ["Technology", "Healthcare", "Energy"],
        "geographic": ["US", "EU", "NATO countries"]
    }'::jsonb,
    '{
        "first_seen": "2007-01-01",
        "recent_activity": "2024-01-12",
        "campaigns": ["DNC breach", "Olympic Destroyer", "Influence operations"],
        "milestones": [
            "2007: First attribution",
            "2016: DNC breach",
            "2018: Olympic Destroyer",
            "2020: COVID-19 disinformation",
            "2022: Ukraine conflict operations"
        ]
    }'::jsonb,
    '{
        "attribution_methodology": "Technical analysis, infrastructure analysis, behavioral analysis",
        "confidence_factors": ["Code similarities", "Infrastructure patterns", "Behavioral patterns"],
        "attribution_sources": ["Government agencies", "Security researchers", "Threat intelligence"]
    }'::jsonb,
    'CRITICAL',
    92,
    '2024-01-12',
    'ACTIVE',
    '{
        "aliases_count": 3,
        "campaigns_count": 35,
        "attribution_confidence": 92,
        "last_attribution": "2024-01-12"
    }'::jsonb,
    NOW(),
    NOW()
);

-- Get the threat actor IDs for campaign creation
WITH threat_actor_ids AS (
    SELECT id, name FROM threat_actors WHERE name IN ('APT29', 'Lazarus Group', 'FIN7', 'APT1', 'APT28')
)
-- Insert APT Campaigns
INSERT INTO apt_campaigns (
    id,
    user_id,
    name,
    aliases,
    threat_actors,
    description,
    objectives,
    targets,
    timeline,
    techniques,
    infrastructure,
    indicators,
    attribution,
    impact,
    status,
    threat_level,
    confidence,
    first_seen,
    last_seen,
    metadata,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'SolarWinds Supply Chain Attack',
    '["SUNBURST", "TEARDROP", "Raindrop"]'::jsonb,
    (SELECT json_agg(id) FROM threat_actor_ids WHERE name = 'APT29'),
    'A sophisticated supply chain attack targeting the SolarWinds Orion platform, affecting thousands of organizations globally including government agencies and major corporations.',
    '["Espionage", "Long-term access", "Intelligence gathering"]'::jsonb,
    '{
        "primary": ["Government", "Defense", "Technology"],
        "secondary": ["Healthcare", "Energy", "Financial"],
        "geographic": ["US", "EU", "Global"]
    }'::jsonb,
    '{
        "start_date": "2020-03-01",
        "end_date": "2020-12-31",
        "phases": ["Initial compromise", "Lateral movement", "Data collection", "Exfiltration"],
        "milestones": [
            "2020-03: Initial compromise",
            "2020-06: Discovery of backdoor",
            "2020-12: Public disclosure"
        ]
    }'::jsonb,
    '{
        "initial_access": ["Supply chain compromise", "Software update hijacking"],
        "execution": ["Backdoor deployment", "Living off the land"],
        "persistence": ["Scheduled tasks", "Services", "Registry"],
        "privilege_escalation": ["Token manipulation", "Process injection"],
        "defense_evasion": ["Anti-analysis", "Steganography"],
        "credential_access": ["LSASS dumping", "Credential harvesting"],
        "discovery": ["Network scanning", "System enumeration"],
        "lateral_movement": ["RDP", "SMB", "WMI"],
        "collection": ["File collection", "Email access", "Database access"],
        "exfiltration": ["DNS tunneling", "HTTP", "FTP"]
    }'::jsonb,
    '{
        "domains": ["SolarWinds update servers", "C2 infrastructure"],
        "ips": ["C2 server IPs"],
        "servers": ["C2 servers", "Update servers"],
        "cloud_infrastructure": ["AWS", "Azure"]
    }'::jsonb,
    '{
        "technical_indicators": ["SUNBURST backdoor", "TEARDROP dropper", "Raindrop loader"],
        "infrastructure": ["SolarWinds update servers", "C2 infrastructure"],
        "behavioral_patterns": ["Long-term persistence", "Stealth operations"]
    }'::jsonb,
    '{
        "attribution_methodology": "Technical analysis, infrastructure analysis, behavioral analysis",
        "confidence_factors": ["Code similarities", "Infrastructure patterns", "Behavioral patterns"],
        "attribution_sources": ["Government agencies", "Security researchers", "Threat intelligence"]
    }'::jsonb,
    '{
        "organizations_affected": 18000,
        "data_compromised": "Highly sensitive government and corporate data",
        "financial_impact": "Billions in remediation costs",
        "reputation_damage": "Severe",
        "operational_impact": "Significant"
    }'::jsonb,
    'COMPLETED',
    'CRITICAL',
    95,
    '2020-03-01',
    '2020-12-31',
    '{
        "campaign_duration": "9 months",
        "organizations_affected": 18000,
        "attribution_confidence": 95
    }'::jsonb,
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'WannaCry Ransomware Campaign',
    '["WannaCry", "WannaCrypt", "WCry"]'::jsonb,
    (SELECT json_agg(id) FROM threat_actor_ids WHERE name = 'Lazarus Group'),
    'A global ransomware attack that affected hundreds of thousands of computers across 150 countries, causing widespread disruption to healthcare, government, and corporate systems.',
    '["Destructive attack", "Financial gain", "Disruption", "Propaganda"]'::jsonb,
    '{
        "primary": ["Healthcare", "Government", "Corporate"],
        "secondary": ["Education", "Financial", "Technology"],
        "geographic": ["Global", "150 countries affected"]
    }'::jsonb,
    '{
        "start_date": "2017-05-12",
        "end_date": "2017-05-15",
        "phases": ["Initial deployment", "Propagation", "Encryption", "Ransom demands"],
        "milestones": [
            "2017-05-12: Initial deployment",
            "2017-05-12: Global propagation",
            "2017-05-13: Kill switch activation",
            "2017-05-15: Campaign end"
        ]
    }'::jsonb,
    '{
        "initial_access": ["EternalBlue exploit", "Email phishing"],
        "execution": ["WannaCry ransomware", "Worm propagation"],
        "persistence": ["Registry", "Services"],
        "privilege_escalation": ["EternalBlue", "EternalRomance"],
        "defense_evasion": ["Anti-analysis", "Packing"],
        "credential_access": ["Credential dumping"],
        "discovery": ["Network scanning", "System enumeration"],
        "lateral_movement": ["SMB", "EternalBlue", "EternalRomance"],
        "collection": ["File enumeration"],
        "exfiltration": ["Ransomware encryption"],
        "impact": ["Data encryption", "System disruption"]
    }'::jsonb,
    '{
        "domains": ["C2 servers", "Bitcoin wallets"],
        "ips": ["C2 server IPs"],
        "servers": ["C2 servers"],
        "cryptocurrency_wallets": ["Bitcoin wallets"]
    }'::jsonb,
    '{
        "technical_indicators": ["WannaCry ransomware", "EternalBlue exploit", "Kill switch domain"],
        "infrastructure": ["C2 servers", "Bitcoin wallets"],
        "behavioral_patterns": ["Worm-like propagation", "Ransom demands"]
    }'::jsonb,
    '{
        "attribution_methodology": "Technical analysis, infrastructure analysis, behavioral analysis",
        "confidence_factors": ["Code similarities", "Infrastructure patterns", "Behavioral patterns"],
        "attribution_sources": ["Government agencies", "Security researchers", "Threat intelligence"]
    }'::jsonb,
    '{
        "organizations_affected": 300000,
        "countries_affected": 150,
        "financial_impact": "Billions in damages",
        "reputation_damage": "Severe",
        "operational_impact": "Critical"
    }'::jsonb,
    'COMPLETED',
    'CRITICAL',
    90,
    '2017-05-12',
    '2017-05-15',
    '{
        "campaign_duration": "3 days",
        "organizations_affected": 300000,
        "attribution_confidence": 90
    }'::jsonb,
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'FIN7 POS Malware Campaign',
    '["POS malware", "Card skimming", "JokerStash"]'::jsonb,
    (SELECT json_agg(id) FROM threat_actor_ids WHERE name = 'FIN7'),
    'A long-running campaign targeting retail and restaurant chains with point-of-sale malware to steal credit card data and personal information.',
    '["Financial gain", "Credit card theft", "Identity theft", "Data monetization"]'::jsonb,
    '{
        "primary": ["Retail", "Restaurant", "Hospitality"],
        "secondary": ["Healthcare", "Education", "Government"],
        "geographic": ["US", "Canada", "UK", "Australia"]
    }'::jsonb,
    '{
        "start_date": "2015-01-01",
        "end_date": "2022-12-31",
        "phases": ["Initial access", "Malware deployment", "Data collection", "Exfiltration"],
        "milestones": [
            "2015: Campaign start",
            "2016: Major retail breaches",
            "2018: Restaurant chain attacks",
            "2020: Healthcare targeting",
            "2022: Campaign end"
        ]
    }'::jsonb,
    '{
        "initial_access": ["Spear phishing", "Malvertising", "Social engineering"],
        "execution": ["POS malware", "Scripts", "Living off the land"],
        "persistence": ["Registry", "Services", "Scheduled tasks"],
        "privilege_escalation": ["Token manipulation", "Process injection"],
        "defense_evasion": ["Anti-analysis", "Packing", "Obfuscation"],
        "credential_access": ["Keyloggers", "Credential dumping"],
        "discovery": ["Network scanning", "System enumeration"],
        "lateral_movement": ["RDP", "SMB", "WMI"],
        "collection": ["Credit card data", "PII", "Financial records"],
        "exfiltration": ["HTTP", "FTP", "Email"],
        "impact": ["Financial theft", "Credit card fraud", "Identity theft"]
    }'::jsonb,
    '{
        "domains": ["C2 servers", "Card shops"],
        "ips": ["C2 server IPs"],
        "servers": ["C2 servers"],
        "card_shops": ["JokerStash", "Cardplanet"]
    }'::jsonb,
    '{
        "technical_indicators": ["POS malware", "Card skimming tools", "C2 infrastructure"],
        "infrastructure": ["C2 servers", "Card shops", "Payment processors"],
        "behavioral_patterns": ["Long-term persistence", "Credit card focus"]
    }'::jsonb,
    '{
        "attribution_methodology": "Technical analysis, infrastructure analysis, behavioral analysis",
        "confidence_factors": ["Code similarities", "Infrastructure patterns", "Behavioral patterns"],
        "attribution_sources": ["Law enforcement", "Security researchers", "Threat intelligence"]
    }'::jsonb,
    '{
        "organizations_affected": 100,
        "credit_cards_stolen": 15000000,
        "financial_impact": "Hundreds of millions in fraud",
        "reputation_damage": "Severe",
        "operational_impact": "Significant"
    }'::jsonb,
    'COMPLETED',
    'HIGH',
    85,
    '2015-01-01',
    '2022-12-31',
    '{
        "campaign_duration": "8 years",
        "organizations_affected": 100,
        "attribution_confidence": 85
    }'::jsonb,
    NOW(),
    NOW()
);

-- Insert Threat Attributions
INSERT INTO threat_attributions (
    id,
    user_id,
    incident_id,
    threat_actor_id,
    campaign_id,
    confidence,
    evidence,
    assessments,
    methodology,
    timeline,
    status,
    assessor,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'INCIDENT-2020-001',
    (SELECT id FROM threat_actors WHERE name = 'APT29'),
    (SELECT id FROM apt_campaigns WHERE name = 'SolarWinds Supply Chain Attack'),
    95,
    '{
        "code_similarities": ["SUNBURST backdoor code patterns", "TEARDROP dropper techniques"],
        "infrastructure": ["C2 server patterns", "Domain registration patterns"],
        "tools": ["Custom malware families", "Living off the land techniques"],
        "behavioral": ["Long-term persistence", "Stealth operations", "Espionage focus"]
    }'::jsonb,
    '{
        "technical_assessment": "High confidence based on code analysis",
        "infrastructure_assessment": "High confidence based on infrastructure analysis",
        "behavioral_assessment": "High confidence based on behavioral patterns"
    }'::jsonb,
    '{
        "analysis_methods": ["Code analysis", "Infrastructure analysis", "Behavioral analysis"],
        "data_sources": ["Malware samples", "Network traffic", "Threat intelligence"],
        "validation": ["Peer review", "Independent analysis", "Government attribution"]
    }'::jsonb,
    '{
        "attribution_date": "2020-12-13",
        "analysis_duration": "2 weeks",
        "validation_date": "2020-12-20"
    }'::jsonb,
    'COMPLETED',
    'Threat Intelligence Team',
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'INCIDENT-2017-001',
    (SELECT id FROM threat_actors WHERE name = 'Lazarus Group'),
    (SELECT id FROM apt_campaigns WHERE name = 'WannaCry Ransomware Campaign'),
    90,
    '{
        "code_similarities": ["WannaCry code patterns", "EternalBlue exploit usage"],
        "infrastructure": ["C2 server patterns", "Bitcoin wallet patterns"],
        "tools": ["Custom ransomware", "Worm propagation techniques"],
        "behavioral": ["Destructive attack patterns", "Propaganda messaging"]
    }'::jsonb,
    '{
        "technical_assessment": "High confidence based on code analysis",
        "infrastructure_assessment": "Medium confidence based on infrastructure analysis",
        "behavioral_assessment": "High confidence based on behavioral patterns"
    }'::jsonb,
    '{
        "analysis_methods": ["Code analysis", "Infrastructure analysis", "Behavioral analysis"],
        "data_sources": ["Malware samples", "Network traffic", "Threat intelligence"],
        "validation": ["Peer review", "Independent analysis", "Government attribution"]
    }'::jsonb,
    '{
        "attribution_date": "2017-05-15",
        "analysis_duration": "1 week",
        "validation_date": "2017-05-22"
    }'::jsonb,
    'COMPLETED',
    'Security Research Team',
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    'INCIDENT-2018-001',
    (SELECT id FROM threat_actors WHERE name = 'FIN7'),
    (SELECT id FROM apt_campaigns WHERE name = 'FIN7 POS Malware Campaign'),
    85,
    '{
        "code_similarities": ["POS malware code patterns", "Card skimming techniques"],
        "infrastructure": ["C2 server patterns", "Card shop infrastructure"],
        "tools": ["Custom POS malware", "Card skimming tools"],
        "behavioral": ["Financial focus", "Long-term persistence", "Credit card targeting"]
    }'::jsonb,
    '{
        "technical_assessment": "High confidence based on code analysis",
        "infrastructure_assessment": "High confidence based on infrastructure analysis",
        "behavioral_assessment": "High confidence based on behavioral patterns"
    }'::jsonb,
    '{
        "analysis_methods": ["Code analysis", "Infrastructure analysis", "Behavioral analysis"],
        "data_sources": ["Malware samples", "Network traffic", "Threat intelligence"],
        "validation": ["Peer review", "Independent analysis", "Law enforcement attribution"]
    }'::jsonb,
    '{
        "attribution_date": "2018-01-01",
        "analysis_duration": "3 weeks",
        "validation_date": "2018-01-21"
    }'::jsonb,
    'COMPLETED',
    'Financial Crime Intelligence Team',
    NOW(),
    NOW()
);

-- Insert Threat Actor Relationships
INSERT INTO threat_actor_relationships (
    id,
    user_id,
    actor1_id,
    actor2_id,
    relationship_type,
    confidence,
    evidence,
    description,
    first_observed,
    last_observed,
    status,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    (SELECT id FROM threat_actors WHERE name = 'APT29'),
    (SELECT id FROM threat_actors WHERE name = 'Lazarus Group'),
    'collaboration',
    60,
    '{
        "shared_tools": ["Custom malware families", "Infrastructure patterns"],
        "campaign_overlap": ["Certain target overlaps", "Timing patterns"],
        "technical_similarities": ["Code patterns", "Infrastructure setup"]
    }'::jsonb,
    'Suspected collaboration in certain campaigns, sharing of tools and techniques.',
    '2020-01-01',
    '2024-01-15',
    'ACTIVE',
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    (SELECT id FROM threat_actors WHERE name = 'APT1'),
    (SELECT id FROM threat_actors WHERE name = 'APT28'),
    'competition',
    70,
    '{
        "target_overlap": ["Government targets", "Defense targets"],
        "timing_patterns": ["Alternating campaigns", "Avoidance patterns"],
        "technical_differences": ["Different tool sets", "Different techniques"]
    }'::jsonb,
    'Competing threat actors targeting similar sectors with different approaches.',
    '2010-01-01',
    '2024-01-12',
    'ACTIVE',
    NOW(),
    NOW()
);

-- Insert Threat Actor Indicators
INSERT INTO threat_actor_indicators (
    id,
    user_id,
    threat_actor_id,
    campaign_id,
    type,
    value,
    context,
    confidence,
    first_seen,
    last_seen,
    sources,
    tags,
    status,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    (SELECT id FROM threat_actors WHERE name = 'APT29'),
    (SELECT id FROM apt_campaigns WHERE name = 'SolarWinds Supply Chain Attack'),
    'domain',
    'cozy-bear-domains.com',
    'APT29 C2 domain used in multiple campaigns',
    90,
    '2020-01-01',
    '2024-01-15',
    '["Threat Intelligence", "Government Sources"]'::jsonb,
    '["C2", "APT29", "SolarWinds"]'::jsonb,
    'ACTIVE',
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    (SELECT id FROM threat_actors WHERE name = 'APT29'),
    (SELECT id FROM apt_campaigns WHERE name = 'SolarWinds Supply Chain Attack'),
    'ip',
    '192.168.100.1',
    'APT29 C2 server IP address',
    85,
    '2020-01-01',
    '2024-01-15',
    '["Threat Intelligence", "Network Monitoring"]'::jsonb,
    '["C2", "APT29", "Infrastructure"]'::jsonb,
    'ACTIVE',
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    (SELECT id FROM threat_actors WHERE name = 'Lazarus Group'),
    (SELECT id FROM apt_campaigns WHERE name = 'WannaCry Ransomware Campaign'),
    'domain',
    'lazarus-domains.com',
    'Lazarus Group C2 domain',
    90,
    '2017-01-01',
    '2024-01-10',
    '["Threat Intelligence", "Government Sources"]'::jsonb,
    '["C2", "Lazarus", "WannaCry"]'::jsonb,
    'ACTIVE',
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    (SELECT id FROM threat_actors WHERE name = 'Lazarus Group'),
    (SELECT id FROM apt_campaigns WHERE name = 'WannaCry Ransomware Campaign'),
    'hash',
    'abc123def456789',
    'Lazarus Group malware hash',
    95,
    '2017-05-12',
    '2024-01-10',
    '["Malware Analysis", "Threat Intelligence"]'::jsonb,
    '["Malware", "Lazarus", "WannaCry"]'::jsonb,
    'ACTIVE',
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    (SELECT id FROM threat_actors WHERE name = 'FIN7'),
    (SELECT id FROM apt_campaigns WHERE name = 'FIN7 POS Malware Campaign'),
    'domain',
    'fin7-domains.com',
    'FIN7 C2 domain',
    85,
    '2015-01-01',
    '2024-01-05',
    '["Threat Intelligence", "Law Enforcement"]'::jsonb,
    '["C2", "FIN7", "POS"]'::jsonb,
    'ACTIVE',
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    (SELECT id FROM threat_actors WHERE name = 'FIN7'),
    (SELECT id FROM apt_campaigns WHERE name = 'FIN7 POS Malware Campaign'),
    'email',
    'fin7-actor@example.com',
    'FIN7 actor email address',
    80,
    '2015-01-01',
    '2024-01-05',
    '["Threat Intelligence", "Social Engineering"]'::jsonb,
    '["Email", "FIN7", "Social Engineering"]'::jsonb,
    'ACTIVE',
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    (SELECT id FROM threat_actors WHERE name = 'APT1'),
    NULL,
    'domain',
    'apt1-domains.com',
    'APT1 C2 domain',
    88,
    '2006-01-01',
    '2024-01-01',
    '["Threat Intelligence", "Government Sources"]'::jsonb,
    '["C2", "APT1", "Comment Crew"]'::jsonb,
    'ACTIVE',
    NOW(),
    NOW()
),
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    (SELECT id FROM threat_actors WHERE name = 'APT28'),
    NULL,
    'domain',
    'fancy-bear-domains.com',
    'APT28 C2 domain',
    92,
    '2007-01-01',
    '2024-01-12',
    '["Threat Intelligence", "Government Sources"]'::jsonb,
    '["C2", "APT28", "Fancy Bear"]'::jsonb,
    'ACTIVE',
    NOW(),
    NOW()
);

-- Insert Threat Actor Intelligence Stats
INSERT INTO threat_actor_intelligence_stats (
    id,
    user_id,
    data,
    total_actors,
    active_actors,
    dormant_actors,
    disrupted_actors,
    high_threat_actors,
    recent_activity,
    attribution_accuracy,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(), -- Unique ID for each threat actor
    '00000000-0000-0000-0000-000000000001'::UUID, -- demo user_id for sample data
    '{
        "threat_landscape": {
            "total_apt_groups": 4,
            "total_cybercriminal_groups": 1,
            "state_sponsored": 4,
            "financially_motivated": 1
        },
        "geographic_distribution": {
            "russia": 2,
            "north_korea": 1,
            "china": 1,
            "unknown": 1
        },
        "threat_levels": {
            "critical": 4,
            "high": 1,
            "medium": 0,
            "low": 0
        },
        "activity_status": {
            "active": 5,
            "dormant": 0,
            "disrupted": 0
        },
        "attribution_confidence": {
            "high_confidence": 4,
            "medium_confidence": 1,
            "low_confidence": 0
        },
        "campaign_analysis": {
            "total_campaigns": 3,
            "active_campaigns": 0,
            "completed_campaigns": 3,
            "ongoing_campaigns": 0
        },
        "indicator_analysis": {
            "total_indicators": 8,
            "active_indicators": 8,
            "expired_indicators": 0,
            "false_positives": 0
        },
        "relationship_analysis": {
            "total_relationships": 2,
            "collaboration": 1,
            "competition": 1,
            "neutral": 0
        }
    }'::jsonb,
    5,  -- total_actors
    5,  -- active_actors
    0,  -- dormant_actors
    0,  -- disrupted_actors
    4,  -- high_threat_actors (critical level)
    5,  -- recent_activity (all actors have recent activity)
    90, -- attribution_accuracy (average confidence)
    NOW(),
    NOW()
);

-- Verify the data was inserted
SELECT 'Threat Actors' as table_name, COUNT(*) as count FROM threat_actors
UNION ALL
SELECT 'APT Campaigns', COUNT(*) FROM apt_campaigns
UNION ALL
SELECT 'Threat Attributions', COUNT(*) FROM threat_attributions
UNION ALL
SELECT 'Threat Actor Relationships', COUNT(*) FROM threat_actor_relationships
UNION ALL
SELECT 'Threat Actor Indicators', COUNT(*) FROM threat_actor_indicators
UNION ALL
SELECT 'Threat Actor Intelligence Stats', COUNT(*) FROM threat_actor_intelligence_stats;

-- Show sample data
SELECT 
    ta.name as threat_actor,
    ta.country,
    ta.threat_level,
    ta.confidence,
    ta.status
FROM threat_actors ta
ORDER BY ta.confidence DESC;