# CLAUDE.md - DataSpur Development Guide

## Project Overview
**DataSpur** - Full-stack Next.js 14 project management application with PostgreSQL, authentication, and Google Ads API integration.

- **Stack**: Next.js 14.2.22, TypeScript 5.9.2, Prisma ORM 5.7.0, PostgreSQL
- **Auth**: NextAuth.js 4.24.5 (Google & GitHub OAuth)
- **Styling**: Tailwind CSS 3.4.17, Radix UI, Material Symbols Icons
- **Rich Text**: TipTap editor with auto-save
- **Charts**: Recharts 3.1.2
- **PDF Export**: jsPDF 3.0.2
- **Deployment**: Railway platform
- **Database**: PostgreSQL (local: `hla-dataspur`, production: Railway)

### Latest Update (2025-10-16)
**Phase 5: Google Ads Export & Reporting** - Complete 5-phase Strategic Command Center with CSV/PDF export, custom date ranges, and full data portability.

## Quick Commands
```bash
npm run dev                    # Start dev server (localhost:3000)
npx prisma generate           # Generate Prisma client
npx prisma migrate dev        # Run database migrations
npx prisma studio            # Open database GUI (localhost:5555)
npm run build                # Production build
npm run lint                 # Run ESLint
```

## Core Database Models

### Users & Auth
```prisma
User {
  id, email, name
  projects, generalTasks, reportCategories, reports
}
```

### Projects & Timeline
```prisma
Project {
  id, title, description, status, priority, timeline
  userId, timelineEvents[]
}

TimelineEvent {
  id, title, description, date, status, projectId
}
```

### General Tasks
```prisma
GeneralTask {
  id, userId, title, description, completed, dueDate
  createdAt, updatedAt
}
```

### Google Ads (Strategic Command Center)
```prisma
ApiConfiguration {
  id, userId, provider, status
  clientId, clientSecret, apiKey, refreshToken, developerToken
}

GoogleAdsCampaign {
  id, apiConfigId, campaignId, name, status, budget
  startDate, endDate, lastSyncAt
  GoogleAdsMetrics[], GoogleAdsCampaignGoal?
}

GoogleAdsMetrics {
  id, campaignId, date
  impressions, clicks, conversions, cost
  ctr, cpc, conversionRate
}

GoogleAdsCampaignGoal {
  id, campaignId (unique)
  targetCPA, targetROAS, dailyBudget, monthlyBudget
  targetCTR, targetCVR, targetConversions, notes
  createdAt, updatedAt
}
```

### Reporting Projects
```prisma
ReportCategory {
  id, userId, name, parentId, level (0-3)
  parent?, children[], reports[]
}

Report {
  id, userId, title, description, content (HTML)
  categoryId, author, isPublic, sections[]
}

ReportSection {
  id, reportId, heading, content (HTML), order
  isComplete, completedAt
}
```

## File Structure (Key Locations)
```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/         # NextAuth config
│   │   ├── projects/                   # Projects CRUD
│   │   ├── timeline/                   # Timeline events
│   │   ├── general-tasks/              # Tasks CRUD
│   │   ├── apis/google-adwords/        # Google Ads API
│   │   │   ├── campaigns/, metrics/
│   │   │   ├── goals/, export/         # Goals & export
│   │   │   └── sync/, activities/
│   │   └── reporting/                  # Reporting Projects
│   │       ├── categories/, reports/
│   │       ├── sections/, search/
│   ├── dashboard/
│   │   ├── projects/                   # Project pages
│   │   ├── general-tasks/              # Task manager
│   │   ├── reporting/[id]/             # Report viewer
│   │   └── analytics/google-adwords/   # Ads dashboard
│   └── public/report/[id]/             # Public reports
├── components/
│   ├── layout/                         # Header, Sidebar, Footer
│   ├── dashboard/                      # Dashboard widgets
│   │   ├── InsightsPanel.tsx           # Phase 2
│   │   ├── CampaignComparisonTable.tsx # Phase 2
│   │   ├── MultiMetricChart.tsx        # Phase 3
│   │   ├── PerformanceHeatmap.tsx      # Phase 3
│   │   ├── ConversionFunnel.tsx        # Phase 3
│   │   ├── GoalTracker.tsx             # Phase 4
│   │   ├── ExportPanel.tsx             # Phase 5
│   │   └── DateRangePicker.tsx         # Phase 5
│   ├── reporting/                      # Reporting components
│   │   ├── CategoryTreeView.tsx, ReportsList.tsx
│   │   ├── SectionEditor.tsx, ImportReportDialog.tsx
│   └── ui/                             # Reusable UI (Radix)
├── lib/
│   ├── auth.ts                         # NextAuth setup
│   ├── prisma.ts                       # Prisma client
│   ├── encryption.ts                   # Credentials encryption
│   ├── googleAdsService.ts             # Google Ads API
│   ├── googleAdsMetricsSync.ts         # Background sync
│   ├── adsInsightsEngine.ts            # Insights generation
│   ├── pdfReportGenerator.ts           # PDF export
│   └── markdownParser.ts               # MD to HTML
```

## Key Features

### 1. Project Management
- Full CRUD operations for projects
- Timeline generation from markdown
- Status tracking (Active, Completed, Archived)
- Priority levels (Low, Medium, High, Urgent)
- Manual timeline event creation

### 2. General Tasks System
- **Page**: `/dashboard/general-tasks`
- Database-backed with PostgreSQL
- Inline editing (title, description, due date)
- Filtering: All, Active, Completed, Overdue
- Sorting: Due Date, Created Date, Title
- Statistics dashboard
- Integrated in Daily/Tomorrow's Manifest

### 3. Reporting Projects System
- **Page**: `/dashboard/reporting`
- Hierarchical categories (4-level deep)
- Markdown import with H2 section detection
- TipTap WYSIWYG editor with auto-save
- Section completion tracking
- Public sharing with OG meta tags
- Real-time search with highlighting

### 4. Google AdWords - Strategic Command Center ✅
- **Page**: `/dashboard/analytics/google-adwords`
- **Configuration**: `/dashboard/apis/google-adwords`

**5 Complete Phases**:
1. **Performance Metrics**: Score (0-100), Budget Pacing, KPI tracking
2. **Intelligent Insights**: 8 insight types, campaign rankings, recommendations
3. **Advanced Visualization**: Multi-metric charts, heatmap, conversion funnel
4. **Goals & Benchmarking**: Per-campaign targets, progress tracking
5. **Export & Reporting**: CSV/PDF export, custom date ranges

**Features**:
- Cache-first architecture (90%+ API call reduction)
- Historical data sync (daily granularity, 1-5+ years)
- Real-time performance scoring
- Budget pacing with overspend/underspend alerts
- Automated insights with priority ranking (1-10)
- Day-of-week performance patterns
- Conversion funnel bottleneck detection
- Goal progress visualization
- CSV export (with optional goals)
- PDF report generation (client-side, <1s)
- Custom date range selection

## API Endpoints

### Projects
- `GET/POST /api/projects` - List/Create
- `GET/PUT/DELETE /api/projects/[id]` - Single operations

### Timeline
- `POST /api/timeline/events` - Create event
- `PUT/DELETE /api/timeline/events/[id]` - Update/Delete
- `GET /api/timeline/today|tomorrow|overdue` - Filtered events

### General Tasks
- `GET/POST /api/general-tasks` - List/Create
- `PUT/DELETE /api/general-tasks/[id]` - Update/Delete

### Google AdWords
- `GET/POST/DELETE /api/apis/google-adwords` - Configuration
- `POST /api/apis/google-adwords/test-connection` - Test
- `GET /api/apis/google-adwords/campaigns` - Campaigns (cached)
- `GET /api/apis/google-adwords/metrics` - Metrics (cached)
- `POST /api/apis/google-adwords/sync` - Manual sync
- `GET /api/apis/google-adwords/activities` - Activity log
- `GET/POST /api/apis/google-adwords/goals` - Goals CRUD
- `GET/PUT/DELETE /api/apis/google-adwords/goals/[campaignId]` - Single goal
- `GET /api/apis/google-adwords/export` - CSV export (Phase 5)

**Export Query Params**:
- `format`: 'csv' (default)
- `timeRange`: '7d'|'30d'|'90d'|'1y'
- `startDate`: ISO date (optional, overrides timeRange)
- `endDate`: ISO date (optional)
- `includeGoals`: 'true'|'false'

### Reporting Projects
- `GET/POST /api/reporting/categories` - Categories
- `PUT/DELETE /api/reporting/categories/[id]` - Update/Delete
- `GET/POST /api/reporting/reports` - Reports
- `GET/PUT/DELETE /api/reporting/reports/[id]` - Single report
- `POST /api/reporting/reports/import` - Markdown import
- `PUT /api/reporting/sections/[id]` - Section content
- `PUT /api/reporting/sections/[id]/complete` - Toggle complete
- `GET /api/reporting/search` - Full-text search

## Environment Variables
```env
DATABASE_URL="postgresql://username:password@localhost:5432/hla-dataspur"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## Development Guidelines

### Code Conventions
- Use TypeScript for type safety
- Follow existing component patterns
- Implement proper error handling with loading states
- Use Prisma for all database operations
- Cache API responses when suitable

### Security
- Encrypt sensitive credentials using `src/lib/encryption.ts`
- Never log API keys, tokens, or secrets
- Use NextAuth for session-based authentication
- Validate user ownership for all data access

### Database Relations
- **IMPORTANT**: Use correct Prisma relation names from schema
- Projects: `timelineEvents` (not `events`)
- Campaigns: `GoogleAdsMetrics` (not `metrics`)
- API Configs: `ApiConfiguration` (capital A)
- Goals: `GoogleAdsCampaignGoal` (not `goal`)

### Google Ads API
- Customer ID auto-formatted (removes dashes)
- Ensure refresh token is valid
- Developer token must be Google-approved
- Check `/api/apis/google-adwords/activities` for error logs
- Use browser console at config page for manual sync

### Common Patterns
**Fetching User Data**:
```typescript
const session = await getServerSession(authOptions)
const user = await prisma.user.findUnique({
  where: { email: session.user.email }
})
```

**Google Ads Config Lookup**:
```typescript
const apiConfig = await prisma.apiConfiguration.findFirst({
  where: { userId: user.id, provider: 'GOOGLE_ADWORDS' }
})
```

**Including Relations**:
```typescript
const campaigns = await prisma.googleAdsCampaign.findMany({
  where: { apiConfigId: apiConfig.id },
  include: { GoogleAdsCampaignGoal: true } // Note capital letters
})
```

## Troubleshooting

### Database Issues
- Ensure PostgreSQL is running locally
- Check DATABASE_URL format in .env.local
- Run `npx prisma generate` after schema changes
- Use `npx prisma migrate dev` for new migrations

### Build/Deploy Issues
- Run `npm run type-check` for TypeScript issues
- Clear `.next` folder for cache problems
- Check environment variables are set
- Verify Prisma schema is valid

### TypeScript Errors
- Import from 'next/server' (not 'next') for API routes
- Use `PrismaClient` (not default import from '@/lib/prisma')
- Check relation names match schema exactly

## Current Status ✅ PRODUCTION-READY

**Complete Features**:
- ✅ Authentication (Google & GitHub OAuth)
- ✅ Projects with timeline management
- ✅ General Tasks with full CRUD
- ✅ Reporting Projects with WYSIWYG editor
- ✅ Google Ads Strategic Command Center (5 phases)
  - Phase 1: Performance metrics & budget pacing
  - Phase 2: Intelligent insights & rankings
  - Phase 3: Advanced visualization & patterns
  - Phase 4: Goals & benchmarking
  - Phase 5: Export & reporting
- ✅ Dashboard integration across all modules
- ✅ Public report sharing
- ✅ Advanced search and filtering
- ✅ Data export (CSV/PDF)

**Technical Highlights**:
- Zero breaking changes across all Google Ads phases
- 11 new components (~2,900 lines TypeScript)
- 6 API endpoints for analytics
- Full type safety throughout
- Cache-first architecture
- No new npm dependencies needed for recent features

## Next Development Priorities

### Immediate Enhancements
- Period-over-period comparison reports
- Scheduled email reports (daily/weekly/monthly)
- Google Analytics integration (routes exist, needs API)

### Future Features
- Multi-account Google Ads management
- Facebook Ads, TikTok Ads, LinkedIn Ads integrations
- Automated bid optimization recommendations
- Competitor benchmarking
- Advanced collaboration tools
- Real-time notifications

## Support & Tools
- **Database GUI**: http://localhost:5555 (Prisma Studio)
- **Development**: http://localhost:3000
- **Issues**: https://github.com/anthropics/claude-code/issues

---

## Quick Reference

### Key Pages
- Dashboard: `/dashboard`
- Projects: `/dashboard/projects`
- Tasks: `/dashboard/general-tasks`
- Reports: `/dashboard/reporting`
- Google Ads: `/dashboard/analytics/google-adwords`
- API Config: `/dashboard/apis/google-adwords`

### Important Files
- Auth: `src/lib/auth.ts`
- Prisma Schema: `prisma/schema.prisma`
- Google Ads Dashboard: `src/app/dashboard/analytics/google-adwords/page.tsx`
- Insights Engine: `src/lib/adsInsightsEngine.ts`
- PDF Generator: `src/lib/pdfReportGenerator.ts`

### Component Locations
- Dashboard widgets: `src/components/dashboard/`
- UI primitives: `src/components/ui/`
- Layout: `src/components/layout/`
- Reporting: `src/components/reporting/`

### Remember
- Always use TypeScript
- Follow existing patterns
- Test with real data when possible
- Cache expensive operations
- Validate user permissions
- Handle errors gracefully
- Document complex logic
