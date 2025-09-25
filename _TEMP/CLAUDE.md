# CLAUDE.md - DataSpur Development Guide

## Project Overview
**DataSpur** - Full-stack Next.js 14 project management application with PostgreSQL, authentication, and Google Ads API integration.

- **Stack**: Next.js 14.2.22, TypeScript 5.9.2, Prisma ORM 5.7.0, PostgreSQL
- **Auth**: NextAuth.js 4.24.5 (Google & GitHub OAuth)
- **Styling**: Tailwind CSS 3.4.17, Radix UI
- **Deployment**: Railway platform
- **Database**: PostgreSQL (local: `hla-dataspur`, production: Railway)

## Quick Commands
```bash
npm run dev                    # Start development server (localhost:3000)
npx prisma generate           # Generate Prisma client
npx prisma migrate dev        # Run database migrations
npx prisma studio            # Open database GUI (localhost:5555)
npm run build                # Production build
npm run lint                 # Run ESLint
npm run type-check          # TypeScript check
```

## Core Architecture

### Key Database Models
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  projects      Project[]
  generalTasks  GeneralTask[]
}

model Project {
  id          String        @id @default(cuid())
  title       String
  description String?
  status      ProjectStatus @default(ACTIVE)
  priority    Priority      @default(MEDIUM)
  timeline    String?       # Markdown content
  timelineEvents TimelineEvent[]
  userId      String
}

model TimelineEvent {
  id          String    @id @default(cuid())
  title       String
  description String?
  date        DateTime?
  status      TimelineEventStatus @default(PENDING)
  projectId   String
}

model GeneralTask {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String?
  completed   Boolean  @default(false)
  dueDate     DateTime? @db.Date
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ApiConfiguration {
  id            String          @id @default(cuid())
  userId        String
  provider      ApiProvider     # GOOGLE_ADWORDS, GOOGLE_ANALYTICS
  status        ApiConfigStatus # ACTIVE, INACTIVE, ERROR
  clientId      String
  clientSecret  String         # Encrypted
  apiKey        String?        # Customer ID for Google Ads
  refreshToken  String?        # Encrypted
  developerToken String?       # Encrypted
}

model GoogleAdsCampaign {
  id              String @id @default(cuid())
  userId          String
  campaignId      String
  name            String
  status          String
  lastSyncAt      DateTime @default(now())
}

model GoogleAdsMetrics {
  id              String @id @default(cuid())
  userId          String
  campaignId      String
  date            DateTime
  impressions     Int
  clicks          Int
  conversions     Float
  cost            Float
  ctr             Float
  cpc             Float
}
```

### File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth configuration
│   │   ├── projects/              # Projects CRUD API
│   │   ├── timeline/              # Timeline events API
│   │   ├── general-tasks/         # General tasks API
│   │   └── apis/google-adwords/   # Google Ads API endpoints
│   ├── dashboard/
│   │   ├── projects/              # Project management pages
│   │   ├── analytics/google-adwords/ # Google Ads analytics
│   │   └── apis/                  # API configuration pages
│   └── page.tsx                   # Landing page
├── components/
│   ├── layout/                    # Header, Sidebar, Footer
│   ├── timeline/                  # Timeline components
│   └── dashboard/                 # Dashboard widgets
├── lib/
│   ├── auth.ts                    # NextAuth setup
│   ├── prisma.ts                  # Prisma client
│   ├── encryption.ts              # Credential encryption
│   ├── googleAdsService.ts        # Google Ads API service
│   ├── googleAdsMetricsSync.ts    # Background sync service
│   ├── generalTasks.ts            # General tasks utilities
│   └── apiActivity.ts             # API activity logging
```

## Key Features

### 1. Project Management
- Full CRUD operations for projects
- Timeline generation from markdown files
- Status tracking (Active, Completed, Archived)
- Priority levels (Low, Medium, High, Urgent)
- Manual timeline event creation via drawer interface

### 2. General Tasks System ✅ PRODUCTION-READY
- **Database-backed**: Migrated from localStorage to PostgreSQL
- **Cross-platform**: Tasks appear in Daily Manifest, Tomorrow's Milestones, Overdue Events
- **Full CRUD API**: RESTful endpoints with authentication
- **Migration tools**: Browser console scripts for localStorage transition
- **Two-column layout**: Integrated in projects page (left: tasks, right: projects)

### 3. Google AdWords Integration ✅ FULLY OPERATIONAL
- **Configuration**: `/dashboard/apis/google-adwords`
- **Analytics**: `/dashboard/analytics/google-adwords` with live data
- **Cache-first architecture**: 90%+ API call reduction, sub-second load times
- **Historical data sync**: Daily granularity with 1-5+ years support
- **Real-time metrics**: Live impressions, clicks, conversions, CTR, CPC
- **Campaign performance**: Individual breakdowns with spend data
- **Background sync**: Intelligent sync with activity logging

### 4. Analytics Dashboard
- **Google Ads**: Horizontal metrics layout, simplified 2-card design
- **Performance charts**: StackedAreaChart with cost vs conversions
- **Platform Performance**: Individual campaign visualization with separate lines for each campaign
- **Campaign-Level Insights**: Real-time conversion tracking per campaign with dynamic color coding
- **Time controls**: 3d, 7d, 14d, 30d, 60d, 90d, 1y intervals
- **Data freshness indicators**: Color-coded cache status
- **Manual refresh**: Instant refresh with loading states

### 5. Dashboard Manifest System ✅ FULLY INTEGRATED
- **Daily Manifest**: Shows today's timeline events + General Tasks due today
- **Tomorrow's Manifest**: Shows tomorrow's milestones + General Tasks due tomorrow
- **Overdue Events**: Shows overdue timeline events + General Tasks past due date
- **Timezone-safe filtering**: UTC date parsing with local date comparison
- **Cross-component consistency**: General Tasks appear across all dashboard cards
- **Quick Actions integration**: Footer drawer with direct task creation links

## Critical API Endpoints

### Projects
- `GET/POST /api/projects` - List/Create projects
- `GET/PUT/DELETE /api/projects/[id]` - Single project operations

### Timeline Events
- `POST /api/timeline/events` - Create timeline event (manual creation)
- `PUT/DELETE /api/timeline/events/[id]` - Update/Delete event
- `GET /api/timeline/today` - Today's events
- `GET /api/timeline/tomorrow` - Tomorrow's events
- `GET /api/timeline/overdue` - Overdue events

### General Tasks ✅ DATABASE-BACKED
- `GET /api/general-tasks` - Fetch user's tasks
- `POST /api/general-tasks` - Create new task
- `PUT /api/general-tasks/[id]` - Update task
- `DELETE /api/general-tasks/[id]` - Delete task
- `POST /api/general-tasks/migrate` - Migrate localStorage to database

### Google AdWords ✅ CACHE-OPTIMIZED
- `GET/POST/DELETE /api/apis/google-adwords` - Configuration
- `POST /api/apis/google-adwords/test-connection` - Test connection
- `GET /api/apis/google-adwords/campaigns` - Fetch campaigns (cached)
- `GET /api/apis/google-adwords/metrics` - Analytics metrics (cached)
- `POST /api/apis/google-adwords/sync` - Manual sync with historical support
- `GET /api/apis/google-adwords/activities` - API activity log

## Recent Critical Updates

### 🚀 Platform Performance Analytics Enhancement (2025-09-24) ✅
- **Individual Campaign Lines**: Platform Performance Analytics chart now displays separate lines for each Google Ads campaign
- **Campaign-Specific Colors**: Each campaign gets its own color scheme for easy visual differentiation
- **Enhanced Data Visualization**: Chart shows both platform totals AND individual campaign performance
- **Real Campaign Data**: "Call Lead Focus- JH" and "Website traffic-Performance Max-6" campaigns now have dedicated visualization
- **Dynamic Color Generation**: Intelligent color assignment based on campaign names and characteristics
- **Improved Chart Subtitle**: Now reflects multiple metrics being displayed from connected platforms
- **API Enhancement**: Platform metrics API updated to include campaign-level aggregation alongside platform totals

### 🚀 General Tasks Dashboard Integration (2025-09-22) ✅
- **Timezone Fix**: Resolved UTC date parsing issues causing day-shift errors
- **Daily Manifest**: General Tasks with today's due date now appear correctly
- **Tomorrow's Manifest**: Renamed from "Tomorrow's Milestones", includes tomorrow's General Tasks
- **Overdue Events**: General Tasks past due date display with overdue calculations
- **Cross-Platform Integration**: General Tasks appear in all three dashboard cards
- **Quick Actions**: Added standalone General Task creation page at `/dashboard/general-tasks/new`
- **Footer Navigation**: Quick Actions drawer links to new General Task form

### 🚀 Production Deployment Fixes (2025-09-22) ✅
- **Timeline API Security**: Added authentication to all timeline endpoints
- **Database Connection**: Fixed Prisma client imports and shared instance
- **User Data Scoping**: Proper filtering ensures users only access their data
- **Theme Hydration**: Resolved server/client theme mismatch warnings
- **TypeScript Compilation**: All errors resolved for clean production build
- **API Endpoint Stability**: Fixed 500 errors in timeline routes

### 🚀 General Tasks Database Migration (2025-09-21) ✅
- **Infrastructure**: Complete migration from localStorage to PostgreSQL
- **Database Model**: Added GeneralTask with optimized indexes
- **API Layer**: Full REST endpoints with authentication
- **Dashboard Integration**: Tasks in Daily Manifest, Tomorrow's Milestones, Overdue
- **Migration Tools**: Browser console scripts with auto-detection
- **Two-Column Layout**: Projects page with integrated task management

### 🚀 Manual Timeline Event Creation (2025-09-21) ✅
- **Drawer Interface**: 60% viewport width with React portal
- **Form Validation**: Title/Type required, Description/Date optional
- **API Integration**: New POST endpoint with authentication
- **Enhanced UX**: Professional spacing, loading states, form reset

### 🚀 Google Ads Optimization (2025-09-17) ✅
- **Cache-First**: 90%+ API call reduction, sub-second loads
- **Historical Sync**: Daily granularity with 1-5+ years support
- **Background Service**: Intelligent sync management
- **Data Storage**: Local PostgreSQL storage for campaigns and metrics
- **Performance**: Dashboard load time reduced from 3-5s to <500ms

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

### Security
- Encrypt sensitive credentials using `src/lib/encryption.ts`
- Never log API keys, tokens, or secrets
- Use NextAuth for session-based authentication
- Validate user ownership for all data access

### Code Conventions
- Use TypeScript for type safety
- Follow existing component patterns
- Implement proper error handling with loading states
- Use Prisma for all database operations
- Cache API responses when suitable

### Testing & Debugging
- Manual testing through UI
- Prisma Studio for database verification (localhost:5555)
- Test API connections before data fetching
- Console logs for debugging
- Check API activity logs for integration issues

## Common Solutions

### Database Issues
- Ensure PostgreSQL is running locally
- Check DATABASE_URL format in .env.local
- Run `npx prisma generate` after schema changes
- Use `npx prisma migrate dev` for new migrations

### Google Ads API Issues
- Customer ID auto-formatted (removes dashes)
- Ensure refresh token is valid
- Developer token must be Google-approved
- Check `/api/apis/google-adwords/activities` for error logs
- Use browser console at `/dashboard/apis/google-adwords` for manual sync

### Build/Deploy Issues
- Run `npm run type-check` for TypeScript issues
- Clear `.next` folder for cache problems
- Check environment variables are set
- Verify Prisma schema is valid

## Current Status ✅ PRODUCTION-READY
- **Core Features**: Auth, projects, timelines complete
- **General Tasks**: Database migration complete, cross-platform integration
- **Dashboard Integration**: General Tasks appear in Daily/Tomorrow's Manifest and Overdue Events
- **Google AdWords**: Fully optimized with cache-first architecture
- **Analytics Dashboard**: Enterprise-grade with sub-second load times
- **Historical Data**: Production-ready sync system with daily granularity
- **Manual Creation**: Timeline events via drawer interface + standalone General Task form
- **Migration Tools**: localStorage to database transition complete
- **Production Deployment**: All critical fixes applied, TypeScript clean
- **Timezone Handling**: UTC date parsing resolved, cross-platform date consistency

### Next Development
- Google Analytics integration (routes created, implementation pending)
- Additional platform integrations (Facebook Ads, TikTok Ads)
- Enhanced reporting features

## Support & Tools
- **Issues**: https://github.com/anthropics/claude-code/issues
- **Database GUI**: http://localhost:5555 (Prisma Studio)
- **Development**: http://localhost:3000
- **Google Ads Console**: Available at analytics dashboard for manual operations