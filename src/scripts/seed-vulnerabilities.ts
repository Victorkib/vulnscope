import { getDatabase } from '../lib/mongodb';
import { vulnerabilityProcessor } from '../lib/vulnerability-processor';
import type { Vulnerability } from '../types/vulnerability';

const generateDateRange = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
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
    exploitabilityScore: 3.9,
    impactScore: 5.9,
    tags: ['rce', 'apache', 'web-server', 'critical'],
    patchAvailable: true,
    patchUrl: 'https://httpd.apache.org/download.cgi',
    exploitAvailable: true,
    exploitUrls: ['https://www.exploit-db.com/exploits/51234'],
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
    exploitabilityScore: 2.8,
    impactScore: 5.9,
    tags: ['sql-injection', 'wordpress', 'cms', 'authenticated'],
    patchAvailable: true,
    patchUrl: 'https://wordpress.org/download/',
    exploitAvailable: false,
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
    exploitabilityScore: 2.8,
    impactScore: 2.7,
    tags: ['xss', 'react', 'frontend', 'client-side'],
    patchAvailable: true,
    patchUrl: 'https://github.com/remix-run/react-router/releases',
    exploitAvailable: false,
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
    exploitabilityScore: 3.9,
    impactScore: 3.6,
    tags: ['buffer-overflow', 'openssl', 'crypto', 'certificate'],
    patchAvailable: true,
    patchUrl: 'https://www.openssl.org/source/',
    exploitAvailable: false,
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
    exploitabilityScore: 2.2,
    impactScore: 5.9,
    tags: ['auth-bypass', 'django', 'python', 'admin'],
    patchAvailable: true,
    patchUrl: 'https://www.djangoproject.com/download/',
    exploitAvailable: false,
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
    exploitabilityScore: 3.9,
    impactScore: 1.4,
    tags: ['directory-traversal', 'express', 'nodejs', 'path-traversal'],
    patchAvailable: true,
    patchUrl: 'https://github.com/expressjs/express/releases',
    exploitAvailable: true,
    exploitUrls: ['https://www.exploit-db.com/exploits/51235'],
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
    exploitabilityScore: 1.8,
    impactScore: 5.9,
    tags: ['privilege-escalation', 'linux', 'kernel', 'netfilter'],
    patchAvailable: true,
    patchUrl: 'https://www.kernel.org/',
    exploitAvailable: false,
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
    exploitabilityScore: 2.8,
    impactScore: 1.4,
    tags: ['info-disclosure', 'mysql', 'database', 'query-optimizer'],
    patchAvailable: true,
    patchUrl: 'https://dev.mysql.com/downloads/mysql/',
    exploitAvailable: false,
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
    exploitabilityScore: 2.8,
    impactScore: 3.6,
    tags: ['csrf', 'laravel', 'php', 'web-middleware'],
    patchAvailable: true,
    patchUrl: 'https://github.com/laravel/framework/releases',
    exploitAvailable: false,
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
    exploitabilityScore: 3.9,
    impactScore: 5.9,
    tags: ['rce', 'jenkins', 'ci-cd', 'script-console'],
    patchAvailable: true,
    patchUrl: 'https://www.jenkins.io/download/',
    exploitAvailable: true,
    exploitUrls: ['https://www.exploit-db.com/exploits/51236'],
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
    exploitabilityScore: 2.0,
    impactScore: 6.0,
    tags: ['container-escape', 'docker', 'runtime', 'privilege-escalation'],
    patchAvailable: true,
    patchUrl: 'https://docs.docker.com/engine/install/',
    exploitAvailable: true,
    exploitUrls: ['https://www.exploit-db.com/exploits/51237'],
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
    exploitabilityScore: 3.9,
    impactScore: 5.9,
    tags: ['authentication-bypass', 'kubernetes', 'api-server', 'rbac'],
    patchAvailable: true,
    patchUrl: 'https://kubernetes.io/releases/',
    exploitAvailable: true,
    exploitUrls: [
      'https://github.com/kubernetes/kubernetes/security/advisories',
    ],
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
    exploitabilityScore: 2.8,
    impactScore: 5.2,
    tags: ['nosql-injection', 'mongodb', 'aggregation', 'database'],
    patchAvailable: true,
    patchUrl: 'https://www.mongodb.com/try/download/community',
    exploitAvailable: false,
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
    exploitabilityScore: 2.8,
    impactScore: 3.6,
    tags: [
      'information-disclosure',
      'elasticsearch',
      'search-api',
      'access-control',
    ],
    patchAvailable: true,
    patchUrl: 'https://www.elastic.co/downloads/elasticsearch',
    exploitAvailable: false,
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
    exploitabilityScore: 2.8,
    impactScore: 5.9,
    tags: ['command-injection', 'redis', 'lua-scripts', 'eval'],
    patchAvailable: true,
    patchUrl: 'https://redis.io/download/',
    exploitAvailable: false,
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
    exploitabilityScore: 2.8,
    impactScore: 4.7,
    tags: ['buffer-overflow', 'postgresql', 'query-parser', 'sql'],
    patchAvailable: true,
    patchUrl: 'https://www.postgresql.org/download/',
    exploitAvailable: false,
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
    exploitabilityScore: 3.9,
    impactScore: 2.5,
    tags: ['request-smuggling', 'nginx', 'http', 'proxy'],
    patchAvailable: true,
    patchUrl: 'https://nginx.org/en/download.html',
    exploitAvailable: true,
    exploitUrls: ['https://www.exploit-db.com/exploits/51238'],
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
    exploitabilityScore: 2.8,
    impactScore: 2.7,
    tags: ['csrf', 'angular', 'frontend', 'http-headers'],
    patchAvailable: true,
    patchUrl: 'https://github.com/angular/angular/releases',
    exploitAvailable: false,
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
    exploitabilityScore: 3.9,
    impactScore: 1.4,
    tags: ['information-disclosure', 'spring-boot', 'actuator', 'endpoints'],
    patchAvailable: true,
    patchUrl: 'https://spring.io/projects/spring-boot',
    exploitAvailable: false,
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
    exploitabilityScore: 2.8,
    impactScore: 2.5,
    tags: ['dom-xss', 'jquery', 'javascript', 'client-side'],
    patchAvailable: true,
    patchUrl: 'https://jquery.com/download/',
    exploitAvailable: false,
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
    exploitabilityScore: 3.9,
    impactScore: 5.9,
    tags: ['rce', 'microsoft', 'exchange', 'email'],
    patchAvailable: true,
    patchUrl: 'https://support.microsoft.com/en-us/help/4577352',
    exploitAvailable: true,
    exploitUrls: ['https://www.exploit-db.com/exploits/51239'],
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
    exploitabilityScore: 3.9,
    impactScore: 5.9,
    tags: ['authentication-bypass', 'vmware', 'vcenter', 'sso'],
    patchAvailable: true,
    patchUrl:
      'https://customerconnect.vmware.com/downloads/info/slug/datacenter_cloud_infrastructure/vmware_vsphere/8_0',
    exploitAvailable: false,
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
    exploitabilityScore: 2.8,
    impactScore: 5.9,
    tags: ['code-injection', 'citrix', 'netscaler', 'adc'],
    patchAvailable: true,
    patchUrl: 'https://www.citrix.com/downloads/citrix-adc/',
    exploitAvailable: false,
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
    exploitabilityScore: 3.9,
    impactScore: 4.7,
    tags: ['buffer-overflow', 'fortinet', 'ssl-vpn', 'fortigate'],
    patchAvailable: true,
    patchUrl: 'https://support.fortinet.com/Download/FirmwareImages.aspx',
    exploitAvailable: true,
    exploitUrls: ['https://www.exploit-db.com/exploits/51240'],
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
    exploitabilityScore: 1.2,
    impactScore: 5.9,
    tags: ['command-injection', 'palo-alto', 'pan-os', 'firewall'],
    patchAvailable: true,
    patchUrl: 'https://support.paloaltonetworks.com/Updates/SoftwareUpdates',
    exploitAvailable: false,
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
          title: 'text',
          description: 'text',
          affectedSoftware: 'text',
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
    
    // Process vulnerabilities through alert system
    console.log('🚨 Processing vulnerabilities through alert system...');
    await vulnerabilityProcessor.processVulnerabilities(vulnerabilities);
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
