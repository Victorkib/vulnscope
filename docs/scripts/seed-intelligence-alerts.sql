-- =====================================================
-- Intelligence Alerts Seeding Script
-- Run this script in Supabase SQL Editor to populate
-- the intelligence_alerts table with sample data
-- =====================================================

-- Clear existing data (optional - remove if you want to keep existing data)
-- DELETE FROM intelligence_alerts;

-- Insert sample intelligence alerts
INSERT INTO intelligence_alerts (
    id,
    user_id,
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
    expires_at,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    gen_random_uuid(), -- user_id (will be replaced with actual user ID)
    'threat_actor_activity',
    'high',
    'APT29 Campaign Detected: New Phishing Infrastructure',
    'APT29 has deployed new phishing infrastructure targeting financial institutions. Multiple domains registered in the last 24 hours.',
    'Threat Intelligence Feed',
    85,
    '{
        "systems": ["email_servers", "firewall", "dns_servers"],
        "domains": ["phishing-domain-1.com", "phishing-domain-2.com"],
        "ips": ["192.168.1.100", "10.0.0.50"]
    }'::jsonb,
    '{
        "immediate": [
            "Block identified domains at firewall level",
            "Update email security rules"
        ],
        "short_term": [
            "Educate users about new phishing techniques",
            "Monitor for suspicious email patterns"
        ],
        "long_term": [
            "Implement advanced threat detection",
            "Review security awareness training"
        ]
    }'::jsonb,
    '{
        "threat_actors": ["APT29"],
        "attack_vectors": ["phishing", "social_engineering"],
        "indicators": ["phishing-domain-1.com", "phishing-domain-2.com"],
        "hashes": ["abc123def456", "xyz789uvw012"],
        "affected_sectors": ["financial", "government"]
    }'::jsonb,
    false,
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'zero_day_exploit',
    'critical',
    'Zero-Day Exploit in Popular Web Framework',
    'A critical zero-day vulnerability has been discovered in a widely-used web framework. Active exploitation detected.',
    'Security Research Team',
    95,
    '{
        "systems": ["web_servers", "application_servers", "load_balancers"],
        "frameworks": ["Framework Version 2.1.3"],
        "cves": ["CVE-2024-XXXXX"]
    }'::jsonb,
    '{
        "immediate": [
            "Apply emergency patch immediately",
            "Isolate affected systems"
        ],
        "short_term": [
            "Monitor for exploitation attempts",
            "Implement additional WAF rules"
        ],
        "long_term": [
            "Review security development lifecycle",
            "Implement automated vulnerability scanning"
        ]
    }'::jsonb,
    '{
        "threat_actors": ["Unknown"],
        "attack_vectors": ["remote_code_execution", "web_application"],
        "indicators": ["CVE-2024-XXXXX", "Framework Version 2.1.3"],
        "signatures": ["exploit-signature-123"],
        "affected_sectors": ["technology", "ecommerce", "healthcare"]
    }'::jsonb,
    false,
    NOW() + INTERVAL '3 days',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'ransomware_campaign',
    'high',
    'New Ransomware Variant Targeting Healthcare',
    'A new ransomware variant specifically targeting healthcare organizations has been identified. Multiple hospitals affected.',
    'Healthcare ISAC',
    90,
    '{
        "systems": ["patient_records", "medical_devices", "network_infrastructure"],
        "file_extensions": [".healthlock", ".medencrypt"],
        "registry_keys": ["HKLM\\Software\\HealthLock"]
    }'::jsonb,
    '{
        "immediate": [
            "Backup critical systems immediately",
            "Isolate infected systems"
        ],
        "short_term": [
            "Review network segmentation",
            "Implement endpoint detection and response"
        ],
        "long_term": [
            "Enhance backup and recovery procedures",
            "Conduct security awareness training"
        ]
    }'::jsonb,
    '{
        "threat_actors": ["Unknown"],
        "attack_vectors": ["ransomware", "lateral_movement"],
        "indicators": ["Ransomware-Family-2024", "Healthcare-specific payload"],
        "network_indicators": ["malicious-c2-server.com"],
        "affected_sectors": ["healthcare", "pharmaceutical"]
    }'::jsonb,
    false,
    NOW() + INTERVAL '5 days',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'supply_chain_attack',
    'high',
    'Supply Chain Compromise in Popular NPM Package',
    'A popular NPM package has been compromised with malicious code. Over 1 million downloads affected.',
    'NPM Security Team',
    88,
    '{
        "systems": ["development_servers", "ci_cd_pipelines", "production_servers"],
        "packages": ["compromised-package@1.2.3"],
        "hashes": ["malicious-hash-123"]
    }'::jsonb,
    '{
        "immediate": [
            "Audit all NPM dependencies",
            "Remove compromised package"
        ],
        "short_term": [
            "Implement package integrity verification",
            "Update to clean package versions"
        ],
        "long_term": [
            "Implement software supply chain security",
            "Regular dependency audits"
        ]
    }'::jsonb,
    '{
        "threat_actors": ["Unknown"],
        "attack_vectors": ["supply_chain", "dependency_confusion"],
        "indicators": ["package-name@1.2.3", "Malicious payload in dependencies"],
        "domains": ["malicious-cdn.com"],
        "affected_sectors": ["technology", "software_development"]
    }'::jsonb,
    false,
    NOW() + INTERVAL '10 days',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'insider_threat',
    'medium',
    'Suspicious Data Access Patterns Detected',
    'Unusual data access patterns detected from internal user account. Potential insider threat activity.',
    'Internal Security Monitoring',
    75,
    '{
        "systems": ["file_servers", "database_servers", "user_workstations"],
        "user_accounts": ["suspicious-user@company.com"],
        "file_paths": ["/sensitive/data/"]
    }'::jsonb,
    '{
        "immediate": [
            "Review user access logs",
            "Temporarily restrict user access"
        ],
        "short_term": [
            "Implement additional monitoring",
            "Conduct security awareness training"
        ],
        "long_term": [
            "Implement user behavior analytics",
            "Review access control policies"
        ]
    }'::jsonb,
    '{
        "threat_actors": ["Insider"],
        "attack_vectors": ["privilege_abuse", "data_exfiltration"],
        "indicators": ["Unusual access hours", "Bulk data downloads"],
        "access_times": ["2024-01-15T02:00:00Z"],
        "affected_sectors": ["all"]
    }'::jsonb,
    false,
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'botnet_activity',
    'medium',
    'IoT Botnet Targeting Smart Home Devices',
    'New IoT botnet discovered targeting smart home devices. Over 10,000 devices compromised globally.',
    'IoT Security Research',
    82,
    '{
        "systems": ["smart_cameras", "routers", "smart_tvs", "iot_devices"],
        "device_types": ["smart_cameras", "routers", "smart_tvs"],
        "ports": [8080, 9999]
    }'::jsonb,
    '{
        "immediate": [
            "Update IoT device firmware",
            "Change default passwords"
        ],
        "short_term": [
            "Implement network segmentation",
            "Monitor network traffic"
        ],
        "long_term": [
            "Implement IoT security framework",
            "Regular security assessments"
        ]
    }'::jsonb,
    '{
        "threat_actors": ["Unknown"],
        "attack_vectors": ["device_compromise", "ddos"],
        "indicators": ["IoT-Botnet-2024", "Smart device compromise"],
        "c2_servers": ["botnet-c2-1.com", "botnet-c2-2.com"],
        "affected_sectors": ["consumer_electronics", "smart_home"]
    }'::jsonb,
    false,
    NOW() + INTERVAL '21 days',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'cryptocurrency_mining',
    'low',
    'Cryptocurrency Mining Malware in Corporate Networks',
    'Cryptocurrency mining malware detected in corporate networks. Significant CPU usage and performance degradation.',
    'Corporate Security Team',
    78,
    '{
        "systems": ["workstations", "servers", "network_infrastructure"],
        "processes": ["xmrig.exe", "miner.exe"],
        "mining_pools": ["pool.example.com:4444"]
    }'::jsonb,
    '{
        "immediate": [
            "Scan for and remove mining malware",
            "Monitor CPU usage patterns"
        ],
        "short_term": [
            "Implement application whitelisting",
            "Update endpoint protection"
        ],
        "long_term": [
            "Implement network monitoring",
            "Regular security assessments"
        ]
    }'::jsonb,
    '{
        "threat_actors": ["Unknown"],
        "attack_vectors": ["malware", "resource_abuse"],
        "indicators": ["CryptoMiner-2024", "High CPU usage"],
        "wallets": ["crypto-wallet-address-123"],
        "affected_sectors": ["corporate", "education"]
    }'::jsonb,
    true,
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'threat_actor_activity',
    'critical',
    'Lazarus Group Targeting Cryptocurrency Exchanges',
    'Lazarus Group has launched a new campaign targeting cryptocurrency exchanges and DeFi platforms. Multiple sophisticated attacks detected.',
    'Cryptocurrency Security Alliance',
    92,
    '{
        "systems": ["crypto_exchanges", "defi_platforms", "wallet_services"],
        "domains": ["lazarus-crypto-domains.com"],
        "wallets": ["lazarus-btc-wallet-123"]
    }'::jsonb,
    '{
        "immediate": [
            "Implement additional transaction monitoring",
            "Review smart contract security"
        ],
        "short_term": [
            "Enhance multi-signature requirements",
            "Implement behavioral analytics"
        ],
        "long_term": [
            "Develop threat intelligence sharing",
            "Implement advanced fraud detection"
        ]
    }'::jsonb,
    '{
        "threat_actors": ["Lazarus Group"],
        "attack_vectors": ["social_engineering", "smart_contract_exploits"],
        "indicators": ["Lazarus-Crypto-2024", "DeFi targeting"],
        "techniques": ["spear_phishing", "smart_contract_manipulation"],
        "affected_sectors": ["cryptocurrency", "defi", "financial"]
    }'::jsonb,
    false,
    NOW() + INTERVAL '5 days',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'financial_crime',
    'high',
    'FIN7 POS Malware Campaign Resurgence',
    'FIN7 has resumed their POS malware campaigns with new techniques targeting retail and restaurant chains.',
    'Financial Crime Intelligence',
    87,
    '{
        "systems": ["pos_terminals", "payment_processors", "retail_networks"],
        "malware_families": ["FIN7-POS-2024"],
        "card_shops": ["JokerStash", "Cardplanet"]
    }'::jsonb,
    '{
        "immediate": [
            "Scan POS systems for malware",
            "Review payment processing security"
        ],
        "short_term": [
            "Implement POS security monitoring",
            "Update payment card security"
        ],
        "long_term": [
            "Implement end-to-end encryption",
            "Regular security assessments"
        ]
    }'::jsonb,
    '{
        "threat_actors": ["FIN7"],
        "attack_vectors": ["pos_malware", "card_skimming"],
        "indicators": ["FIN7-POS-2024", "Card skimming tools"],
        "techniques": ["memory_scraping", "network_interception"],
        "affected_sectors": ["retail", "restaurant", "hospitality"]
    }'::jsonb,
    false,
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'cloud_security',
    'high',
    'Cloud Infrastructure Compromise via Misconfigured APIs',
    'Multiple organizations have experienced cloud infrastructure compromises due to misconfigured APIs and exposed credentials.',
    'Cloud Security Alliance',
    89,
    '{
        "systems": ["cloud_storage", "api_gateways", "container_registries"],
        "cloud_providers": ["AWS", "Azure", "GCP"],
        "services": ["S3", "Blob Storage", "Cloud Storage"]
    }'::jsonb,
    '{
        "immediate": [
            "Audit cloud API configurations",
            "Review exposed credentials"
        ],
        "short_term": [
            "Implement cloud security monitoring",
            "Update access control policies"
        ],
        "long_term": [
            "Implement cloud security framework",
            "Regular security assessments"
        ]
    }'::jsonb,
    '{
        "threat_actors": ["Unknown"],
        "attack_vectors": ["api_misconfiguration", "credential_exposure"],
        "indicators": ["Exposed APIs", "Misconfigured permissions"],
        "techniques": ["credential_harvesting", "data_exfiltration"],
        "affected_sectors": ["technology", "cloud_services", "all"]
    }'::jsonb,
    false,
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW()
);

-- Verify the data was inserted
SELECT 
    type,
    severity,
    title,
    acknowledged,
    expires_at,
    created_at
FROM intelligence_alerts 
ORDER BY created_at DESC;

-- Show summary statistics
SELECT 
    type,
    severity,
    acknowledged,
    COUNT(*) as count
FROM intelligence_alerts 
GROUP BY type, severity, acknowledged
ORDER BY type, severity;