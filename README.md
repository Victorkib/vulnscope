# 🛡️ VulnScope - Advanced Vulnerability Intelligence Platform

VulnScope is a comprehensive, modern vulnerability tracking and intelligence platform built with Next.js 15, React 19, and MongoDB. It provides security professionals with powerful tools to monitor, analyze, and manage cybersecurity vulnerabilities with real-time insights and advanced analytics.

![VulnScope Dashboard](https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop)

## 🚀 Features

### Phase 1: Core Foundation ✅

- **Modern Authentication**: Supabase-powered authentication with session management
- **Vulnerability Database**: Comprehensive vulnerability tracking with 25+ sample CVEs
- **Interactive Dashboard**: Real-time metrics and vulnerability overview
- **Advanced Search**: Multi-criteria filtering and saved searches
- **User Management**: Complete user profiles with activity tracking
- **Responsive Design**: Mobile-first design with Tailwind CSS

### Phase 2: Enhanced Analytics ✅

- **Interactive Charts**: Severity distribution, trends, and top affected software
- **Advanced Filtering**: Complex search with multiple parameters
- **Export Capabilities**: JSON, CSV, and PDF export formats
- **Bookmark System**: Save and organize important vulnerabilities
- **Activity Tracking**: Comprehensive user activity logging

### Phase 3: User Experience ✅

- **Personal Dashboard**: Customized user experience with statistics
- **Settings Management**: Theme, notifications, and preference controls
- **Achievement System**: Gamified user engagement with progress tracking
- **Smart Insights**: AI-powered recommendations and risk assessments
- **Real-time Updates**: Live data synchronization

### Phase 4: Advanced Features (In Development)

- **Real-time Notifications**: WebSocket-based live updates
- **AI-Powered Analysis**: Machine learning vulnerability assessment
- **Collaboration Tools**: Team sharing and commenting
- **API Integration**: External threat intelligence feeds
- **Advanced Reporting**: Custom report generation

## 🛠 Technology Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library
- **Recharts**: Interactive data visualization
- **Lucide React**: Beautiful icon library

### Backend

- **Next.js API Routes**: Serverless API endpoints
- **MongoDB**: NoSQL database for flexible data storage
- **Supabase**: Authentication and real-time features
- **Server Actions**: Modern form handling and mutations

### Development Tools

- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Git**: Version control

## 📦 Installation

### Prerequisites

- Node.js 18+
- MongoDB Atlas account or local MongoDB instance
- Supabase account

### Environment Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/vulnscope.git
   cd vulnscope
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Variables**
   Create a `.env.local` file in the root directory:

\`\`\`env

# Database

MONGODB_URI=mongodb+srv://your-connection-string

# Supabase

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: External APIs

OPENAI_API_KEY=your-openai-key
VIRUSTOTAL_API_KEY=your-virustotal-key
\`\`\`

4. **Database Setup**
   \`\`\`bash

# Seed the database with sample vulnerabilities

npm run seed:vulnerabilities

# Seed user data (optional)

npm run seed:users
\`\`\`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

Visit `http://localhost:3000` to see the application.

## 🏗 Project Structure

\`\`\`
vulnscope/
├── app/ # Next.js App Router
│ ├── api/ # API routes
│ │ ├── users/ # User-related endpoints
│ │ └── vulnerabilities/ # Vulnerability endpoints
│ ├── dashboard/ # Dashboard pages
│ │ ├── settings/ # User settings
│ │ └── user/ # User profile
│ └── vulnerabilities/ # Vulnerability pages
├── components/ # React components
│ ├── auth/ # Authentication components
│ ├── charts/ # Data visualization
│ ├── dashboard/ # Dashboard components
│ └── ui/ # shadcn/ui components
├── lib/ # Utility libraries
│ ├── mongodb.ts # Database connection
│ ├── supabase.ts # Supabase client
│ ├── user-utils.ts # User utility functions
│ └── utils.ts # General utilities
├── types/ # TypeScript definitions
│ ├── user.ts # User-related types
│ └── vulnerability.ts # Vulnerability types
├── scripts/ # Database seeding scripts
└── middleware.ts # Next.js middleware
\`\`\`

## 🔧 API Documentation

### Authentication

All API routes under `/api/users/` require authentication. The middleware automatically handles session validation.

### Endpoints

#### Vulnerabilities

- `GET /api/vulnerabilities` - List vulnerabilities with filtering
- `GET /api/vulnerabilities/[id]` - Get vulnerability details
- `GET /api/vulnerabilities/stats` - Get vulnerability statistics
- `GET /api/vulnerabilities/trends` - Get trend data

#### User Management

- `GET /api/users/stats` - Get user statistics
- `GET /api/users/activity` - Get user activity log
- `POST /api/users/activity` - Log user activity
- `GET /api/users/bookmarks` - Get user bookmarks
- `POST /api/users/bookmarks` - Create bookmark
- `PUT /api/users/bookmarks/[id]` - Update bookmark
- `DELETE /api/users/bookmarks/[id]` - Delete bookmark

#### Preferences

- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update preferences

#### Saved Searches

- `GET /api/users/saved-searches` - Get saved searches
- `POST /api/users/saved-searches` - Create saved search
- `PUT /api/users/saved-searches/[id]` - Update saved search
- `DELETE /api/users/saved-searches/[id]` - Delete saved search

## 🎨 UI Components

### Dashboard Components

- **MetricsCards**: Key performance indicators
- **VulnerabilityTable**: Sortable, filterable vulnerability list
- **SeverityDistribution**: Interactive pie chart with risk assessment
- **VulnerabilityTrends**: Time-series trend analysis
- **ActivityFeed**: Real-time user activity stream
- **BookmarksManager**: Personal vulnerability bookmarks

### Chart Components

- **SeverityDistribution**: Enhanced donut chart with risk scoring
- **VulnerabilityTrends**: Line chart with trend analysis
- **TopAffectedSoftware**: Bar chart of most vulnerable software

### User Components

- **UserStatsCards**: Personal statistics overview
- **ActivityFeed**: User activity timeline
- **BookmarksManager**: Bookmark management interface

## 🔒 Security Features

### Authentication

- Supabase-powered authentication
- Session-based security
- Middleware protection for sensitive routes
- Automatic session refresh

### Data Protection

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection via Next.js

### Privacy

- User data encryption
- Secure cookie handling
- Privacy-focused analytics
- GDPR compliance ready

## 📊 Database Schema

### Collections

#### vulnerabilities

\`\`\`javascript
{
cveId: "CVE-2024-0001",
title: "Critical RCE in Apache Struts",
description: "Remote code execution vulnerability...",
severity: "CRITICAL",
cvssScore: 9.8,
publishedDate: "2024-01-15T00:00:00Z",
affectedSoftware: ["Apache Struts 2.x"],
exploitAvailable: true,
patchAvailable: true,
// ... additional fields
}
\`\`\`

#### user_bookmarks

\`\`\`javascript
{
id: "bookmark_123",
userId: "user_456",
vulnerabilityId: "CVE-2024-0001",
notes: "Critical for our infrastructure",
priority: "critical",
tags: ["infrastructure", "urgent"],
createdAt: "2024-01-15T10:30:00Z"
}
\`\`\`

#### user_activity

\`\`\`javascript
{
id: "activity_789",
userId: "user_456",
type: "view",
description: "Viewed vulnerability CVE-2024-0001",
vulnerabilityId: "CVE-2024-0001",
timestamp: "2024-01-15T10:30:00Z",
metadata: { source: "dashboard" }
}
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

\`\`\`bash

# Build the application

npm run build

# Start production server

npm start
\`\`\`

### Docker Deployment

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package\*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 🧪 Testing

### Unit Tests

\`\`\`bash
npm run test
\`\`\`

### Integration Tests

\`\`\`bash
npm run test:integration
\`\`\`

### E2E Tests

\`\`\`bash
npm run test:e2e
\`\`\`

## 📈 Performance

### Optimization Features

- Server-side rendering (SSR)
- Static site generation (SSG) where applicable
- Image optimization with Next.js Image
- Code splitting and lazy loading
- Database query optimization
- Caching strategies

### Monitoring

- Real-time performance metrics
- Error tracking and reporting
- User analytics and insights
- Database performance monitoring

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests for new features
- Document API changes
- Follow semantic versioning

### Issue Reporting

- Use GitHub Issues for bug reports
- Provide detailed reproduction steps
- Include environment information
- Add relevant labels and milestones

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Vercel** - For hosting and deployment platform
- **Supabase** - For authentication and real-time features
- **shadcn/ui** - For the beautiful component library
- **MongoDB** - For flexible data storage
- **Tailwind CSS** - For utility-first styling

## 📞 Support

- **Documentation**: [docs.vulnscope.com](https://docs.vulnscope.com)
- **Community**: [Discord Server](https://discord.gg/vulnscope)
- **Issues**: [GitHub Issues](https://github.com/your-username/vulnscope/issues)
- **Email**: support@vulnscope.com

---

**VulnScope** - Empowering security professionals with intelligent vulnerability management.
