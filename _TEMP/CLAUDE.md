# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DataSpur Project Management Application** - A full-stack Next.js 14 project planning application with PostgreSQL database, user authentication, and Railway deployment. The application provides project management capabilities with timeline generation, user system, and responsive design.

**Original Template**: Preserved in `_TEMP/template.html`  
**Current Architecture**: Next.js 14 + TypeScript + Prisma + PostgreSQL  
**Database**: PostgreSQL (local: `hla-dataspur`, production: Railway)

## Technology Stack

- **Framework**: Next.js 14.2.22 with App Router
- **Language**: TypeScript 5.9.2
- **Database**: PostgreSQL with Prisma ORM 5.7.0
- **Authentication**: NextAuth.js 4.24.5 (Google & GitHub providers)
- **Styling**: Tailwind CSS 3.4.17 + Custom CSS
- **UI Components**: Radix UI primitives, React Hook Form
- **Deployment**: Railway platform

## Current Status

- ✅ **Complete**: Layout, Navigation, Database Schema, CRUD Operations
- ✅ **Complete**: Authentication System, Theme Support, Mobile Responsive
- ✅ **Complete**: Timeline System, Project Management, Railway Deployment
- ✅ **Complete**: PostgreSQL Migration and Production Ready
- ✅ **Enhanced**: Timeline generation now available on both create and edit pages
- ✅ **Enhanced**: Markdown content fully preserved with rich HTML formatting
- ✅ **Enhanced**: Timeline events now expandable with chevron controls
- ✅ **Fixed**: Footer toggle functionality (place_item icon now properly toggles fixed/not-fixed positioning)
- ✅ **Fixed**: Theme flash issue on client-side rendered pages (Google AdWords page no longer flashes light mode)
- ✅ **Fixed**: Project deletion now persists in database
- ✅ **Enhanced**: Timeline Event Spacing - Added "None" option to skip calendar date calculations
- ✅ **Enhanced**: Timeline Event Status System - Full status management for individual milestones
- ✅ **Enhanced**: Status tracking with Pending/In Progress/Completed options for all timeline events
- ✅ **Enhanced**: Timeline Bulk Deletion - Delete All button with safety confirmation for removing all timeline events at once

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts     # NextAuth configuration
│   │   ├── projects/route.ts               # Projects CRUD API
│   │   └── projects/[id]/route.ts          # Individual project API
│   ├── dashboard/
│   │   ├── page.tsx                        # Main dashboard
│   │   ├── projects/
│   │   │   ├── page.tsx                    # Projects list
│   │   │   ├── create/page.tsx             # Create project
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # Project view
│   │   │       └── edit/page.tsx           # Edit project
│   │   └── users/page.tsx                  # User management
│   ├── auth/
│   │   ├── signin/page.tsx                 # Sign in page
│   │   └── register/page.tsx               # Registration page
│   ├── globals.css                         # Global styles
│   ├── layout.tsx                          # Root layout
│   └── page.tsx                            # Landing page
├── components/
│   ├── layout/
│   │   ├── header.tsx                      # Main header
│   │   ├── sidebar.tsx                     # Navigation sidebar
│   │   └── footer.tsx                      # Footer with debug toggle
│   ├── ui/                                 # Reusable UI components
│   └── theme/                              # Theme provider and toggle
├── lib/
│   ├── auth.ts                             # NextAuth configuration
│   ├── db.ts                               # Prisma client
│   └── utils.ts                            # Utility functions
└── types/
    └── next-auth.d.ts                      # NextAuth type extensions
```

## Database Schema

### Core Models
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  role          UserRole  @default(USER)
  projects      Project[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Project {
  id          String        @id @default(cuid())
  title       String
  description String?
  status      ProjectStatus @default(ACTIVE)
  priority    Priority      @default(MEDIUM)
  startDate   DateTime?
  endDate     DateTime?
  timeline    String?       # Markdown content
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

enum UserRole { USER, ADMIN }
enum ProjectStatus { ACTIVE, COMPLETED, ARCHIVED }
enum Priority { LOW, MEDIUM, HIGH, URGENT }
```

## Development Commands

```bash
# Start development server
npm run dev

# Database operations
npx prisma generate              # Generate Prisma client
npx prisma migrate dev          # Run migrations
npx prisma studio               # Open database GUI
npx prisma db push              # Push schema changes

# Build and deployment
npm run build                   # Production build
npm start                       # Start production server
npm run lint                    # Run ESLint
npm run type-check              # TypeScript check
```

## Environment Configuration

Create `.env.local`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hla-dataspur"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## Railway Deployment

### Configuration Files
- `railway.toml` - Railway service configuration
- `Dockerfile` - Container configuration
- `.env.example` - Environment variables template

### Deployment Process
```bash
# Login to Railway
railway login

# Deploy to production
railway up

# Link to existing project
railway link [project-id]

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
```

## Architecture Highlights

### Authentication Flow
- NextAuth.js with Google & GitHub providers
- Session-based authentication
- Protected routes with middleware
- Role-based access control (USER/ADMIN)

### Project Management
- Full CRUD operations for projects
- Timeline generation from markdown upload
- Status and priority management
- User-project relationships

### UI/UX Features
- Responsive design with mobile optimization
- Dark/light/system theme support
- Collapsible sidebar navigation
- Debug mode toggle for development

### API Structure
- RESTful API endpoints under `/api`
- Type-safe request/response handling
- Error handling and validation
- Prisma ORM for database operations

## Development Workflow

1. **Setup**: Clone repo, install dependencies, setup PostgreSQL
2. **Database**: Run migrations, seed data if needed
3. **Environment**: Configure `.env.local` with required variables
4. **Development**: Use `npm run dev` for hot-reload development
5. **Testing**: Manual testing through UI and Prisma Studio
6. **Deployment**: Push to Railway for production deployment

## Key Components

### Layout Components
- `Header`: Logo, title, user menu
- `Sidebar`: Navigation with collapsible menu
- `Footer`: Debug toggle and status indicators

### Feature Components
- `ProjectCard`: Project display with actions
- `ProjectForm`: Create/edit project forms
- `TimelineUpload`: Markdown file upload for timeline generation
- `ThemeToggle`: Theme switching functionality

## Recent Updates (2025-09-11)

### Footer Toggle Fix
- **Issue**: Footer toggle (place_item icon) was not working properly
- **Solution**: Replaced `document.querySelector` with React `useRef` for reliable DOM element reference
- **Impact**: Footer now properly toggles between fixed and not-fixed positions with localStorage persistence

### Theme Flash Fix
- **Issue**: Google AdWords page flashed light theme when in dark mode
- **Solution**: Modified ThemeProvider to initialize with correct theme from DOM state using lazy state initialization
- **Impact**: All client-side rendered pages now load with correct theme without flashing

### Timeline Generation on Edit Page
- **Feature**: Added markdown timeline generation to project edit page
- **Components**: Integrated MarkdownUploader, TimelineGenerator, and TimelinePreview
- **API Updates**: Enhanced PUT `/api/projects/[id]` endpoint to handle timeline events
- **Type Safety**: Created UpdateProjectData interface for proper TypeScript support

### Enhanced Markdown Content Preservation
- **Issue**: Timeline events only showed H1 headers, losing detailed content
- **Solution**: Enhanced markdown parser to extract full content under each H1 header
- **Features**:
  - New `HeaderWithContent` interface with title, content, and htmlContent
  - `parseMarkdownHeaders` now captures complete sections
  - Timeline events preserve all markdown content (lists, links, formatting)

### HTML Formatting for Timeline Descriptions
- **Feature**: Convert markdown to rich HTML for timeline event descriptions
- **Conversion**: Full markdown-to-HTML converter supporting:
  - Headers (H1-H6) with proper hierarchy
  - Bold, italic, and code formatting
  - Ordered and unordered lists with indentation
  - Clickable links opening in new tabs
  - Code blocks with syntax highlighting
- **Display**: Timeline events now render formatted HTML instead of plain text
- **Edit Mode**: Strips HTML tags for clean editing experience
- **Styling**: Comprehensive CSS for both dark and light themes

### Expandable Timeline Events
- **Feature**: Collapsible timeline events with chevron icons
- **UI Elements**:
  - Individual chevron buttons for each event with description
  - Smooth rotation animation (180°) when expanding/collapsing
  - "Expand All" / "Collapse All" bulk controls in header
- **State Management**: Track expanded events using Set for performance
- **Animations**: Slide-down animation with opacity transition
- **Visual Design**: Clean separation between collapsed/expanded states

### Delete Project Persistence Fix
- **Issue**: Deleted projects reappeared after page refresh
- **Root Cause**: `deleteProject` function only updated local state, not calling API
- **Solution**: Updated to call DELETE `/api/projects/[id]` endpoint
- **Impact**: Project deletions now persist in database

### Timeline Event Spacing Enhancement
- **Feature**: Added "None" option to Event Spacing dropdown
- **Functionality**: When "None" is selected, timeline events are created without calendar date calculations
- **UI Updates**: Shows "No dates assigned" and "No date" in timeline displays
- **Use Case**: Allows users to create milestone lists without specific scheduling

### Timeline Event Status System
- **Feature**: Complete status management system for individual timeline events
- **Status Options**: Pending (default), In Progress, Completed
- **Visual Indicators**: Color-coded badges (gray, blue, green) throughout the application
- **Database Schema**: Added `TimelineEventStatus` enum and `status` field to `TimelineEvent` model
- **UI Integration**:
  - Status dropdowns in TimelinePreview component (expanded event editing)
  - Status badges in collapsed event views
  - Status dropdown in TimelineEventModal for individual event editing
  - Status display in TimelineDisplay component for existing events
- **API Enhancements**: 
  - Status mapping between frontend (lowercase) and database (uppercase enum) values
  - All CRUD endpoints updated to handle status field properly
  - Backwards compatibility with existing events (default to "pending")
- **User Experience**: Users can now track milestone progress and update status as work progresses

## Recent Updates (2025-09-11) - Mobile Sidebar & Footer Fixes

### Mobile Sidebar Navigation Improvements
- **Issue**: Right sidebar icons were shifting off-screen when footer was not fixed on mobile
- **Issue**: Sidebar icons moving during page scroll on mobile devices
- **Issue**: Footer overlapping with sidebar in certain configurations

### Mobile Layout Fixes Applied
- **Right Sidebar Positioning**: Added `right: 0 !important` and `position: fixed !important` to mobile sidebar CSS
- **Scroll Stability**: Added hardware acceleration properties (`transform: translateZ(0)`, `backface-visibility: hidden`, `will-change: transform`) to prevent sidebar movement during scroll
- **Z-Index Coordination**: Increased sidebar z-index to 1000 to prevent footer overlap, ensuring sidebar always spans full viewport height
- **Footer State-Based Spacing**: Added `margin-right: 20px` to sidebar when footer is not fixed to prevent off-screen positioning
- **Navigation Container Flex**: Added `flex-direction: initial` override for nav-items-container when footer is not fixed

### UI Polish Updates
- **Border Removal**: Removed dashed debug borders from `.safe-margin` class across all pages
- **Footer Styling**: Removed top border from `.footer-fixed` for cleaner appearance
- **Mobile Footer Width**: Removed forced width constraints on footer for more natural mobile behavior

### Files Modified (Mobile Layout Fixes)
- `src/app/globals.css` - Mobile responsive CSS improvements for sidebar and footer coordination
- `src/components/layout/footer.tsx` - Footer toggle functionality enhancements

### Key Improvements
1. **Mobile Sidebar Stability**: Right sidebar now stays properly positioned regardless of footer state or scroll position
2. **Better Mobile UX**: Navigation elements no longer shift or go off-screen during footer state changes
3. **Improved Visual Polish**: Removed debug borders and unnecessary styling elements for cleaner appearance
4. **Cross-Device Consistency**: Sidebar behavior now consistent across all device types and viewport sizes

## Recent Updates (2025-09-11) - Analytics Dashboard Implementation

### Comprehensive Analytics System
- **Feature**: Complete analytics navigation and dashboard system for monitoring API integrations
- **New Navigation**: Added main "Analytics" menu item with sub-navigation for dashboard and Google AdWords
- **Multi-Level Analytics**: Hierarchical structure with overview dashboard and provider-specific analytics

### Analytics Dashboard Features
- **API Integration Overview**: Real-time detection and display of connected API services
- **Connection Status Tracking**: Visual indicators showing active/inactive API configurations
- **Performance Metrics**: Aggregate metrics across all connected APIs
- **Responsive Design**: Matches existing project page layouts with card-based interface
- **Real Data Integration**: Fetches actual configuration data instead of mock content

### Google AdWords Analytics Implementation
- **Comprehensive Metrics**: Full-featured analytics page with real-time data from Google AdWords API
- **Key Performance Indicators**: Impressions, clicks, conversions, cost metrics with comparison data
- **Performance Trend Visualization**: Interactive Recharts BarChart with selectable metrics and custom tooltips
- **Overall Campaign Performance**: New LineChart showing aggregated performance of all enabled campaigns
- **Campaign Management**: 3x2 grid layout for top campaigns with performance indicators
- **Data Tables**: Comprehensive campaign performance table with sortable columns
- **Time Range Selection**: Configurable periods (7d, 30d, 90d, 1y) for all analytics

### Recharts Integration
- **Professional Charting**: Replaced custom HTML/CSS charts with Recharts library components
- **Dual-Axis Charts**: LineChart with separate Y-axes for volume metrics (left) and cost metrics (right)
- **Interactive Elements**: Custom tooltips with proper formatting, legends, and responsive containers
- **Theme Integration**: Charts use CSS variables for consistent theming across light/dark modes
- **Performance Optimization**: Efficient data processing and responsive chart rendering

### Real-Time Data Integration
- **Live Metrics API**: New `/api/apis/google-adwords/metrics` endpoint serving comprehensive analytics data
- **Dynamic Campaign Filtering**: Separates enabled vs all campaigns for focused performance analysis
- **Automatic Refresh**: Data updates based on time range selection and user interactions
- **Loading States**: Proper loading indicators and error handling throughout analytics interface
- **Connection Status Sync**: Real-time connection status updates across all analytics components

### Files Created/Modified (Analytics System)
- `src/components/layout/sidebar.tsx` - Added Analytics navigation with sub-items
- `src/app/dashboard/analytics/page.tsx` - New analytics dashboard with API integration overview
- `src/app/dashboard/analytics/google-adwords/page.tsx` - Comprehensive Google AdWords analytics page
- `src/app/api/apis/google-adwords/metrics/route.ts` - Metrics API endpoint with comprehensive data generation
- `src/components/dashboard/PlatformPerformanceChart.tsx` - Reference chart component (existing)

### Analytics Features Overview
1. **Main Analytics Dashboard**:
   - API integrations status overview
   - Connection health monitoring
   - Quick access to provider-specific analytics
   - Responsive card layout matching existing design patterns

2. **Google AdWords Analytics**:
   - Performance trend chart (BarChart) with metric selection
   - Overall campaign performance (LineChart) for enabled campaigns
   - Top campaigns in 3x2 card grid layout
   - Comprehensive campaign performance data table
   - Key metrics with period-over-period comparisons
   - Connection status monitoring with configuration links

3. **Chart Components**:
   - Responsive containers with proper aspect ratios
   - Custom tooltip formatting (currency, percentages, numbers)
   - Theme-aware styling using CSS custom properties
   - Interactive legends and axis labels
   - Smooth animations and hover effects

### User Experience Enhancements
- **Breadcrumb Navigation**: Clear navigation path within analytics sections
- **Metric Insights**: Average daily performance indicators below charts
- **Campaign Status Visualization**: Color-coded status indicators and performance bars
- **Data Formatting**: Consistent formatting for currency, percentages, and large numbers
- **Responsive Layout**: Optimal viewing on desktop, tablet, and mobile devices

## Recent Updates (2025-09-11) - API Activity Tracking System

### Real-Time API Activity Tracking Implementation
- **Feature**: Comprehensive API activity logging and display system for Google AdWords integration
- **Challenge**: "Recent API Activity" section showed static mock data instead of real API interactions
- **Solution**: Full-stack implementation with database tracking, logging utilities, and real-time UI updates

### Database Schema Enhancements
- **New Model**: `ApiActivity` with comprehensive tracking capabilities
- **New Enums**: 
  - `ApiActivityType` (CONNECTION_TEST, DATA_SYNC, CAMPAIGN_FETCH, KEYWORD_UPDATE, RATE_LIMIT_WARNING, ERROR)
  - `ApiActivityStatus` (SUCCESS, WARNING, ERROR)
- **Enhanced Relationships**: Connected User, ApiConfiguration, and ApiActivity models
- **Migration**: `20250912003515_add_api_activity_tracking` successfully applied

### Backend API Activity System
- **Activity Logging Utility**: `src/lib/apiActivity.ts` with comprehensive logging functions
- **Helper Methods**: Pre-built activity creators for common API operations
- **Existing Route Updates**: All Google AdWords API routes now log their activities
  - `test-connection/route.ts` - Logs connection test results
  - `campaigns/route.ts` - Logs campaign fetch operations
- **New Endpoint**: `activities/route.ts` - Serves recent activity data with time formatting

### Frontend Real-Time Integration
- **Dynamic Activity Display**: "Recent API Activity" section now shows live data from database
- **Real-Time Updates**: Activities refresh automatically after API operations (test connection, fetch campaigns)
- **Status Indicators**: Color-coded activity dots and icons based on operation type and result
- **Loading States**: Proper loading indicators and empty state handling
- **Manual Refresh**: Users can manually refresh activity list
- **Time Formatting**: Human-readable time stamps (e.g., "2 hours ago", "Yesterday")

### User Experience Improvements
- **Credential Display**: Form fields now show `xxxxxxxx (saved)` when credentials exist
- **Visual Feedback**: Clear indication that credentials have been successfully stored
- **Activity Types**: Support for connection tests, data syncing, campaign fetches, keyword updates, rate limit warnings
- **Status Persistence**: API connection status correctly persists across page refreshes

### Technical Implementation Details
- **Activity Types Supported**:
  - Connection tests with success/failure logging
  - Campaign data synchronization with count metadata
  - Keyword update operations
  - Rate limit warnings with usage statistics
  - General error tracking
- **Metadata Storage**: JSON field for additional activity details (counts, error messages, etc.)
- **Performance**: Efficient queries with proper indexing and pagination support
- **Security**: Activity data properly scoped to authenticated users

### Files Modified (API Activity System)
- `prisma/schema.prisma` - Added ApiActivity model and enums
- `src/lib/apiActivity.ts` - Core activity logging utilities
- `src/app/api/apis/google-adwords/route.ts` - Enhanced with activity logging
- `src/app/api/apis/google-adwords/test-connection/route.ts` - Added connection test logging
- `src/app/api/apis/google-adwords/campaigns/route.ts` - Added campaign fetch logging
- `src/app/api/apis/google-adwords/activities/route.ts` - New endpoint for activity data
- `src/app/dashboard/apis/google-adwords/page.tsx` - Real-time activity display implementation
- `src/scripts/seedApiActivity.js` - Seeding script for sample activity data

### Debugging and Status Persistence
- **Connection Status Persistence**: Verified that API connection status correctly persists across page refreshes
- **Database Validation**: Connection status properly stored as `ACTIVE` in database
- **API Response Validation**: Endpoint correctly returns `"status": "active"`
- **Frontend Debug Logging**: Added comprehensive logging to track configuration fetching
- **User ID Matching**: Verified proper user session handling and configuration lookup

### Key Benefits
1. **Real Data Visibility**: Users can now see actual API activity instead of static mock data
2. **Operation Tracking**: Every API interaction is logged with timestamps and results
3. **Troubleshooting**: Clear visibility into API failures and success patterns
4. **User Confidence**: Visual confirmation that credentials are saved and API is functioning
5. **Real-Time Updates**: Activity list updates immediately after performing API operations

## Key Files Modified Today (2025-09-11)

### API Activity Tracking System (Latest Updates)
- `prisma/schema.prisma` - Added ApiActivity model and related enums for comprehensive activity tracking
- `src/lib/apiActivity.ts` - New utility library for logging and retrieving API activities
- `src/app/api/apis/google-adwords/route.ts` - Enhanced main configuration endpoint
- `src/app/api/apis/google-adwords/test-connection/route.ts` - Added activity logging for connection tests
- `src/app/api/apis/google-adwords/campaigns/route.ts` - Added activity logging for campaign fetches
- `src/app/api/apis/google-adwords/activities/route.ts` - New endpoint for serving activity data
- `src/app/dashboard/apis/google-adwords/page.tsx` - Implemented real-time activity display with credential masking
- `src/scripts/seedApiActivity.js` - Seeding script for sample API activity data
- `src/scripts/checkApiStatus.js` - Diagnostic script for debugging API configuration status

### Timeline Generation Enhancement (Previous Updates)
- `src/lib/markdownParser.ts` - Enhanced parser with content extraction and HTML conversion
- `src/components/timeline/TimelineGenerator.tsx` - Updated to use headersWithContent
- `src/app/dashboard/projects/[id]/edit/page.tsx` - Added timeline generation components
- `src/app/dashboard/projects/new/page.tsx` - Updated to use enhanced parser

### Timeline Display Enhancement (Previous Updates)
- `src/components/timeline/TimelineDisplay.tsx` - Added expandable events with chevrons
- `src/components/timeline/TimelineEventModal.tsx` - Fixed HTML rendering and editing
- `src/components/timeline/TimelinePreview.tsx` - Added HTML content rendering

### API Updates (Previous Updates)
- `src/app/api/projects/[id]/route.ts` - Enhanced PUT endpoint for timeline events
- `src/hooks/useProjects.ts` - Fixed deleteProject to call API, added UpdateProjectData type

### Timeline Event Status System (Latest Updates)
- `src/lib/markdownParser.ts` - Added status field to TimelineEvent interface with default "pending"
- `src/components/timeline/TimelineGenerator.tsx` - Added "None" spacing option and status handling
- `src/components/timeline/TimelinePreview.tsx` - Added status dropdowns and badges to event editing
- `src/components/timeline/TimelineDisplay.tsx` - Added status badges to existing event displays
- `src/components/timeline/TimelineEventModal.tsx` - Added status dropdown and display in modal
- `prisma/schema.prisma` - Added TimelineEventStatus enum and status field to TimelineEvent model
- `src/app/api/projects/route.ts` - Added status mapping functions and response transformations
- `src/app/api/projects/[id]/route.ts` - Added status handling in individual project endpoints
- `src/app/api/timeline/events/[id]/route.ts` - Added status support to timeline event CRUD operations
- `src/hooks/useProjects.ts` - Updated ApiTimelineEvent interface to include status field
- `src/app/dashboard/projects/[id]/edit/page.tsx` - Added status handling in project edit conversion

### Styling
- `src/app/globals.css` - Added styles for expandable timeline events, HTML content, and status badges

## Troubleshooting

### Common Issues
- **Database Connection**: Ensure PostgreSQL is running and DATABASE_URL is correct
- **Authentication**: Verify OAuth provider credentials and NEXTAUTH_SECRET
- **Build Errors**: Run `npm run type-check` and fix TypeScript errors
- **Prisma Issues**: Regenerate client with `npx prisma generate`
- **Theme Flash**: If theme flashing occurs on new pages, ensure ThemeProvider initializes from DOM state
- **Footer Toggle**: If footer toggle stops working, check that footerRef is properly connected

### Development Tools
- Use `http://localhost:5555` for Prisma Studio (database GUI)
- Debug mode toggle in footer for UI debugging
- Browser dev tools for client-side debugging
- Railway logs for production debugging

## Production Considerations

- PostgreSQL database with proper indexing
- Environment variables properly configured
- OAuth providers configured for production domains
- Error logging and monitoring setup
- Regular database backups
- Performance monitoring for API endpoints

## Recent Updates (2025-09-12) - Deployment Fix & Build Configuration

### Deployment Build Error Resolution
- **Issue**: Railway deployment failing during `npm run build` step with TypeScript errors
- **Root Cause**: Type error in Google AdWords analytics page (`src/app/dashboard/analytics/google-adwords/page.tsx:435`)
- **Error**: `.charAt()` and `.slice()` methods called on `NameType` which can be a number
- **Solution**: Added `String()` conversion: `String(name).charAt(0).toUpperCase() + String(name).slice(1)`
- **Impact**: Deployment now succeeds without TypeScript build errors

### Build Configuration Enhancement  
- **Issue**: ESLint configuration prompts during Railway builds causing hangs
- **Solution**: Updated `next.config.js` to set `eslint.ignoreDuringBuilds: true`
- **Benefit**: Prevents interactive ESLint setup prompts in automated build environments
- **Files Modified**: `next.config.js` - ESLint configuration for production builds

### Local Development Build Issues
- **Issue**: File permission locks on `.next/trace` and Prisma query engine files during local builds
- **Cause**: Multiple development servers or processes holding file locks
- **Workaround**: Stop all dev servers before building, or restart development environment
- **Note**: Railway deployment environment isolated from local file lock issues

### Key Improvements
1. **Production Deployment Stability**: TypeScript errors resolved for reliable Railway deployments
2. **Build Process Optimization**: ESLint configuration prevents build interruptions
3. **Error Handling**: Better type safety in Recharts formatter functions
4. **Development Workflow**: Clear separation between local development and production build processes

### Files Modified (Deployment Fix)
- `src/app/dashboard/analytics/google-adwords/page.tsx` - Fixed type conversion in Recharts formatter
- `next.config.js` - Updated ESLint build configuration

### Deployment Status
- ✅ **Complete**: Railway deployment now succeeds consistently
- ✅ **Complete**: TypeScript build errors resolved
- ✅ **Complete**: ESLint configuration optimized for CI/CD
- ✅ **Verified**: Production application running successfully

## Recent Updates (2025-09-12) - Delete All Timeline Events Feature

### Timeline Bulk Deletion Enhancement
- **Feature**: Added "Delete All" button for timeline events with safety confirmation modal
- **Location**: Project detail page (`/dashboard/projects/[id]`) timeline section header
- **Safety**: Confirmation modal with clear warnings and event count display
- **Implementation**: Frontend component updates with new API endpoint for bulk deletion

### Delete All Timeline Events Components
- **UI Button**: Red-themed "Delete All" button with delete_sweep icon in timeline header
- **Confirmation Modal**: 
  - Shows exact count of events to be deleted
  - Warning message stating action cannot be undone
  - Cancel and Delete All Events action buttons
  - Loading state during deletion process
- **API Endpoint**: `/api/timeline/events/bulk-delete`
  - Verifies user ownership of project
  - Deletes all timeline events for specified project
  - Returns count of deleted events

### Files Modified (Delete All Timeline Events)
- `src/components/timeline/TimelineDisplay.tsx` - Added Delete All button, modal, and handler functions
- `src/app/api/timeline/events/bulk-delete/route.ts` - New API endpoint for bulk deletion
- `src/app/globals.css` - Added styles for Delete All button and confirmation modal

### User Experience Features
- **Visual Distinction**: Red color scheme clearly indicates destructive action
- **Safety First**: Requires deliberate confirmation through modal interaction
- **User Feedback**: Loading states and success confirmation
- **Access Control**: Only project owner can delete timeline events

## Recent Updates (2025-09-12) - Help & Documentation System Implementation

### Comprehensive Help & Documentation System
- **Feature**: Interactive help system with clickable titles and detailed documentation drawer
- **User Control**: Toggle-based system using the info icon in the sidebar header for intuitive enable/disable
- **Coverage**: Complete documentation across all major application components and data cards

### Architecture & Components
- **Context System**: React Context API for global help state management with localStorage persistence
- **DocumentedTitle Component**: Reusable component that makes any title clickable when help is enabled
- **Left-Hand Drawer**: Slide-in documentation panel with comprehensive component explanations
- **Visual Indicators**: Help icons appear next to documented titles when system is enabled

### Help Toggle Implementation
- **Location**: Info icon in expanded sidebar header (next to settings and user icons)
- **Visual States**: 
  - Disabled: Gray info icon with normal styling
  - Enabled: Accent color info icon with hover effects
- **Persistence**: User preference stored in localStorage across sessions
- **Event System**: Custom events for cross-component communication

### Documentation Content Structure
Each documented component includes:
- **Goal**: Purpose and objective of the component
- **Logic**: How data is processed and displayed
- **Data Source**: API endpoints, database queries, and data origins  
- **Calculations**: Specific formulas and computation methods
- **Filters**: Available user controls and options
- **Examples**: Real-world usage scenarios and empty states

### Components with Help Documentation

#### Home Dashboard (`/`)
1. **Platform Performance Analytics**
   - Monthly engagement metrics across advertising platforms
   - Recharts integration with trend analysis and platform comparison
   - Mock data structure for Google AdWords, Facebook, Instagram, TikTok

2. **Daily Manifest**  
   - Today's scheduled timeline events from `/api/timeline/today`
   - Time formatting, priority indicators, project relationships
   - Event types: milestones, tasks, meetings, deadlines, releases

3. **Tomorrow's Milestones**
   - Critical milestones and deadlines from `/api/timeline/tomorrow`  
   - Filtered for milestone-type events only (milestones, deadlines, releases)
   - Collapsible interface with status indicators

4. **Overdue Events**
   - Past-due items from `/api/timeline/overdue`
   - Urgency levels based on days overdue and project priority
   - Smart display limiting (first 3 with "Show More" option)

#### Projects Dashboard (`/dashboard/projects`) 
1. **Project Statistics**
   - Real-time project counts by status (Active, Completed, Planning, On Hold)
   - Status mapping and color-coding system
   - Total project count and budget aggregation

2. **Filter & Search**
   - Client-side filtering with multiple criteria (status, priority, type)
   - Case-insensitive search across names and descriptions  
   - Combined AND logic for multiple filters

3. **All Projects Table**
   - Sortable columns with ascending/descending toggle
   - Progress calculation based on status mapping
   - Team member display with overflow indicators

#### Analytics Dashboard (`/dashboard/analytics/google-adwords`)
1. **Connection Status**
   - Real-time API connection testing with stored credentials
   - Visual status indicators (Connected/Error/Disconnected)
   - Integration with API configuration system

2. **Key Metrics**
   - Google AdWords performance indicators with period comparisons
   - CTR, CVR, CPC, CPA calculations and formatting
   - Time range selection with automatic data refresh

### Technical Implementation

#### File Structure Extensions
```
src/
├── contexts/
│   └── HelpDocumentationContext.tsx    # Global help state management
├── components/
│   └── help/
│       ├── DocumentedTitle.tsx          # Clickable title component  
│       └── HelpDocumentationDrawer.tsx  # Left-hand documentation panel
├── data/
│   └── helpDocumentation.ts             # Comprehensive documentation content
└── app/globals.css                      # Help system styling and animations
```

#### Integration Points
- **Dashboard Layout**: HelpDocumentationProvider wrapper for context access
- **Home Page**: Standalone provider integration for non-dashboard pages
- **Sidebar**: Info icon toggle with visual state management
- **Component Updates**: 8 major components updated with DocumentedTitle integration

### User Experience Features
- **Intuitive Toggle**: Info icon naturally suggests help/documentation functionality
- **Visual Feedback**: Clear enabled/disabled states with accent color integration
- **Smooth Animations**: Slide-in drawer with fade animations and backdrop
- **Responsive Design**: Mobile-optimized drawer sizing and interaction
- **Keyboard Accessibility**: Full keyboard navigation and focus management
- **Performance**: Lazy loading of documentation content and efficient state management

### CSS & Styling Enhancements
- **Theme Integration**: Uses existing CSS custom properties for consistent theming
- **Material Icons**: Prevents text selection issues with user-select: none
- **Clickable States**: Hover effects and focus states for documented titles
- **Z-Index Management**: Proper layering for drawer and backdrop elements
- **Mobile Responsiveness**: Adaptive drawer width and header sizing

### Development Considerations
- **Type Safety**: Comprehensive TypeScript interfaces for documentation structure
- **Error Handling**: Graceful fallbacks when context is unavailable
- **Cross-Component Communication**: Custom events for sidebar-to-context communication
- **Performance**: Minimal bundle impact with selective imports and lazy initialization
- **Maintainability**: Centralized documentation content for easy updates

### Key Benefits
1. **User Education**: New users can quickly understand complex application logic
2. **Transparency**: Clear visibility into data sources, calculations, and business rules
3. **Onboarding**: Reduces learning curve for sophisticated features
4. **Documentation**: Living documentation that stays synchronized with code
5. **Professional Polish**: Enterprise-level help system enhancing overall UX

### Files Created/Modified (Help & Documentation System)
- `src/contexts/HelpDocumentationContext.tsx` - Global help state management with localStorage
- `src/components/help/DocumentedTitle.tsx` - Reusable clickable title component
- `src/components/help/HelpDocumentationDrawer.tsx` - Left-hand documentation panel
- `src/data/helpDocumentation.ts` - Comprehensive documentation content definitions
- `src/components/layout/sidebar.tsx` - Info icon toggle integration with visual feedback
- `src/app/dashboard/layout.tsx` - HelpDocumentationProvider wrapper for dashboard pages
- `src/app/page.tsx` - Standalone provider integration for home page
- `src/app/globals.css` - Complete styling system for help components and interactions

### Component Updates (DocumentedTitle Integration)
- `src/app/dashboard/projects/ProjectsContent.tsx` - Projects statistics, filters, and table
- `src/app/dashboard/analytics/google-adwords/page.tsx` - Connection status and key metrics
- `src/components/dashboard/PlatformPerformanceChart.tsx` - Performance analytics chart
- `src/components/dashboard/DailyManifest.tsx` - Today's timeline events
- `src/components/dashboard/TomorrowMilestones.tsx` - Tomorrow's milestone tracking  
- `src/components/dashboard/OverdueEvents.tsx` - Overdue item management

This application is production-ready with a complete authentication system, project management features, Railway deployment configuration, and comprehensive help & documentation system.