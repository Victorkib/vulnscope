import {
  Rocket,
  Shield,
  Zap,
  BookOpen,
  Code,
  Play as PlayIcon,
  FileText as FileTextIcon,
  Video,
} from 'lucide-react';

export interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  level: 'beginner' | 'intermediate' | 'advanced';
  timeEstimate: string;
  content: DocContent[];
  tags: string[];
}

export interface DocContent {
  id: string;
  type: 'text' | 'code' | 'video' | 'interactive' | 'api' | 'tutorial';
  title: string;
  content: string;
  code?: string;
  language?: string;
  videoUrl?: string;
  apiEndpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  steps?: string[];
}

export const documentationSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Quick start guide to get you up and running with VulnScope',
    icon: Rocket,
    level: 'beginner',
    timeEstimate: '5 minutes',
    tags: ['setup', 'installation', 'first-steps'],
    content: [
      {
        id: 'overview',
        type: 'text',
        title: 'What is VulnScope?',
        content: 'VulnScope is a comprehensive vulnerability intelligence platform that helps security professionals monitor, analyze, and manage cybersecurity vulnerabilities with advanced analytics, intelligent recommendations, and community-powered features. Built with Next.js 15, React 19, MongoDB, and Supabase, it provides real-time vulnerability tracking with intelligent analysis to deliver actionable insights.'
      },
      {
        id: 'quick-start',
        type: 'tutorial',
        title: 'Quick Start Guide',
        content: 'Get started with VulnScope in 5 minutes with this step-by-step guide',
        steps: [
          'Create your account or sign in using email/password or social authentication',
          'Complete your profile setup and verify your email address',
          'Explore the dashboard to understand the interface and metrics',
          'Set up your first alert rule for critical vulnerabilities',
          'Bookmark your first vulnerability to start building your watchlist'
        ]
      },
      {
        id: 'first-login',
        type: 'tutorial',
        title: 'First Login & Tour',
        content: 'Take a guided tour of VulnScope features to maximize your productivity',
        steps: [
          'Navigate to the dashboard and review vulnerability metrics',
          'Explore the search functionality with sample queries',
          'Check your notification settings and preferences',
          'Customize your dashboard layout and theme preferences',
          'Set up your first saved search for recurring queries'
        ]
      },
      {
        id: 'system-requirements',
        type: 'text',
        title: 'System Requirements',
        content: 'VulnScope is a web-based application that works on all modern browsers. For the best experience, we recommend using Chrome, Firefox, Safari, or Edge with JavaScript enabled. The platform is optimized for both desktop and mobile devices.'
      }
    ]
  },
  {
    id: 'core-features',
    title: 'Core Features',
    description: 'Essential features for vulnerability management and analysis',
    icon: Shield,
    level: 'beginner',
    timeEstimate: '15 minutes',
    tags: ['dashboard', 'vulnerabilities', 'search', 'export'],
    content: [
      {
        id: 'dashboard-overview',
        type: 'text',
        title: 'Dashboard Overview',
        content: 'The VulnScope dashboard provides real-time insights into your security posture with comprehensive metrics, trend analysis, and quick access to critical vulnerabilities. The dashboard includes security score calculation, risk assessment, and personalized recommendations based on your organization\'s profile.'
      },
      {
        id: 'vulnerability-management',
        type: 'tutorial',
        title: 'Vulnerability Management',
        content: 'Learn how to effectively manage and track vulnerabilities in your environment',
        steps: [
          'Browse the comprehensive vulnerability database with 25+ fields per CVE',
          'Use advanced search and filtering to find relevant vulnerabilities',
          'Bookmark important vulnerabilities with custom notes and priorities',
          'Set up automated alerts for new vulnerabilities matching your criteria',
          'Export vulnerability data in multiple formats (JSON, CSV, PDF)'
        ]
      },
      {
        id: 'search-filtering',
        type: 'tutorial',
        title: 'Advanced Search & Filtering',
        content: 'Master the powerful search and filtering capabilities to find exactly what you need',
        steps: [
          'Use text search across CVE ID, title, and description fields',
          'Apply severity and CVSS score filters for risk-based filtering',
          'Filter by affected software to focus on your technology stack',
          'Save custom search queries for quick access to recurring searches',
          'Use boolean filters (exploit available, patch status, KEV status) for precise results'
        ]
      },
      {
        id: 'data-export',
        type: 'tutorial',
        title: 'Data Export',
        content: 'Export vulnerability data in multiple formats for reporting and analysis',
        steps: [
          'Select export format (JSON, CSV, PDF) based on your needs',
          'Apply filters to export specific subsets of data',
          'Configure export options including field selection and formatting',
          'Download files directly or receive them via email',
          'Schedule automated exports for regular reporting'
        ]
      },
      {
        id: 'bookmark-system',
        type: 'tutorial',
        title: 'Bookmark System',
        content: 'Organize and prioritize vulnerabilities with the bookmark system',
        steps: [
          'Bookmark vulnerabilities with custom notes and priority levels',
          'Categorize bookmarks with tags and categories',
          'Use the bookmark manager for grid and list view modes',
          'Search and filter your bookmarks for quick access',
          'Track bookmark activity in your user activity feed'
        ]
      }
    ]
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features',
    description: 'Powerful features for security teams and advanced users',
    icon: Zap,
    level: 'intermediate',
    timeEstimate: '30 minutes',
    tags: ['alerts', 'collaboration', 'notifications', 'api'],
    content: [
      {
        id: 'alert-system',
        type: 'tutorial',
        title: 'Alert System',
        content: 'Set up intelligent alerts for proactive vulnerability monitoring',
        steps: [
          'Create custom alert rules with multiple criteria and conditions',
          'Configure notification channels (email, push, webhooks, Slack, Discord)',
          'Set up cooldown periods to prevent alert spam',
          'Test alert functionality with sample vulnerabilities',
          'Monitor alert history and delivery statistics'
        ]
      },
      {
        id: 'team-collaboration',
        type: 'tutorial',
        title: 'Team Collaboration',
        content: 'Collaborate effectively with your security team using built-in tools',
        steps: [
          'Create and manage teams with role-based permissions',
          'Share vulnerabilities with team members and external stakeholders',
          'Use discussion threads for vulnerability analysis and planning',
          'Set up team notifications for critical vulnerabilities',
          'Manage team permissions and access controls'
        ]
      },
      {
        id: 'real-time-notifications',
        type: 'tutorial',
        title: 'Real-time Notifications',
        content: 'Stay informed with real-time vulnerability updates and system notifications',
        steps: [
          'Configure notification preferences for different types of alerts',
          'Set up email notifications with professional HTML templates',
          'Enable push notifications for immediate critical alerts',
          'Customize notification frequency and delivery methods',
          'Manage notification history and read/unread status'
        ]
      },
      {
        id: 'api-integration',
        type: 'api',
        title: 'API Integration',
        content: 'Integrate VulnScope with your existing security tools and workflows',
        apiEndpoint: '/api/vulnerabilities',
        method: 'GET',
        code: `// Example API call to get vulnerabilities
const response = await fetch('/api/vulnerabilities?severity=CRITICAL&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});
const vulnerabilities = await response.json();

// Example response structure
{
  "vulnerabilities": [
    {
      "cveId": "CVE-2024-0001",
      "title": "Critical RCE in Apache Struts",
      "severity": "CRITICAL",
      "cvssScore": 9.8,
      "publishedDate": "2024-01-15T00:00:00Z",
      "affectedSoftware": ["Apache Struts 2.x"],
      "exploitAvailable": true,
      "patchAvailable": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1250,
    "totalPages": 125
  }
}`
      },
      {
        id: 'email-integration',
        type: 'tutorial',
        title: 'Email Integration',
        content: 'Configure email notifications with dual provider support for reliability',
        steps: [
          'Set up primary email provider (Resend recommended)',
          'Configure secondary SMTP provider for fallback',
          'Test email delivery with sample notifications',
          'Customize email templates for different notification types',
          'Monitor email delivery statistics and bounce rates'
        ]
      }
    ]
  },
  {
    id: 'user-guides',
    title: 'User Guides',
    description: 'Step-by-step guides and best practices for effective vulnerability management',
    icon: BookOpen,
    level: 'beginner',
    timeEstimate: '20 minutes',
    tags: ['tutorials', 'best-practices', 'troubleshooting'],
    content: [
      {
        id: 'step-by-step-tutorials',
        type: 'tutorial',
        title: 'Step-by-step Tutorials',
        content: 'Comprehensive tutorials covering all major VulnScope features and workflows',
        steps: [
          'Complete vulnerability assessment workflow from discovery to remediation',
          'Set up automated monitoring for your technology stack',
          'Configure team collaboration and notification workflows',
          'Implement security reporting and compliance tracking',
          'Optimize performance settings for your organization size'
        ]
      },
      {
        id: 'best-practices',
        type: 'text',
        title: 'Best Practices',
        content: 'Learn industry best practices for vulnerability management, including risk prioritization using CVSS and EPSS scores, patch management strategies, and security team collaboration. Understand how to leverage VulnScope\'s threat intelligence features for proactive security posture management.'
      },
      {
        id: 'troubleshooting',
        type: 'text',
        title: 'Troubleshooting',
        content: 'Common issues and solutions for VulnScope users, including authentication problems, notification delivery issues, API rate limiting, and performance optimization. Learn how to resolve connection issues and optimize your experience.'
      },
      {
        id: 'user-preferences',
        type: 'tutorial',
        title: 'User Preferences & Settings',
        content: 'Customize your VulnScope experience with comprehensive preference settings',
        steps: [
          'Configure appearance settings (theme, font size, layout density)',
          'Set up notification preferences for different alert types',
          'Enable accessibility features (high contrast, reduced motion, screen reader)',
          'Configure data preferences (export format, results per page, default filters)',
          'Set language and timezone preferences for international users'
        ]
      }
    ]
  },
  {
    id: 'technical-reference',
    title: 'Technical Reference',
    description: 'API documentation, database schemas, and technical implementation details',
    icon: Code,
    level: 'advanced',
    timeEstimate: '45 minutes',
    tags: ['api', 'database', 'security', 'performance'],
    content: [
      {
        id: 'api-documentation',
        type: 'api',
        title: 'API Documentation',
        content: 'Complete API reference for all VulnScope endpoints with examples and response schemas',
        apiEndpoint: '/api/vulnerabilities/stats',
        method: 'GET',
        code: `// Get vulnerability statistics
GET /api/vulnerabilities/stats
Authorization: Bearer YOUR_TOKEN

Response:
{
  "total": 1250,
  "bySeverity": {
    "CRITICAL": 45,
    "HIGH": 180,
    "MEDIUM": 650,
    "LOW": 375
  },
  "byCategory": {
    "Web Application": 400,
    "Operating System": 300,
    "Network": 250,
    "Database": 200,
    "Mobile": 100
  },
  "withExploits": 320,
  "withPatches": 980,
  "trending": 25,
  "recentlyPublished": 15,
  "lastUpdated": "2024-01-16T14:30:00Z"
}`
      },
      {
        id: 'database-schema',
        type: 'text',
        title: 'Database Schema',
        content: 'Detailed database schema documentation including all MongoDB collections, fields, relationships, and indexing strategies used in VulnScope. Learn about the vulnerability data model, user management collections, and performance optimization techniques.'
      },
      {
        id: 'security-features',
        type: 'text',
        title: 'Security Features',
        content: 'Comprehensive overview of security features including Supabase JWT authentication, middleware route protection, input validation and sanitization, CSRF protection, and data encryption. Understand the security architecture and compliance measures implemented in VulnScope.'
      },
      {
        id: 'performance-optimization',
        type: 'text',
        title: 'Performance Optimization',
        content: 'Guidelines for optimizing VulnScope performance including caching strategies, database query optimization, API rate limiting, and real-time connection management. Learn about the 30-second polling intervals and WebSocket connection optimization for the free tier.'
      },
      {
        id: 'deployment-guide',
        type: 'tutorial',
        title: 'Deployment Guide',
        content: 'Complete guide for deploying VulnScope in production environments',
        steps: [
          'Set up MongoDB Atlas cluster with proper security configuration',
          'Configure Supabase project with authentication and real-time features',
          'Set up environment variables for all required services',
          'Configure email providers (Resend and SMTP) for notifications',
          'Deploy to Vercel with proper domain and SSL configuration',
          'Set up monitoring and error tracking for production use'
        ]
      }
    ]
  }
];

// Helper functions for documentation
export const getLevelBadgeColor = (level: string) => {
  switch (level) {
    case 'beginner': return 'bg-green-100 text-green-800 border-green-300';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'advanced': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const getContentTypeIcon = (type: string) => {
  switch (type) {
    case 'tutorial': return PlayIcon;
    case 'api': return Code;
    case 'video': return Video;
    case 'interactive': return Zap;
    default: return FileTextIcon;
  }
};

export const getMethodBadgeColor = (method: string) => {
  switch (method) {
    case 'GET': return 'bg-green-100 text-green-800 border-green-300';
    case 'POST': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'DELETE': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const searchDocumentation = (query: string, sections: DocSection[]) => {
  if (!query.trim()) return [];
  
  const results: Array<{
    sectionId: string;
    contentId: string;
    title: string;
    content: string;
    type: string;
    level: string;
    score: number;
  }> = [];
  
  const queryLower = query.toLowerCase();
  
  sections.forEach(section => {
    section.content.forEach(content => {
      const titleMatch = content.title.toLowerCase().includes(queryLower);
      const contentMatch = content.content.toLowerCase().includes(queryLower);
      const tagMatch = section.tags.some(tag => tag.toLowerCase().includes(queryLower));
      
      if (titleMatch || contentMatch || tagMatch) {
        let score = 0;
        if (titleMatch) score += 3;
        if (contentMatch) score += 2;
        if (tagMatch) score += 1;
        
        results.push({
          sectionId: section.id,
          contentId: content.id,
          title: content.title,
          content: content.content,
          type: content.type,
          level: section.level,
          score
        });
      }
    });
  });
  
  // Sort by relevance score
  return results.sort((a, b) => b.score - a.score);
};
