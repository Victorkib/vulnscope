import { getDatabase } from '../lib/mongodb';
import { vulnerabilityProcessor } from '../lib/vulnerability-processor';
import type { Vulnerability } from '../types/vulnerability';

const generateDateRange = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Helper functions for enhanced vulnerability data
const generateCategory = (tags: string[]) => {
  if (tags.includes('rce')) return 'Remote Code Execution';
  if (tags.includes('sql-injection')) return 'SQL Injection';
  if (tags.includes('xss')) return 'Cross-Site Scripting';
  if (tags.includes('buffer-overflow')) return 'Buffer Overflow';
  if (tags.includes('auth-bypass')) return 'Authentication Bypass';
  if (tags.includes('privilege-escalation')) return 'Privilege Escalation';
  if (tags.includes('directory-traversal')) return 'Directory Traversal';
  if (tags.includes('csrf')) return 'Cross-Site Request Forgery';
  if (tags.includes('information-disclosure')) return 'Information Disclosure';
  if (tags.includes('command-injection')) return 'Command Injection';
  if (tags.includes('container-escape')) return 'Container Escape';
  if (tags.includes('request-smuggling')) return 'HTTP Request Smuggling';
  if (tags.includes('dom-xss')) return 'DOM-based XSS';
  if (tags.includes('nosql-injection')) return 'NoSQL Injection';
  return 'Other';
};

const generateExploitMaturity = (exploitAvailable: boolean, exploitUrls?: string[]) => {
  if (!exploitAvailable) return 'UNPROVEN';
  if (exploitUrls && exploitUrls.length > 0) return 'FUNCTIONAL';
  return 'PROOF_OF_CONCEPT';
};

const generateEPSSData = (severity: string, exploitAvailable: boolean) => {
  const baseScore = severity === 'CRITICAL' ? 0.08 : severity === 'HIGH' ? 0.05 : 0.02;
  const exploitBonus = exploitAvailable ? 0.03 : 0;
  return {
    epssScore: Math.min(0.1, baseScore + exploitBonus + Math.random() * 0.02),
    epssPercentile: Math.floor(Math.random() * 100),
  };
};

const generateFlags = (severity: string, exploitAvailable: boolean) => ({
  kev: severity === 'CRITICAL' && exploitAvailable,
  trending: Math.random() > 0.85, // 15% chance of trending
});

const generateThreatIntelligence = (severity: string, exploitAvailable: boolean, tags: string[]) => ({
  exploitInTheWild: exploitAvailable && Math.random() > 0.7,
  malwareFamilies: exploitAvailable && severity === 'CRITICAL' ? ['Generic', 'APT'] : [],
  threatActors: severity === 'CRITICAL' ? ['APT Groups', 'Cybercriminals'] : [],
  campaigns: Math.random() > 0.8 ? ['Active Campaigns', 'Targeted Attacks'] : [],
});

const generateMitigations = (tags: string[], patchAvailable: boolean) => {
  const mitigations = [];
  
  if (patchAvailable) {
    mitigations.push('Apply vendor patches immediately');
  }
  
  if (tags.includes('rce')) {
    mitigations.push('Implement network segmentation');
    mitigations.push('Use application firewalls');
    mitigations.push('Restrict network access to affected services');
  }
  
  if (tags.includes('xss') || tags.includes('dom-xss')) {
    mitigations.push('Implement Content Security Policy (CSP)');
    mitigations.push('Sanitize and validate all user input');
    mitigations.push('Use output encoding for dynamic content');
  }
  
  if (tags.includes('sql-injection') || tags.includes('nosql-injection')) {
    mitigations.push('Use parameterized queries');
    mitigations.push('Implement input validation and sanitization');
    mitigations.push('Apply principle of least privilege to database accounts');
  }
  
  if (tags.includes('auth-bypass')) {
    mitigations.push('Implement multi-factor authentication');
    mitigations.push('Review and strengthen authentication mechanisms');
    mitigations.push('Monitor for suspicious authentication attempts');
  }
  
  if (tags.includes('privilege-escalation')) {
    mitigations.push('Implement principle of least privilege');
    mitigations.push('Regular privilege audits and reviews');
    mitigations.push('Use privilege separation techniques');
  }
  
  if (tags.includes('directory-traversal')) {
    mitigations.push('Validate and sanitize file paths');
    mitigations.push('Use chroot jails or containerization');
    mitigations.push('Implement proper access controls');
  }
  
  if (tags.includes('csrf')) {
    mitigations.push('Implement CSRF tokens');
    mitigations.push('Use SameSite cookie attributes');
    mitigations.push('Validate origin headers');
  }
  
  if (tags.includes('buffer-overflow')) {
    mitigations.push('Enable stack canaries and ASLR');
    mitigations.push('Use memory-safe programming languages');
    mitigations.push('Implement bounds checking');
  }
  
  if (tags.includes('container-escape')) {
    mitigations.push('Run containers with minimal privileges');
    mitigations.push('Use read-only root filesystems');
    mitigations.push('Implement network segmentation');
  }
  
  return mitigations;
};

const generateWorkarounds = (tags: string[], affectedSoftware: string[]) => {
  const workarounds = [];
  
  if (tags.includes('rce')) {
    workarounds.push('Disable affected modules or services');
    workarounds.push('Implement temporary access controls');
  }
  
  if (tags.includes('xss')) {
    workarounds.push('Disable JavaScript execution where possible');
    workarounds.push('Use browser security extensions');
  }
  
  if (tags.includes('sql-injection')) {
    workarounds.push('Temporarily disable affected database functions');
    workarounds.push('Implement additional input filtering');
  }
  
  if (affectedSoftware.some(sw => sw.toLowerCase().includes('apache'))) {
    workarounds.push('Use alternative web server temporarily');
  }
  
  if (affectedSoftware.some(sw => sw.toLowerCase().includes('wordpress'))) {
    workarounds.push('Disable affected plugins or themes');
  }
  
  return workarounds;
};

const generateRelatedCVEs = (cweId: string, affectedSoftware: string[]) => {
  const related = [];
  
  if (cweId === 'CWE-78') {
    related.push('CVE-2023-1234', 'CVE-2023-5678');
  } else if (cweId === 'CWE-89') {
    related.push('CVE-2023-2345', 'CVE-2023-6789');
  } else if (cweId === 'CWE-79') {
    related.push('CVE-2023-3456', 'CVE-2023-7890');
  }
  
  return related;
};

const vulnerabilities: Omit<Vulnerability, '_id'>[] = [
  // Critical Vulnerabilities
  {
    cveId: 'CVE-2024-0001',
    title: 'Remote Code Execution in Apache HTTP Server',
    description:
      'A critical vulnerability in Apache HTTP Server allows remote attackers to execute arbitrary code through malformed HTTP requests. This vulnerability affects the core request processing module and can be exploited without authentication. The flaw exists in the mod_rewrite module where improper input validation leads to buffer overflow conditions.',
    severity: 'CRITICAL',
    cvssScore: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-78',
    publishedDate: generateDateRange(5),
    lastModifiedDate: generateDateRange(4),
    source: 'NVD',
    references: [
      'https://httpd.apache.org/security/vulnerabilities_24.html',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0001',
      'https://www.exploit-db.com/exploits/51234',
    ],
    affectedSoftware: [
      'Apache HTTP Server 2.4.0-2.4.58',
      'Apache HTTP Server 2.2.0-2.2.34',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['rce', 'apache', 'web-server', 'critical'],
    category: 'Remote Code Execution',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.089,
    epssPercentile: 95,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT'],
      threatActors: ['APT Groups', 'Cybercriminals'],
      campaigns: ['Active Campaigns'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement network segmentation',
      'Use application firewalls',
      'Restrict network access to affected services',
    ],
    workarounds: [
      'Disable affected modules or services',
      'Implement temporary access controls',
      'Use alternative web server temporarily',
    ],
    relatedCves: ['CVE-2023-1234', 'CVE-2023-5678'],
    createdAt: generateDateRange(5),
    updatedAt: generateDateRange(4),
  },
  {
    cveId: 'CVE-2024-0002',
    title: 'SQL Injection in WordPress Core',
    description:
      'A SQL injection vulnerability exists in WordPress core that allows authenticated users with contributor-level permissions to execute arbitrary SQL commands. The vulnerability is present in the post meta handling functionality and affects the wp_postmeta table operations.',
    severity: 'HIGH',
    cvssScore: 8.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-89',
    publishedDate: generateDateRange(7),
    lastModifiedDate: generateDateRange(6),
    source: 'NVD',
    references: [
      'https://wordpress.org/news/2024/01/wordpress-6-4-3-security-release/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0002',
    ],
    affectedSoftware: ['WordPress 6.0-6.4.2', 'WordPress Multisite'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['sql-injection', 'wordpress', 'cms', 'authenticated'],
    category: 'SQL Injection',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.052,
    epssPercentile: 78,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Use parameterized queries',
      'Implement input validation and sanitization',
      'Apply principle of least privilege to database accounts',
    ],
    workarounds: [
      'Temporarily disable affected database functions',
      'Implement additional input filtering',
      'Disable affected plugins or themes',
    ],
    relatedCves: ['CVE-2023-2345', 'CVE-2023-6789'],
    createdAt: generateDateRange(7),
    updatedAt: generateDateRange(6),
  },
  {
    cveId: 'CVE-2024-0003',
    title: 'Cross-Site Scripting (XSS) in React Router',
    description:
      'A stored cross-site scripting vulnerability in React Router allows attackers to inject malicious scripts through URL parameters. The vulnerability affects the history handling mechanism and can lead to session hijacking and data theft.',
    severity: 'MEDIUM',
    cvssScore: 6.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',
    cweId: 'CWE-79',
    publishedDate: generateDateRange(10),
    lastModifiedDate: generateDateRange(9),
    source: 'GITHUB',
    references: [
      'https://github.com/remix-run/react-router/security/advisories/GHSA-xxxx-xxxx-xxxx',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0003',
    ],
    affectedSoftware: ['React Router 6.0.0-6.8.0', 'React Router DOM'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'REQUIRED',
    scope: 'CHANGED',
    confidentialityImpact: 'LOW',
    integrityImpact: 'LOW',
    availabilityImpact: 'NONE',
    tags: ['xss', 'react', 'frontend', 'client-side'],
    category: 'Cross-Site Scripting',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.023,
    epssPercentile: 45,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement Content Security Policy (CSP)',
      'Sanitize and validate all user input',
      'Use output encoding for dynamic content',
    ],
    workarounds: [
      'Disable JavaScript execution where possible',
      'Use browser security extensions',
    ],
    relatedCves: ['CVE-2023-3456', 'CVE-2023-7890'],
    createdAt: generateDateRange(10),
    updatedAt: generateDateRange(9),
  },
  {
    cveId: 'CVE-2024-0004',
    title: 'Buffer Overflow in OpenSSL Certificate Parsing',
    description:
      "A buffer overflow vulnerability in OpenSSL's certificate parsing functionality allows remote attackers to cause denial of service or potentially execute arbitrary code. The vulnerability occurs when processing malformed X.509 certificates with oversized extension fields.",
    severity: 'HIGH',
    cvssScore: 7.5,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H',
    cweId: 'CWE-120',
    publishedDate: generateDateRange(12),
    lastModifiedDate: generateDateRange(11),
    source: 'NVD',
    references: [
      'https://www.openssl.org/news/secadv/20240112.txt',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0004',
    ],
    affectedSoftware: ['OpenSSL 3.0.0-3.0.12', 'OpenSSL 1.1.1-1.1.1w'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'NONE',
    integrityImpact: 'NONE',
    availabilityImpact: 'HIGH',
    tags: ['buffer-overflow', 'openssl', 'crypto', 'certificate'],
    category: 'Buffer Overflow',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.051,
    epssPercentile: 72,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Enable stack canaries and ASLR',
      'Use memory-safe programming languages',
      'Implement bounds checking',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(12),
    updatedAt: generateDateRange(11),
  },
  {
    cveId: 'CVE-2024-0005',
    title: 'Authentication Bypass in Django Admin',
    description:
      "An authentication bypass vulnerability in Django's admin interface allows attackers to gain unauthorized access to administrative functions. The vulnerability affects the password reset functionality and can be exploited through timing attacks on the token validation process.",
    severity: 'HIGH',
    cvssScore: 8.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-287',
    publishedDate: generateDateRange(15),
    lastModifiedDate: generateDateRange(14),
    source: 'NVD',
    references: [
      'https://www.djangoproject.com/weblog/2024/jan/11/security-releases/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0005',
    ],
    affectedSoftware: ['Django 4.0-4.2.8', 'Django 3.2-3.2.23'],
    attackVector: 'NETWORK',
    attackComplexity: 'HIGH',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['auth-bypass', 'django', 'python', 'admin'],
    category: 'Authentication Bypass',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.048,
    epssPercentile: 65,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement multi-factor authentication',
      'Review and strengthen authentication mechanisms',
      'Monitor for suspicious authentication attempts',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(15),
    updatedAt: generateDateRange(14),
  },
  {
    cveId: 'CVE-2024-0006',
    title: 'Directory Traversal in Node.js Express Static Middleware',
    description:
      'A directory traversal vulnerability in Express.js static file serving middleware allows attackers to access files outside the intended directory. This can lead to exposure of sensitive system files, application source code, and configuration files containing secrets.',
    severity: 'MEDIUM',
    cvssScore: 5.3,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',
    cweId: 'CWE-22',
    publishedDate: generateDateRange(18),
    lastModifiedDate: generateDateRange(17),
    source: 'GITHUB',
    references: [
      'https://github.com/expressjs/express/security/advisories/GHSA-yyyy-yyyy-yyyy',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0006',
    ],
    affectedSoftware: ['Express.js 4.0.0-4.18.2', 'Express Static Middleware'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'LOW',
    integrityImpact: 'NONE',
    availabilityImpact: 'NONE',
    tags: ['directory-traversal', 'express', 'nodejs', 'path-traversal'],
    category: 'Directory Traversal',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.045,
    epssPercentile: 55,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic'],
      threatActors: ['Cybercriminals'],
      campaigns: ['Active Campaigns'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Validate and sanitize file paths',
      'Use chroot jails or containerization',
      'Implement proper access controls',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(18),
    updatedAt: generateDateRange(17),
  },
  {
    cveId: 'CVE-2024-0007',
    title: 'Privilege Escalation in Linux Kernel Netfilter',
    description:
      "A privilege escalation vulnerability in the Linux kernel's netfilter subsystem allows local users to gain root privileges. The vulnerability is caused by improper validation of user-supplied data in iptables rule processing, leading to kernel memory corruption.",
    severity: 'HIGH',
    cvssScore: 7.8,
    cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-269',
    publishedDate: generateDateRange(20),
    lastModifiedDate: generateDateRange(19),
    source: 'NVD',
    references: [
      'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=abcd1234',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0007',
    ],
    affectedSoftware: [
      'Linux Kernel 5.15-6.6.8',
      'Ubuntu Linux',
      'Red Hat Enterprise Linux',
    ],
    attackVector: 'LOCAL',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['privilege-escalation', 'linux', 'kernel', 'netfilter'],
    category: 'Privilege Escalation',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.058,
    epssPercentile: 68,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement principle of least privilege',
      'Regular privilege audits and reviews',
      'Use privilege separation techniques',
    ],
    workarounds: [
      'Restrict iptables rule creation',
      'Implement additional access controls',
    ],
    relatedCves: [],
    createdAt: generateDateRange(20),
    updatedAt: generateDateRange(19),
  },
  {
    cveId: 'CVE-2024-0008',
    title: 'Information Disclosure in MySQL Query Optimizer',
    description:
      "An information disclosure vulnerability in MySQL Server allows authenticated users to access sensitive data from other databases. The vulnerability affects the query optimizer's handling of subqueries and can be exploited through specially crafted SQL queries.",
    severity: 'MEDIUM',
    cvssScore: 4.3,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N',
    cweId: 'CWE-200',
    publishedDate: generateDateRange(22),
    lastModifiedDate: generateDateRange(21),
    source: 'NVD',
    references: [
      'https://dev.mysql.com/doc/relnotes/mysql/8.0/en/news-8-0-36.html',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0008',
    ],
    affectedSoftware: [
      'MySQL Server 8.0.0-8.0.35',
      'MySQL Server 5.7.0-5.7.44',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'LOW',
    integrityImpact: 'NONE',
    availabilityImpact: 'NONE',
    tags: ['info-disclosure', 'mysql', 'database', 'query-optimizer'],
    category: 'Information Disclosure',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.035,
    epssPercentile: 42,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement proper access controls',
      'Review and strengthen field-level security',
      'Monitor for suspicious search queries',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(22),
    updatedAt: generateDateRange(21),
  },
  {
    cveId: 'CVE-2024-0009',
    title: 'Cross-Site Request Forgery in Laravel Web Middleware',
    description:
      "A CSRF vulnerability in Laravel's web middleware allows attackers to perform unauthorized actions on behalf of authenticated users. The vulnerability bypasses CSRF token validation in certain edge cases involving file uploads and AJAX requests.",
    severity: 'MEDIUM',
    cvssScore: 6.5,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N',
    cweId: 'CWE-352',
    publishedDate: generateDateRange(25),
    lastModifiedDate: generateDateRange(24),
    source: 'GITHUB',
    references: [
      'https://github.com/laravel/framework/security/advisories/GHSA-zzzz-zzzz-zzzz',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0009',
    ],
    affectedSoftware: [
      'Laravel Framework 9.0-9.52.16',
      'Laravel Framework 10.0-10.43.0',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'REQUIRED',
    scope: 'UNCHANGED',
    confidentialityImpact: 'NONE',
    integrityImpact: 'HIGH',
    availabilityImpact: 'NONE',
    tags: ['csrf', 'laravel', 'php', 'web-middleware'],
    category: 'Cross-Site Request Forgery',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.042,
    epssPercentile: 52,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement CSRF tokens',
      'Use SameSite cookie attributes',
      'Validate origin headers',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(25),
    updatedAt: generateDateRange(24),
  },
  {
    cveId: 'CVE-2024-0010',
    title: 'Remote Code Execution in Jenkins Script Console',
    description:
      'A critical remote code execution vulnerability in Jenkins allows unauthenticated attackers to execute arbitrary code on the Jenkins server. The vulnerability is present in the script console functionality and can be exploited through crafted HTTP requests that bypass authentication checks.',
    severity: 'CRITICAL',
    cvssScore: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-94',
    publishedDate: generateDateRange(28),
    lastModifiedDate: generateDateRange(27),
    source: 'NVD',
    references: [
      'https://www.jenkins.io/security/advisory/2024-01-06/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0010',
    ],
    affectedSoftware: ['Jenkins 2.400-2.441', 'Jenkins LTS 2.401.1-2.426.2'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['rce', 'jenkins', 'ci-cd', 'script-console'],
    category: 'Remote Code Execution',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.088,
    epssPercentile: 94,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT'],
      threatActors: ['APT Groups', 'Cybercriminals'],
      campaigns: ['Active Campaigns', 'Targeted Attacks'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement network segmentation',
      'Use application firewalls',
      'Restrict network access to affected services',
    ],
    workarounds: [
      'Disable affected modules or services',
      'Implement temporary access controls',
    ],
    relatedCves: ['CVE-2023-1234', 'CVE-2023-5678'],
    createdAt: generateDateRange(28),
    updatedAt: generateDateRange(27),
  },
  // Additional vulnerabilities for more comprehensive data
  {
    cveId: 'CVE-2024-0011',
    title: 'Docker Container Escape via Runtime Vulnerability',
    description:
      "A container escape vulnerability in Docker runtime allows attackers to break out of container isolation and access the host system. The vulnerability affects the container runtime's handling of privileged operations and can be exploited through malicious container images.",
    severity: 'CRITICAL',
    cvssScore: 9.3,
    cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H',
    cweId: 'CWE-269',
    publishedDate: generateDateRange(30),
    lastModifiedDate: generateDateRange(29),
    source: 'NVD',
    references: [
      'https://docs.docker.com/engine/security/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0011',
    ],
    affectedSoftware: ['Docker Engine 20.10.0-24.0.7', 'Docker Desktop'],
    attackVector: 'LOCAL',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'CHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['container-escape', 'docker', 'runtime', 'privilege-escalation'],
    category: 'Container Escape',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.082,
    epssPercentile: 90,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT'],
      threatActors: ['APT Groups', 'Cybercriminals'],
      campaigns: ['Active Campaigns', 'Container Attacks'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Run containers with minimal privileges',
      'Use read-only root filesystems',
      'Implement network segmentation',
    ],
    workarounds: [
      'Restrict container operations',
      'Implement additional access controls',
    ],
    relatedCves: [],
    createdAt: generateDateRange(30),
    updatedAt: generateDateRange(29),
  },
  {
    cveId: 'CVE-2024-0012',
    title: 'Kubernetes API Server Authentication Bypass',
    description:
      'An authentication bypass vulnerability in Kubernetes API server allows unauthenticated attackers to access cluster resources. The vulnerability affects the RBAC authorization mechanism and can be exploited through specially crafted API requests.',
    severity: 'CRITICAL',
    cvssScore: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-287',
    publishedDate: generateDateRange(32),
    lastModifiedDate: generateDateRange(31),
    source: 'NVD',
    references: [
      'https://kubernetes.io/docs/reference/issues-security/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0012',
    ],
    affectedSoftware: [
      'Kubernetes 1.25.0-1.28.4',
      'OpenShift Container Platform',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['authentication-bypass', 'kubernetes', 'api-server', 'rbac'],
    category: 'Authentication Bypass',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.095,
    epssPercentile: 98,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT'],
      threatActors: ['APT Groups', 'Cybercriminals'],
      campaigns: ['Active Campaigns', 'Kubernetes Attacks'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement multi-factor authentication',
      'Review and strengthen authentication mechanisms',
      'Monitor for suspicious authentication attempts',
    ],
    workarounds: [
      'Implement additional access controls',
    ],
    relatedCves: [],
    createdAt: generateDateRange(32),
    updatedAt: generateDateRange(31),
  },
  {
    cveId: 'CVE-2024-0013',
    title: 'MongoDB NoSQL Injection in Aggregation Pipeline',
    description:
      'A NoSQL injection vulnerability in MongoDB allows attackers to manipulate aggregation pipeline queries and access unauthorized data. The vulnerability affects applications that construct aggregation pipelines using unsanitized user input.',
    severity: 'HIGH',
    cvssScore: 8.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N',
    cweId: 'CWE-943',
    publishedDate: generateDateRange(35),
    lastModifiedDate: generateDateRange(34),
    source: 'NVD',
    references: [
      'https://www.mongodb.com/docs/manual/security/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0013',
    ],
    affectedSoftware: ['MongoDB Server 4.4.0-7.0.4', 'MongoDB Atlas'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'NONE',
    tags: ['nosql-injection', 'mongodb', 'aggregation', 'database'],
    category: 'NoSQL Injection',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.068,
    epssPercentile: 78,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Use parameterized queries',
      'Implement input validation and sanitization',
      'Apply principle of least privilege to database accounts',
    ],
    workarounds: [
      'Temporarily disable affected database functions',
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(35),
    updatedAt: generateDateRange(34),
  },
  {
    cveId: 'CVE-2024-0014',
    title: 'Elasticsearch Information Disclosure via Search API',
    description:
      "An information disclosure vulnerability in Elasticsearch allows unauthorized users to access sensitive data through malformed search queries. The vulnerability affects the search API's handling of field-level security and can bypass access controls.",
    severity: 'MEDIUM',
    cvssScore: 6.2,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N',
    cweId: 'CWE-200',
    publishedDate: generateDateRange(38),
    lastModifiedDate: generateDateRange(37),
    source: 'NVD',
    references: [
      'https://www.elastic.co/community/security',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0014',
    ],
    affectedSoftware: ['Elasticsearch 7.0.0-8.11.3', 'Elastic Cloud'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'NONE',
    availabilityImpact: 'NONE',
    tags: [
      'information-disclosure',
      'elasticsearch',
      'search-api',
      'access-control',
    ],
    category: 'Information Disclosure',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.052,
    epssPercentile: 62,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement proper access controls',
      'Review and strengthen field-level security',
      'Monitor for suspicious search queries',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(38),
    updatedAt: generateDateRange(37),
  },
  {
    cveId: 'CVE-2024-0015',
    title: 'Redis Command Injection via Lua Scripts',
    description:
      'A command injection vulnerability in Redis allows attackers to execute arbitrary Redis commands through malformed Lua scripts. The vulnerability affects the EVAL and EVALSHA commands and can lead to data manipulation and server compromise.',
    severity: 'HIGH',
    cvssScore: 8.4,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-77',
    publishedDate: generateDateRange(40),
    lastModifiedDate: generateDateRange(39),
    source: 'NVD',
    references: [
      'https://redis.io/docs/security/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0015',
    ],
    affectedSoftware: ['Redis 6.0.0-7.2.3', 'Redis Enterprise'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['command-injection', 'redis', 'lua-scripts', 'eval'],
    category: 'Command Injection',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.071,
    epssPercentile: 82,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement network segmentation',
      'Use application firewalls',
      'Restrict network access to affected services',
    ],
    workarounds: [
      'Disable affected modules or services',
      'Implement temporary access controls',
    ],
    relatedCves: [],
    createdAt: generateDateRange(40),
    updatedAt: generateDateRange(39),
  },
  {
    cveId: 'CVE-2024-0016',
    title: 'PostgreSQL Buffer Overflow in Query Parser',
    description:
      "A buffer overflow vulnerability in PostgreSQL's query parser allows attackers to cause denial of service or potentially execute arbitrary code. The vulnerability occurs when processing complex SQL queries with deeply nested expressions.",
    severity: 'HIGH',
    cvssScore: 7.6,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:H',
    cweId: 'CWE-120',
    publishedDate: generateDateRange(42),
    lastModifiedDate: generateDateRange(41),
    source: 'NVD',
    references: [
      'https://www.postgresql.org/support/security/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0016',
    ],
    affectedSoftware: ['PostgreSQL 12.0-16.1', 'Amazon RDS PostgreSQL'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'LOW',
    integrityImpact: 'LOW',
    availabilityImpact: 'HIGH',
    tags: ['buffer-overflow', 'postgresql', 'query-parser', 'sql'],
    category: 'Buffer Overflow',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.065,
    epssPercentile: 75,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Enable stack canaries and ASLR',
      'Use memory-safe programming languages',
      'Implement bounds checking',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(42),
    updatedAt: generateDateRange(41),
  },
  {
    cveId: 'CVE-2024-0017',
    title: 'Nginx HTTP Request Smuggling via Transfer-Encoding',
    description:
      'An HTTP request smuggling vulnerability in Nginx allows attackers to bypass security controls and access restricted resources. The vulnerability affects the handling of Transfer-Encoding headers in proxy configurations.',
    severity: 'MEDIUM',
    cvssScore: 6.5,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N',
    cweId: 'CWE-444',
    publishedDate: generateDateRange(45),
    lastModifiedDate: generateDateRange(44),
    source: 'NVD',
    references: [
      'https://nginx.org/en/security_advisories.html',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0017',
    ],
    affectedSoftware: ['Nginx 1.20.0-1.25.3', 'Nginx Plus'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'LOW',
    integrityImpact: 'LOW',
    availabilityImpact: 'NONE',
    tags: ['request-smuggling', 'nginx', 'http', 'proxy'],
    category: 'HTTP Request Smuggling',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.055,
    epssPercentile: 65,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic'],
      threatActors: ['Cybercriminals'],
      campaigns: ['Active Campaigns'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement proper HTTP header validation',
      'Use secure proxy configurations',
      'Monitor for suspicious HTTP requests',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(45),
    updatedAt: generateDateRange(44),
  },
  {
    cveId: 'CVE-2024-0018',
    title: 'Angular Cross-Site Request Forgery Bypass',
    description:
      "A CSRF vulnerability in Angular framework allows attackers to perform unauthorized actions on behalf of authenticated users. The vulnerability bypasses Angular's built-in CSRF protection through manipulation of HTTP headers.",
    severity: 'MEDIUM',
    cvssScore: 5.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',
    cweId: 'CWE-352',
    publishedDate: generateDateRange(48),
    lastModifiedDate: generateDateRange(47),
    source: 'GITHUB',
    references: [
      'https://angular.io/guide/security',
      'https://github.com/angular/angular/security/advisories',
    ],
    affectedSoftware: ['Angular 15.0.0-17.0.8', 'Angular CLI'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'REQUIRED',
    scope: 'CHANGED',
    confidentialityImpact: 'LOW',
    integrityImpact: 'LOW',
    availabilityImpact: 'NONE',
    tags: ['csrf', 'angular', 'frontend', 'http-headers'],
    category: 'Cross-Site Request Forgery',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.048,
    epssPercentile: 58,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement CSRF tokens',
      'Use SameSite cookie attributes',
      'Validate origin headers',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(48),
    updatedAt: generateDateRange(47),
  },
  {
    cveId: 'CVE-2024-0019',
    title: 'Spring Boot Actuator Information Disclosure',
    description:
      'An information disclosure vulnerability in Spring Boot Actuator endpoints allows unauthorized access to sensitive application information. The vulnerability affects the health and metrics endpoints when security is misconfigured.',
    severity: 'MEDIUM',
    cvssScore: 5.3,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',
    cweId: 'CWE-200',
    publishedDate: generateDateRange(50),
    lastModifiedDate: generateDateRange(49),
    source: 'NVD',
    references: [
      'https://spring.io/security/cve-2024-0019',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0019',
    ],
    affectedSoftware: ['Spring Boot 2.7.0-3.2.1', 'Spring Boot Actuator'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'LOW',
    integrityImpact: 'NONE',
    availabilityImpact: 'NONE',
    tags: ['information-disclosure', 'spring-boot', 'actuator', 'endpoints'],
    category: 'Information Disclosure',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.038,
    epssPercentile: 48,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement proper access controls',
      'Review and strengthen field-level security',
      'Monitor for suspicious search queries',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(50),
    updatedAt: generateDateRange(49),
  },
  {
    cveId: 'CVE-2024-0020',
    title: 'jQuery DOM-based Cross-Site Scripting',
    description:
      'A DOM-based cross-site scripting vulnerability in jQuery allows attackers to inject malicious scripts through DOM manipulation functions. The vulnerability affects applications using jQuery with untrusted HTML content.',
    severity: 'MEDIUM',
    cvssScore: 5.4,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N',
    cweId: 'CWE-79',
    publishedDate: generateDateRange(52),
    lastModifiedDate: generateDateRange(51),
    source: 'GITHUB',
    references: [
      'https://blog.jquery.com/2024/01/07/jquery-3-7-2-released/',
      'https://github.com/jquery/jquery/security/advisories',
    ],
    affectedSoftware: ['jQuery 3.0.0-3.7.1', 'jQuery UI'],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'REQUIRED',
    scope: 'UNCHANGED',
    confidentialityImpact: 'LOW',
    integrityImpact: 'LOW',
    availabilityImpact: 'NONE',
    tags: ['dom-xss', 'jquery', 'javascript', 'client-side'],
    category: 'DOM-based XSS',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.041,
    epssPercentile: 51,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement Content Security Policy (CSP)',
      'Sanitize and validate all user input',
      'Use output encoding for dynamic content',
    ],
    workarounds: [
      'Disable JavaScript execution where possible',
      'Use browser security extensions',
    ],
    relatedCves: [],
    createdAt: generateDateRange(52),
    updatedAt: generateDateRange(51),
  },
  // Adding more vulnerabilities for comprehensive testing
  {
    cveId: 'CVE-2024-0021',
    title: 'Microsoft Exchange Server Remote Code Execution',
    description:
      'A critical remote code execution vulnerability in Microsoft Exchange Server allows unauthenticated attackers to execute arbitrary code on the server. The vulnerability affects the Outlook Web Access (OWA) component and can be exploited through specially crafted email messages.',
    severity: 'CRITICAL',
    cvssScore: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-94',
    publishedDate: generateDateRange(55),
    lastModifiedDate: generateDateRange(54),
    source: 'NVD',
    references: [
      'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-0021',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0021',
    ],
    affectedSoftware: [
      'Microsoft Exchange Server 2019',
      'Microsoft Exchange Server 2016',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['rce', 'microsoft', 'exchange', 'email'],
    category: 'Remote Code Execution',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.092,
    epssPercentile: 96,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT'],
      threatActors: ['APT Groups', 'Cybercriminals'],
      campaigns: ['Active Campaigns', 'Email Attacks'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement network segmentation',
      'Use application firewalls',
      'Restrict network access to affected services',
    ],
    workarounds: [
      'Disable affected modules or services',
      'Implement temporary access controls',
    ],
    relatedCves: [],
    createdAt: generateDateRange(55),
    updatedAt: generateDateRange(54),
  },
  {
    cveId: 'CVE-2024-0022',
    title: 'VMware vCenter Server Authentication Bypass',
    description:
      'An authentication bypass vulnerability in VMware vCenter Server allows remote attackers to gain administrative access without valid credentials. The vulnerability affects the Single Sign-On (SSO) component and can be exploited through malformed SAML assertions.',
    severity: 'CRITICAL',
    cvssScore: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-287',
    publishedDate: generateDateRange(58),
    lastModifiedDate: generateDateRange(57),
    source: 'NVD',
    references: [
      'https://www.vmware.com/security/advisories/VMSA-2024-0001.html',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0022',
    ],
    affectedSoftware: [
      'VMware vCenter Server 7.0',
      'VMware vCenter Server 8.0',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['authentication-bypass', 'vmware', 'vcenter', 'sso'],
    category: 'Authentication Bypass',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.085,
    epssPercentile: 92,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement multi-factor authentication',
      'Review and strengthen authentication mechanisms',
      'Monitor for suspicious authentication attempts',
    ],
    workarounds: [
      'Implement additional access controls',
    ],
    relatedCves: [],
    createdAt: generateDateRange(58),
    updatedAt: generateDateRange(57),
  },
  {
    cveId: 'CVE-2024-0023',
    title: 'Citrix NetScaler ADC Code Injection',
    description:
      'A code injection vulnerability in Citrix NetScaler ADC allows authenticated users to execute arbitrary code on the appliance. The vulnerability affects the management interface and can be exploited through specially crafted configuration commands.',
    severity: 'HIGH',
    cvssScore: 8.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-94',
    publishedDate: generateDateRange(60),
    lastModifiedDate: generateDateRange(59),
    source: 'NVD',
    references: [
      'https://support.citrix.com/article/CTX561482',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0023',
    ],
    affectedSoftware: [
      'Citrix NetScaler ADC 13.0',
      'Citrix NetScaler ADC 13.1',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['code-injection', 'citrix', 'netscaler', 'adc'],
    category: 'Command Injection',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.075,
    epssPercentile: 85,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement network segmentation',
      'Use application firewalls',
      'Restrict network access to affected services',
    ],
    workarounds: [
      'Disable affected modules or services',
      'Implement temporary access controls',
    ],
    relatedCves: [],
    createdAt: generateDateRange(60),
    updatedAt: generateDateRange(59),
  },
  {
    cveId: 'CVE-2024-0024',
    title: 'Fortinet FortiOS SSL VPN Buffer Overflow',
    description:
      'A buffer overflow vulnerability in Fortinet FortiOS SSL VPN allows remote unauthenticated attackers to execute arbitrary code or cause denial of service. The vulnerability affects the SSL VPN web portal and can be exploited through malformed HTTP requests.',
    severity: 'CRITICAL',
    cvssScore: 9.3,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:L/I:L/A:H',
    cweId: 'CWE-120',
    publishedDate: generateDateRange(62),
    lastModifiedDate: generateDateRange(61),
    source: 'NVD',
    references: [
      'https://www.fortiguard.com/psirt/FG-IR-24-001',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0024',
    ],
    affectedSoftware: [
      'Fortinet FortiOS 7.0.0-7.0.13',
      'Fortinet FortiOS 7.2.0-7.2.6',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'CHANGED',
    confidentialityImpact: 'LOW',
    integrityImpact: 'LOW',
    availabilityImpact: 'HIGH',
    tags: ['buffer-overflow', 'fortinet', 'ssl-vpn', 'fortigate'],
    category: 'Buffer Overflow',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.088,
    epssPercentile: 94,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT'],
      threatActors: ['APT Groups', 'Cybercriminals'],
      campaigns: ['Active Campaigns', 'VPN Attacks'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Enable stack canaries and ASLR',
      'Use memory-safe programming languages',
      'Implement bounds checking',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(62),
    updatedAt: generateDateRange(61),
  },
  {
    cveId: 'CVE-2024-0025',
    title: 'Palo Alto Networks PAN-OS Command Injection',
    description:
      'A command injection vulnerability in Palo Alto Networks PAN-OS allows authenticated administrators to execute arbitrary OS commands on the firewall. The vulnerability affects the web-based management interface and can be exploited through crafted configuration parameters.',
    severity: 'HIGH',
    cvssScore: 7.2,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-78',
    publishedDate: generateDateRange(65),
    lastModifiedDate: generateDateRange(64),
    source: 'NVD',
    references: [
      'https://security.paloaltonetworks.com/CVE-2024-0025',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0025',
    ],
    affectedSoftware: [
      'Palo Alto Networks PAN-OS 10.2',
      'Palo Alto Networks PAN-OS 11.0',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'HIGH',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['command-injection', 'palo-alto', 'pan-os', 'firewall'],
    category: 'Command Injection',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.062,
    epssPercentile: 72,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement network segmentation',
      'Use application firewalls',
      'Restrict network access to affected services',
    ],
    workarounds: [
      'Disable affected modules or services',
      'Implement temporary access controls',
    ],
    relatedCves: [],
    createdAt: generateDateRange(65),
    updatedAt: generateDateRange(64),
  },
  
  // Additional Critical Vulnerabilities
  {
    cveId: 'CVE-2024-0026',
    title: 'Zero-Day Remote Code Execution in Microsoft Windows',
    description:
      'A critical zero-day vulnerability in Microsoft Windows allows remote attackers to execute arbitrary code with SYSTEM privileges. The vulnerability exists in the Windows Print Spooler service and can be exploited through specially crafted print jobs.',
    severity: 'CRITICAL',
    cvssScore: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-78',
    publishedDate: generateDateRange(2),
    lastModifiedDate: generateDateRange(1),
    source: 'NVD',
    references: [
      'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-0026',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0026',
    ],
    affectedSoftware: [
      'Microsoft Windows 10',
      'Microsoft Windows 11',
      'Microsoft Windows Server 2019',
      'Microsoft Windows Server 2022',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['rce', 'windows', 'zero-day', 'print-spooler'],
    category: 'Remote Code Execution',
    patchAvailable: false,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.095,
    epssPercentile: 98,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT', 'Ransomware'],
      threatActors: ['APT Groups', 'Cybercriminals', 'State Actors'],
      campaigns: ['Active Campaigns', 'Targeted Attacks', 'Mass Exploitation'],
    },
    mitigations: [
      'Disable Print Spooler service if not needed',
      'Implement network segmentation',
      'Use application firewalls',
      'Restrict network access to print services',
    ],
    workarounds: [
      'Disable affected services',
      'Implement temporary access controls',
      'Use alternative printing solutions',
    ],
    relatedCves: ['CVE-2021-1675', 'CVE-2021-34527'],
    createdAt: generateDateRange(2),
    updatedAt: generateDateRange(1),
  },

  {
    cveId: 'CVE-2024-0027',
    title: 'Critical Authentication Bypass in Cisco ASA Firewalls',
    description:
      'A critical authentication bypass vulnerability in Cisco Adaptive Security Appliance (ASA) allows unauthenticated attackers to gain administrative access to the firewall. The vulnerability affects the SSL VPN functionality and can be exploited through malformed authentication requests.',
    severity: 'CRITICAL',
    cvssScore: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-287',
    publishedDate: generateDateRange(3),
    lastModifiedDate: generateDateRange(2),
    source: 'NVD',
    references: [
      'https://tools.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-asa-auth-bypass-2024',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0027',
    ],
    affectedSoftware: [
      'Cisco ASA 9.0-9.20',
      'Cisco ASA 9.21-9.22',
      'Cisco Firepower Threat Defense (FTD)',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'NONE',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['auth-bypass', 'cisco', 'asa', 'firewall', 'ssl-vpn'],
    category: 'Authentication Bypass',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.092,
    epssPercentile: 96,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT'],
      threatActors: ['APT Groups', 'Cybercriminals'],
      campaigns: ['Active Campaigns', 'Targeted Attacks'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement multi-factor authentication',
      'Review and strengthen authentication mechanisms',
      'Monitor for suspicious authentication attempts',
    ],
    workarounds: [
      'Disable SSL VPN if not needed',
      'Implement additional access controls',
    ],
    relatedCves: ['CVE-2020-3452', 'CVE-2021-1609'],
    createdAt: generateDateRange(3),
    updatedAt: generateDateRange(2),
  },

  {
    cveId: 'CVE-2024-0028',
    title: 'Critical SQL Injection in Oracle Database',
    description:
      'A critical SQL injection vulnerability in Oracle Database allows authenticated users to execute arbitrary SQL commands with DBA privileges. The vulnerability exists in the Oracle Text component and can be exploited through specially crafted text search queries.',
    severity: 'CRITICAL',
    cvssScore: 9.6,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-89',
    publishedDate: generateDateRange(4),
    lastModifiedDate: generateDateRange(3),
    source: 'NVD',
    references: [
      'https://www.oracle.com/security-alerts/cpujan2024.html',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0028',
    ],
    affectedSoftware: [
      'Oracle Database 19c',
      'Oracle Database 21c',
      'Oracle Database 23c',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['sql-injection', 'oracle', 'database', 'oracle-text'],
    category: 'SQL Injection',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.088,
    epssPercentile: 94,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT'],
      threatActors: ['APT Groups', 'Cybercriminals'],
      campaigns: ['Active Campaigns', 'Data Theft'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Use parameterized queries',
      'Implement input validation and sanitization',
      'Apply principle of least privilege to database accounts',
    ],
    workarounds: [
      'Temporarily disable affected database functions',
      'Implement additional input filtering',
    ],
    relatedCves: ['CVE-2023-1234', 'CVE-2023-5678'],
    createdAt: generateDateRange(4),
    updatedAt: generateDateRange(3),
  },

  {
    cveId: 'CVE-2024-0029',
    title: 'Critical Buffer Overflow in Linux Kernel',
    description:
      'A critical buffer overflow vulnerability in the Linux kernel allows local attackers to gain root privileges. The vulnerability exists in the netfilter subsystem and can be exploited through specially crafted iptables rules.',
    severity: 'CRITICAL',
    cvssScore: 9.3,
    cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H',
    cweId: 'CWE-120',
    publishedDate: generateDateRange(6),
    lastModifiedDate: generateDateRange(5),
    source: 'NVD',
    references: [
      'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=abcd1234',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0029',
    ],
    affectedSoftware: [
      'Linux Kernel 5.15-6.6.8',
      'Ubuntu Linux 20.04 LTS',
      'Ubuntu Linux 22.04 LTS',
      'Red Hat Enterprise Linux 8',
      'Red Hat Enterprise Linux 9',
    ],
    attackVector: 'LOCAL',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'CHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['buffer-overflow', 'linux', 'kernel', 'netfilter', 'privilege-escalation'],
    category: 'Buffer Overflow',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.085,
    epssPercentile: 92,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT'],
      threatActors: ['APT Groups', 'Cybercriminals'],
      campaigns: ['Active Campaigns', 'Privilege Escalation'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Enable stack canaries and ASLR',
      'Use memory-safe programming languages',
      'Implement bounds checking',
    ],
    workarounds: [
      'Restrict iptables rule creation',
      'Implement additional access controls',
    ],
    relatedCves: ['CVE-2023-1234', 'CVE-2023-5678'],
    createdAt: generateDateRange(6),
    updatedAt: generateDateRange(5),
  },

  {
    cveId: 'CVE-2024-0030',
    title: 'Critical Cross-Site Scripting in GitHub Enterprise Server',
    description:
      'A critical stored cross-site scripting vulnerability in GitHub Enterprise Server allows attackers to execute arbitrary JavaScript code in the context of other users. The vulnerability exists in the issue and pull request comment functionality.',
    severity: 'CRITICAL',
    cvssScore: 9.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:H',
    cweId: 'CWE-79',
    publishedDate: generateDateRange(8),
    lastModifiedDate: generateDateRange(7),
    source: 'GITHUB',
    references: [
      'https://github.com/github/security-advisories/blob/main/advisories/GHSA-xxxx-xxxx-xxxx.md',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0030',
    ],
    affectedSoftware: [
      'GitHub Enterprise Server 3.8.0-3.8.15',
      'GitHub Enterprise Server 3.9.0-3.9.10',
      'GitHub Enterprise Server 3.10.0-3.10.5',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'REQUIRED',
    scope: 'CHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['xss', 'github', 'enterprise', 'stored-xss'],
    category: 'Cross-Site Scripting',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.082,
    epssPercentile: 90,
    kev: true,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic', 'APT'],
      threatActors: ['APT Groups', 'Cybercriminals'],
      campaigns: ['Active Campaigns', 'Code Repository Attacks'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement Content Security Policy (CSP)',
      'Sanitize and validate all user input',
      'Use output encoding for dynamic content',
    ],
    workarounds: [
      'Disable JavaScript execution where possible',
      'Use browser security extensions',
    ],
    relatedCves: ['CVE-2023-3456', 'CVE-2023-7890'],
    createdAt: generateDateRange(8),
    updatedAt: generateDateRange(7),
  },

  // High Severity Vulnerabilities
  {
    cveId: 'CVE-2024-0031',
    title: 'High Severity Command Injection in Jenkins',
    description:
      'A command injection vulnerability in Jenkins allows authenticated users with Job/Configure permission to execute arbitrary commands on the Jenkins controller. The vulnerability exists in the build step configuration and can be exploited through specially crafted build parameters.',
    severity: 'HIGH',
    cvssScore: 8.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-78',
    publishedDate: generateDateRange(10),
    lastModifiedDate: generateDateRange(9),
    source: 'NVD',
    references: [
      'https://www.jenkins.io/security/advisory/2024-01-15/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0031',
    ],
    affectedSoftware: [
      'Jenkins 2.400-2.441',
      'Jenkins LTS 2.401.1-2.426.2',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['command-injection', 'jenkins', 'ci-cd', 'build-system'],
    category: 'Command Injection',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.075,
    epssPercentile: 85,
    kev: false,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic'],
      threatActors: ['Cybercriminals'],
      campaigns: ['Active Campaigns'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement network segmentation',
      'Use application firewalls',
      'Restrict network access to affected services',
    ],
    workarounds: [
      'Disable affected modules or services',
      'Implement temporary access controls',
    ],
    relatedCves: ['CVE-2023-1234', 'CVE-2023-5678'],
    createdAt: generateDateRange(10),
    updatedAt: generateDateRange(9),
  },

  {
    cveId: 'CVE-2024-0032',
    title: 'High Severity NoSQL Injection in MongoDB',
    description:
      'A NoSQL injection vulnerability in MongoDB allows authenticated users to manipulate aggregation pipeline queries and access unauthorized data. The vulnerability affects applications that construct aggregation pipelines using unsanitized user input.',
    severity: 'HIGH',
    cvssScore: 8.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N',
    cweId: 'CWE-943',
    publishedDate: generateDateRange(12),
    lastModifiedDate: generateDateRange(11),
    source: 'NVD',
    references: [
      'https://www.mongodb.com/docs/manual/security/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0032',
    ],
    affectedSoftware: [
      'MongoDB Server 4.4.0-7.0.4',
      'MongoDB Atlas',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'NONE',
    tags: ['nosql-injection', 'mongodb', 'aggregation', 'database'],
    category: 'NoSQL Injection',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.068,
    epssPercentile: 78,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Use parameterized queries',
      'Implement input validation and sanitization',
      'Apply principle of least privilege to database accounts',
    ],
    workarounds: [
      'Temporarily disable affected database functions',
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(12),
    updatedAt: generateDateRange(11),
  },

  {
    cveId: 'CVE-2024-0033',
    title: 'High Severity Privilege Escalation in Docker Desktop',
    description:
      'A privilege escalation vulnerability in Docker Desktop allows local attackers to gain root privileges on the host system. The vulnerability exists in the Docker Desktop service and can be exploited through specially crafted container operations.',
    severity: 'HIGH',
    cvssScore: 7.8,
    cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-269',
    publishedDate: generateDateRange(14),
    lastModifiedDate: generateDateRange(13),
    source: 'NVD',
    references: [
      'https://docs.docker.com/desktop/release-notes/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0033',
    ],
    affectedSoftware: [
      'Docker Desktop 4.0.0-4.25.0',
      'Docker Desktop for Windows',
      'Docker Desktop for macOS',
    ],
    attackVector: 'LOCAL',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['privilege-escalation', 'docker', 'desktop', 'container'],
    category: 'Privilege Escalation',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.062,
    epssPercentile: 72,
    kev: false,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic'],
      threatActors: ['Cybercriminals'],
      campaigns: ['Active Campaigns'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement principle of least privilege',
      'Regular privilege audits and reviews',
      'Use privilege separation techniques',
    ],
    workarounds: [
      'Restrict container operations',
      'Implement additional access controls',
    ],
    relatedCves: [],
    createdAt: generateDateRange(14),
    updatedAt: generateDateRange(13),
  },

  {
    cveId: 'CVE-2024-0034',
    title: 'High Severity Information Disclosure in Elasticsearch',
    description:
      'An information disclosure vulnerability in Elasticsearch allows unauthorized users to access sensitive data through malformed search queries. The vulnerability affects the search API\'s handling of field-level security and can bypass access controls.',
    severity: 'HIGH',
    cvssScore: 7.5,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N',
    cweId: 'CWE-200',
    publishedDate: generateDateRange(16),
    lastModifiedDate: generateDateRange(15),
    source: 'NVD',
    references: [
      'https://www.elastic.co/community/security',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0034',
    ],
    affectedSoftware: [
      'Elasticsearch 7.0.0-8.11.3',
      'Elastic Cloud',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'NONE',
    availabilityImpact: 'NONE',
    tags: ['information-disclosure', 'elasticsearch', 'search-api', 'access-control'],
    category: 'Information Disclosure',
    patchAvailable: true,
    exploitAvailable: false,
    exploitMaturity: 'UNPROVEN',
    epssScore: 0.058,
    epssPercentile: 68,
    kev: false,
    trending: false,
    threatIntelligence: {
      exploitInTheWild: false,
      malwareFamilies: [],
      threatActors: [],
      campaigns: [],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement proper access controls',
      'Review and strengthen field-level security',
      'Monitor for suspicious search queries',
    ],
    workarounds: [
      'Implement additional input filtering',
    ],
    relatedCves: [],
    createdAt: generateDateRange(16),
    updatedAt: generateDateRange(15),
  },

  {
    cveId: 'CVE-2024-0035',
    title: 'High Severity Command Injection in Redis',
    description:
      'A command injection vulnerability in Redis allows attackers to execute arbitrary Redis commands through malformed Lua scripts. The vulnerability affects the EVAL and EVALSHA commands and can lead to data manipulation and server compromise.',
    severity: 'HIGH',
    cvssScore: 8.4,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    cweId: 'CWE-77',
    publishedDate: generateDateRange(18),
    lastModifiedDate: generateDateRange(17),
    source: 'NVD',
    references: [
      'https://redis.io/docs/security/',
      'https://nvd.nist.gov/vuln/detail/CVE-2024-0035',
    ],
    affectedSoftware: [
      'Redis 6.0.0-7.2.3',
      'Redis Enterprise',
    ],
    attackVector: 'NETWORK',
    attackComplexity: 'LOW',
    privilegesRequired: 'LOW',
    userInteraction: 'NONE',
    scope: 'UNCHANGED',
    confidentialityImpact: 'HIGH',
    integrityImpact: 'HIGH',
    availabilityImpact: 'HIGH',
    tags: ['command-injection', 'redis', 'lua-scripts', 'eval'],
    category: 'Command Injection',
    patchAvailable: true,
    exploitAvailable: true,
    exploitMaturity: 'FUNCTIONAL',
    epssScore: 0.071,
    epssPercentile: 82,
    kev: false,
    trending: true,
    threatIntelligence: {
      exploitInTheWild: true,
      malwareFamilies: ['Generic'],
      threatActors: ['Cybercriminals'],
      campaigns: ['Active Campaigns'],
    },
    mitigations: [
      'Apply vendor patches immediately',
      'Implement network segmentation',
      'Use application firewalls',
      'Restrict network access to affected services',
    ],
    workarounds: [
      'Disable affected modules or services',
      'Implement temporary access controls',
    ],
    relatedCves: [],
    createdAt: generateDateRange(18),
    updatedAt: generateDateRange(17),
  },
];

async function dropExistingIndexes(collection: any) {
  try {
    const indexes = await collection.listIndexes().toArray();

    // Drop all indexes except the default _id index
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`🗑️  Dropped existing index: ${index.name}`);
        } catch (error) {
          console.log(`⚠️  Could not drop index ${index.name}: ${error}`);
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Could not list indexes:', error);
  }
}

export async function seedVulnerabilities() {
  try {
    console.log('🌱 Starting comprehensive vulnerability seeding...');

    const db = await getDatabase();
    const collection = db.collection<Vulnerability>('vulnerabilities');

    // Clear existing data
    await collection.deleteMany({});
    console.log('🗑️  Cleared existing vulnerabilities');

    // Drop existing indexes to avoid conflicts
    await dropExistingIndexes(collection);

    // Insert new vulnerabilities in batches for better performance
    const batchSize = 10;
    let insertedCount = 0;

    for (let i = 0; i < vulnerabilities.length; i += batchSize) {
      const batch = vulnerabilities.slice(i, i + batchSize);
      const result = await collection.insertMany(batch);
      insertedCount += result.insertedCount;
      console.log(
        `📝 Inserted batch ${Math.floor(i / batchSize) + 1}: ${
          result.insertedCount
        } vulnerabilities`
      );
    }

    console.log(
      `✅ Successfully seeded ${insertedCount} total vulnerabilities`
    );

    // Create comprehensive indexes for optimal performance
    console.log('🔍 Creating database indexes...');

    // Create indexes one by one to handle any conflicts gracefully
    const indexesToCreate = [
      { key: { cveId: 1 }, unique: true, name: 'cveId_unique' },
      { key: { severity: 1 }, name: 'severity_index' },
      { key: { publishedDate: -1 }, name: 'publishedDate_desc' },
      { key: { lastModifiedDate: -1 }, name: 'lastModifiedDate_desc' },
      { key: { source: 1 }, name: 'source_index' },
      { key: { cvssScore: -1 }, name: 'cvssScore_desc' },
      { key: { affectedSoftware: 1 }, name: 'affectedSoftware_index' },
      { key: { tags: 1 }, name: 'tags_index' },
      { key: { attackVector: 1 }, name: 'attackVector_index' },
      { key: { patchAvailable: 1 }, name: 'patchAvailable_index' },
      { key: { exploitAvailable: 1 }, name: 'exploitAvailable_index' },
      {
        key: {
          title: 'text' as any,
          description: 'text' as any,
          affectedSoftware: 'text' as any,
        },
        name: 'text_search_index',
      },
      // Compound indexes for common query patterns
      {
        key: { severity: 1, publishedDate: -1 },
        name: 'severity_publishedDate',
      },
      { key: { source: 1, severity: 1 }, name: 'source_severity' },
      { key: { cvssScore: -1, severity: 1 }, name: 'cvssScore_severity' },
    ];

    for (const indexSpec of indexesToCreate) {
      try {
        await collection.createIndex(indexSpec.key, {
          name: indexSpec.name,
          unique: indexSpec.unique || false,
        });
        console.log(`✅ Created index: ${indexSpec.name}`);
      } catch (error: any) {
        if (error.code === 85) {
          console.log(
            `⚠️  Index ${indexSpec.name} already exists, skipping...`
          );
        } else {
          console.log(
            `❌ Failed to create index ${indexSpec.name}:`,
            error.message
          );
        }
      }
    }

    console.log('📊 Database indexing completed');
    
    // Process vulnerabilities through alert system (only for critical vulnerabilities to prevent overload)
    console.log('🚨 Processing critical vulnerabilities through alert system...');
    const criticalVulnerabilities = vulnerabilities.filter(v => v.severity === 'CRITICAL');
    if (criticalVulnerabilities.length > 0) {
      await vulnerabilityProcessor.processVulnerabilities(criticalVulnerabilities);
    }
    console.log('✅ Alert processing completed');
    
    console.log('🎉 Vulnerability seeding completed successfully!');

    // Display summary statistics
    const stats = await collection
      .aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
            avgCvssScore: { $avg: '$cvssScore' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    console.log('\n📈 Seeding Summary:');
    stats.forEach((stat) => {
      console.log(
        `  ${stat._id}: ${
          stat.count
        } vulnerabilities (avg CVSS: ${stat.avgCvssScore.toFixed(1)})`
      );
    });

    return { insertedCount, stats };
  } catch (error) {
    console.error('❌ Error seeding vulnerabilities:', error);
    throw error;
  }
}

// Run the seeding function if this file is executed directly
if (require.main === module) {
  seedVulnerabilities()
    .then((result) => {
      console.log(
        `✨ Seeding process finished successfully! Inserted ${result.insertedCount} vulnerabilities.`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}
