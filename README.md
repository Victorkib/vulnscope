# 🛡️ VulnScope - Advanced Vulnerability Intelligence Platform  

**A Smart Platform for Tracking, Classifying, and Understanding Vulnerabilities in Open Source Software (OSS)**  

VulnScope is a comprehensive, modern vulnerability tracking and intelligence platform built with **Next.js 15**, **React 19**, **MongoDB**, and **Supabase**. It provides security professionals with powerful tools to **monitor, analyze, and manage cybersecurity vulnerabilities** with advanced analytics, intelligent recommendations, and community-powered features.  

![VulnScope Dashboard](https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop)  

---

## 🔍 Overview  

VulnScope combines **real-time vulnerability tracking** with **intelligent analysis** to provide actionable insights. The platform aggregates data from multiple sources, applies algorithms (with ML planned), and presents findings through **interactive dashboards** with **personalized experiences**.  

---

## 🚀 Core Features (with Status)  

### ✅ **Phase 1: Foundation & Core Dashboard (Fully Implemented)**  
- **Authentication (Supabase)**:  
  - User registration/login  
  - Session management (auto refresh)  
  - Middleware-protected routes  
- **Vulnerability Database (MongoDB)**:  
  - 25+ sample CVEs seeded  
  - CRUD operations  
  - CVSS scoring, exploit & patch availability  
  - KEV (Known Exploited Vulnerabilities) tracking  
- **Interactive Dashboard**:  
  - Real-time vulnerability counts  
  - Security score calculation  
  - Risk-level assessment  
  - Trend metrics & charts  
- **Responsive Design**: Mobile-first, Tailwind CSS + shadcn/ui  
- **User Management**: Profiles, activity logging, preferences  

---

### ✅ **Phase 2: Advanced Filtering & Analytics (Fully Implemented)**  
- **Advanced Search**:  
  - Text search across CVE ID, title, description  
  - Severity, CVSS score, and date range filters  
  - Affected software & source filters  
  - Saved searches (create, edit, execute)  
- **Interactive Charts (Recharts)**:  
  - Severity distribution (donut chart)  
  - Vulnerability trends (time-series)  
  - Top affected software (bar chart)  
- **Export Functionality**:  
  - JSON, CSV, HTML export ✅  
  - PDF export ⚠️ (via browser print, not native)  
- **Bookmark System**:  
  - Notes, categories, priorities  
  - Bookmark manager with grid/list modes  
- **Activity Tracking**:  
  - Tracks views, bookmarks, exports  
  - Activity feed with metadata  

---

### ✅ **Phase 3: User Features & Personalization (Fully Implemented)**  
- **Personal Dashboard**:  
  - User-specific vulnerability stats  
  - Activity metrics  
  - Customizable layout  
- **Settings**:  
  - Theme switching (Light/Dark/System)  
  - Notification preferences  
  - Accessibility controls  
  - Data export preferences  
- **Achievements**:  
  - Progress levels (Beginner → Expert)  
  - Engagement metrics  
- **Smart Insights (Basic)**:  
  - Algorithm-based risk prioritization  
  - Security scoring  
  - Trend insights  
- **Community Features**:  
  - Comment system ✅ (add/edit/delete, likes)  
  - Basic moderation  
  - ❌ Team collaboration not yet  

---

### 🔄 **Phase 4: Real-time Features & Collaboration (Partially Implemented)**  
- **Realtime Notifications**:  
  - Notification UI exists ⚠️  
  - WebSocket push ❌  
  - Live dashboard updates ❌  
- **Collaboration Tools**:  
  - Comment system ✅  
  - Team sharing ❌  
  - Advanced moderation ❌  
- **Alerting**:  
  - Planned: custom alert rules, email/webhooks  
- **External Feeds**:  
  - API structure ready ⚠️  
  - NVD/MITRE/GitHub/OSV integration ❌  

---

### 🔮 **Phase 5: ML Integration & Advanced Analytics (Planned)**  
- ML-based classification & scoring (Python microservice with Flask/FastAPI)  
- Predictive analytics (trend forecasting, anomaly detection)  
- Threat intelligence feeds (NVD, GitHub Advisories, MITRE CVE, OSV)  
- Advanced risk correlation & lifecycle analysis  

---

### 🔮 **Phase 6: Production & Optimization (Planned)**  
- Redis caching & query optimization  
- PWA features (offline mode, mobile install)  
- Performance monitoring & error tracking  
- CI/CD hooks for vulnerability scanning  
- SEO optimization & accessibility refinements  

---

## 🧠 Tech Stack  

### Frontend  
- **Next.js 15** (App Router, SSR/SSG, Edge)  
- **React 19** (hooks, concurrent features)  
- **TypeScript** (end-to-end type safety)  
- **Tailwind CSS + shadcn/ui** (responsive UI)  
- **Lucide React** (icons)  
- **Recharts** (charts & visualizations)  

### Backend  
- **Next.js API Routes** (serverless endpoints)  
- **MongoDB Atlas** (primary storage)  
- **Supabase Auth** (authentication & sessions)  
- **Supabase Realtime** (planned for notifications)  

### Dev & Infra  
- **Vercel** (deployment)  
- **GitHub Actions** (CI/CD planned)  
- **Husky, ESLint, Prettier** (code quality)  

---

## 🏗 Project Structure  

```
vulnscope/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── users/                # User endpoints
│   │   │   ├── activity/         # Activity logs
│   │   │   ├── bookmarks/        # Bookmarks CRUD
│   │   │   ├── preferences/      # Preferences
│   │   │   ├── saved-searches/   # Saved searches
│   │   │   └── stats/            # User stats
│   │   └── vulnerabilities/      # Vulnerability endpoints
│   │       ├── [id]/             # Details, related, export, comments
│   │       ├── stats/            # Stats & analytics
│   │       ├── top-software/     # Affected software
│   │       └── trends/           # Trends over time
│   ├── dashboard/                # User dashboard
│   └── vulnerabilities/          # Vulnerability views
├── components/                   # React components
├── lib/                          # Utilities (supabase, mongodb, etc.)
├── types/                        # TypeScript definitions
├── scripts/                      # DB seeding scripts
└── middleware.ts                 # Auth middleware
```  

---

## 📦 Setup & Installation  

### Prerequisites  
- Node.js 18+  
- MongoDB Atlas account  
- Supabase account  
- Git  

### Environment Variables  
Create `.env.local`:  

```env
# MongoDB
MONGODB_URI=mongodb+srv://your-connection-string
MONGODB_DB=vulnscope

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional APIs
GITHUB_TOKEN=your-github-token
NVD_API_KEY=your-nvd-api-key
OPENAI_API_KEY=your-openai-key
VIRUSTOTAL_API_KEY=your-virustotal-key
ML_SERVICE_URL=https://your-ml-service.com
ML_SERVICE_API_KEY=your-ml-api-key
```  

### Steps  

```bash
# Clone repo
git clone https://github.com/your-username/vulnscope.git
cd vulnscope

# Install deps
npm install

# Seed database
npm run seed:vulnerabilities
npm run seed:users   # optional

# Run dev server
npm run dev
```  

Visit: `http://localhost:3000`  

---

## 🔧 API Documentation  

### Authentication  
All `/api/users/*` routes require Supabase JWT.  

### Vulnerabilities  
- `GET /api/vulnerabilities` → list/filter  
- `GET /api/vulnerabilities/[id]` → details  
- `GET /api/vulnerabilities/[id]/related` → related CVEs  
- `GET /api/vulnerabilities/[id]/comments` → list comments  
- `POST /api/vulnerabilities/[id]/comments` → add comment  
- `PATCH /api/vulnerabilities/[id]/comments/[commentId]` → edit comment  
- `DELETE /api/vulnerabilities/[id]/comments/[commentId]` → delete comment  
- `GET /api/vulnerabilities/stats` → stats  
- `GET /api/vulnerabilities/trends` → trends  
- `GET /api/vulnerabilities/top-software` → top affected  
- `POST /api/vulnerabilities/export` → export  

### Users  
- `GET /api/users/stats` → stats  
- `GET /api/users/activity` → activity log  
- `POST /api/users/activity` → log activity  
- `DELETE /api/users/activity` → delete activity  
- `GET /api/users/bookmarks` → list bookmarks  
- `POST /api/users/bookmarks` → add bookmark  
- `PUT /api/users/bookmarks/[id]` → update bookmark  
- `DELETE /api/users/bookmarks/[id]` → remove bookmark  
- `GET /api/users/preferences` → get prefs  
- `PUT /api/users/preferences` → update prefs  
- `GET /api/users/saved-searches` → list saved searches  
- `POST /api/users/saved-searches` → add saved search  
- `GET /api/users/saved-searches/[id]` → get saved search  
- `PUT /api/users/saved-searches/[id]` → update  
- `DELETE /api/users/saved-searches/[id]` → delete  
- `POST /api/users/saved-searches/[id]` → execute search  

---

## 📊 Database Schema  

### vulnerabilities  
```javascript
{
  cveId: "CVE-2024-0001",
  title: "Critical RCE in Apache Struts",
  description: "Remote code execution vulnerability...",
  severity: "CRITICAL",
  cvssScore: 9.8,
  publishedDate: "2024-01-15T00:00:00Z",
  lastModifiedDate: "2024-01-16T10:30:00Z",
  affectedSoftware: ["Apache Struts 2.x"],
  references: ["https://nvd.nist.gov/vuln/detail/CVE-2024-0001"],
  exploitAvailable: true,
  patchAvailable: true,
  tags: ["rce", "apache", "struts"],
  category: "Web Application",
  attackVector: "NETWORK",
  attackComplexity: "LOW",
  privilegesRequired: "NONE",
  userInteraction: "NONE",
  createdAt: "2024-01-15T00:00:00Z",
  updatedAt: "2024-01-16T10:30:00Z"
}
```  

### user_bookmarks  
```javascript
{
  id: "bookmark_123",
  userId: "user_456",
  vulnerabilityId: "CVE-2024-0001",
  notes: "Critical for our infrastructure",
  priority: "critical",
  tags: ["urgent"],
  createdAt: "2024-01-15T10:30:00Z"
}
```  

### user_activity  
```javascript
{
  id: "activity_789",
  userId: "user_456",
  type: "view",
  description: "Viewed vulnerability CVE-2024-0001",
  vulnerabilityId: "CVE-2024-0001",
  timestamp: "2024-01-15T10:30:00Z",
  metadata: { source: "dashboard", duration: 45000 }
}
```  

### user_preferences  
```javascript
{
  userId: "user_456",
  theme: "dark",
  emailNotifications: true,
  pushNotifications: false,
  weeklyDigest: true,
  criticalAlerts: true,
  exportFormat: "json",
  dashboardLayout: "comfortable",
  language: "en",
  timezone: "UTC",
  defaultSeverityFilter: ["CRITICAL","HIGH"],
  maxResultsPerPage: 25,
  createdAt: "2024-01-15T10:30:00Z"
}
```  

### saved_searches  
```javascript
{
  id: "search_123",
  userId: "user_456",
  name: "Critical Apache Vulns",
  description: "All critical vulnerabilities affecting Apache",
  filters: {
    severity: ["CRITICAL"],
    affectedSoftware: ["Apache"],
    cvssScore: { min: 9.0, max: 10.0 }
  },
  isPublic: false,
  createdAt: "2024-01-15T10:30:00Z",
  lastUsed: "2024-01-16T14:20:00Z",
  useCount: 5
}
```  

---

## 🔒 Security  

- Supabase JWT auth ✅  
- Middleware route protection ✅  
- Input validation & sanitization ✅  
- XSS & CSRF protection ✅  
- RLS (planned for community features) 🔮  
- GDPR compliance roadmap 🔮  

---

## 📈 Performance  

✅ Implemented: SSR, SSG, lazy loading, code splitting, query optimization  
🔄 Planned: Redis caching, CDN, monitoring dashboards, error tracking  

---

## 🧪 Testing  

- Unit tests ❌  
- Integration tests ❌  
- E2E tests ❌  
- TypeScript & linting ✅  

---

## 🤝 Contributing  

1. Fork → branch → commit → PR  
2. Follow TypeScript best practices  
3. Add tests (once framework live)  
4. Document changes  

---

## 📄 License  

MIT License. Uses public CVE data from MITRE, NVD, GitHub.  

---

## 🙏 Acknowledgments  

- Next.js Team  
- Vercel  
- Supabase  
- MongoDB  
- shadcn/ui  
- Tailwind CSS  
- MITRE (CVE)  
- NIST (NVD)  

---

## 📞 Support  

- Docs: [docs.vulnscope.com](https://docs.vulnscope.com)  
- Community: Discord (planned)  
- Issues: GitHub Issues  
- Email: support@vulnscope.com  

**Lead**: Rinu Tamang  
**Institution**: MSc in Information Security & Digital Forensics, 2025  

---

## 🔄 Implementation Summary  

- ✅ **Phases 1–3 (Completed)** – Core foundation, analytics, UX.  
- 🔄 **Phase 4 (Partial)** – Notifications, collab tools.  
- 🔮 **Phases 5–6 (Planned)** – ML integration, threat feeds, optimization.  

**Current Status**:  
Production-ready for **core tracking & analytics**. Advanced **ML & real-time features** are upcoming.  
