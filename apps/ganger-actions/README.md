# Ganger Actions - Employee Hub

Comprehensive employee portal with all staff functionality for Ganger Dermatology.

## 🚀 Deployment Status

**Live URL**: https://ganger-actions-7zveihttb-ganger.vercel.app  
**Status**: ✅ DEPLOYED  
**Last Updated**: January 7, 2025

## Overview

Ganger Actions is the primary employee portal providing access to all staff forms, user management, and internal tools. It replaces the legacy PHP application with a modern, secure, and scalable solution.

## ✅ Completed Features

### Authentication
- NextAuth.js with Google OAuth
- Domain restriction to @gangerdermatology.com
- Secure session management
- Role-based access control

### Form System (All 7 Types)
All forms have been updated to match the legacy PHP field names exactly:

1. **Support Tickets** - IT/facility/admin issues
2. **Time-Off Requests** - PTO and leave management
3. **Punch Fix Requests** - Time clock corrections
4. **Availability Changes** - Schedule modifications
5. **Expense Reimbursements** - Business expense claims
6. **Meeting Requests** - Schedule meetings with staff
7. **Impact Filters** - Strategic decision evaluation

### Database
- Fully migrated to Supabase PostgreSQL
- Comprehensive schema with tickets, comments, approvals
- Row Level Security (RLS) on all tables
- Full-text search capabilities

### User Management (Phase 4)
- ✅ Database schema with roles and permissions
- ✅ API endpoints for user listing and creation
- ✅ Manager-employee relationships
- ✅ Department structure
- ✅ Activity logging for audit trails
- 🔄 UI connection to real data (in progress)

## 🔄 In Progress

### Phase 4: User Management
- Connecting existing UI to API endpoints
- Individual user profile pages
- User editing functionality
- Google Workspace integration

### Phase 3: Dashboard & Tickets
- Ticket listing and management
- Dashboard analytics
- Ticket filtering and search

## Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth.js
- **Database**: Supabase (PostgreSQL)
- **Forms**: React Hook Form + Zod validation
- **API**: Next.js API routes

### Database Schema

#### Main Tables
- `tickets` - All form submissions
- `user_profiles` - Employee information
- `user_permissions` - Role-based access
- `manager_assignments` - Reporting structure
- `departments` - Organizational units
- `user_activity_log` - Audit trail

See [User Management Schema Documentation](/true-docs/database/user-management-schema.md) for details.

### API Endpoints

#### Authentication
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signin` - Google OAuth signin
- `POST /api/auth/signout` - Sign out

#### Tickets
- `GET /api/tickets` - List tickets (with filters)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/[id]` - Get ticket details
- `PUT /api/tickets/[id]` - Update ticket
- `POST /api/tickets/[id]/comments` - Add comment

#### Users
- `GET /api/users` - List users (admin/manager only)
- `POST /api/users` - Create user (admin/manager only)
- `GET /api/users/[id]` - Get user profile
- `PUT /api/users/[id]` - Update user

## Development

### Setup
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env .env.local

# Run development server
pnpm dev
```

### Environment Variables
Required variables in `.env.local`:
```
# NextAuth
NEXTAUTH_URL=http://localhost:3010
NEXTAUTH_SECRET=your-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Database
DATABASE_URL=your-database-url
```

### Commands
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript checks
```

## Deployment

The app is configured for Vercel deployment:

1. Push to GitHub
2. Vercel automatically builds and deploys
3. Environment variables are configured in Vercel dashboard

### Build Configuration
- Framework: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install`

## Security

- Authentication required for all pages
- Google OAuth with domain restriction
- Row Level Security on database
- CSRF protection on forms
- Secure session cookies
- Input validation with Zod

## Contributing

1. Create feature branch
2. Make changes
3. Run tests and type checks
4. Submit pull request

## Support

For issues or questions:
- Create GitHub issue
- Contact IT team
- Check documentation in `/true-docs`