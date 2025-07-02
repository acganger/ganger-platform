# Ganger Actions - Staff Portal & App Launcher

The central hub for all Ganger Dermatology staff applications, providing unified access to the entire platform ecosystem.

## Overview

Ganger Actions serves as the main portal and router for the Ganger Platform's distributed architecture. It provides:
- Centralized authentication for all staff applications
- Dynamic routing to individual app deployments
- Platform-wide navigation and app discovery
- Real-time status monitoring
- Unified user experience across all tools

## Architecture

### Distributed Deployment Model
```
staff.gangerdermatology.com (Ganger Actions)
├── /inventory → inventory-[hash].vercel.app
├── /handouts → handouts-[hash].vercel.app
├── /l10 → eos-l10-[hash].vercel.app
├── /batch → batch-closeout-[hash].vercel.app
└── ... (15+ more apps with individual deployments)
```

### Key Components

1. **Edge Middleware Router** (`middleware.ts`)
   - Routes requests to appropriate app deployments
   - Manages authentication cookie passing
   - Handles SSO between applications
   - Uses Vercel Edge Config for dynamic URL management

2. **App Dashboard** (`src/pages/index.tsx`)
   - Visual launcher for all platform applications
   - Real-time status indicators
   - Search and filtering capabilities
   - Usage statistics and analytics

3. **Authentication Layer**
   - Google OAuth with domain restrictions
   - Session management across apps
   - Role-based access control

## Available Applications

### Staff Management
- Time Off Requests
- Support Tickets
- User Management (Admin)
- Employee Directory

### Core Medical Applications
- Inventory Management
- Patient Handouts
- Check-in Kiosk Admin
- Medication Authorization

### Business Operations
- EOS L10 Management
- Rep Scheduling Admin
- Call Center Operations
- Batch Closeout

### Platform Administration
- Social Media & Reviews
- Clinical Staffing
- Compliance Training
- Platform Dashboard
- Configuration
- Component Showcase
- Integration Status

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Routing**: Vercel Edge Middleware
- **Authentication**: Supabase Auth with Google OAuth
- **UI**: Tailwind CSS with custom components
- **State Management**: React hooks
- **Icons**: Lucide React
- **Deployment**: Vercel with Edge Config

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- Access to Vercel and Supabase projects

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with:
- Supabase credentials
- Google OAuth settings
- Vercel Edge Config URL
- Other platform services

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3011](http://localhost:3011)

## Deployment

### Vercel Configuration
```json
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm -F @ganger/ganger-actions build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Environment Variables Required
- `EDGE_CONFIG_202507_1` - Vercel Edge Config connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- All other standard platform environment variables

## Middleware Configuration

The middleware is critical for the distributed architecture. It:
1. Reads app URLs from Vercel Edge Config
2. Routes incoming requests to appropriate deployments
3. Passes authentication cookies for SSO
4. Falls back to "coming soon" pages for undeployed apps

## Security

- All routes require authentication
- Google OAuth restricted to @gangerdermatology.com domain
- CSRF protection enabled
- Secure session management
- HTTPS only in production

## Contributing

1. Never remove or disable the middleware.ts file
2. Update Edge Config when deploying new apps
3. Maintain consistent authentication patterns
4. Follow the established UI/UX patterns
5. Test routing changes thoroughly

## Support

For issues or questions:
- Check the main platform documentation
- Review deployment logs in Vercel
- Contact the platform team

---

**Version**: 1.6.0  
**Last Updated**: January 2025  
**Maintained By**: Ganger Platform Team