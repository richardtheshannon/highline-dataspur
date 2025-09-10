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

## Troubleshooting

### Common Issues
- **Database Connection**: Ensure PostgreSQL is running and DATABASE_URL is correct
- **Authentication**: Verify OAuth provider credentials and NEXTAUTH_SECRET
- **Build Errors**: Run `npm run type-check` and fix TypeScript errors
- **Prisma Issues**: Regenerate client with `npx prisma generate`

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

This application is production-ready with a complete authentication system, project management features, and Railway deployment configuration.