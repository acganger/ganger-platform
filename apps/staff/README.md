# Staff Management System

A modern React-based staff management application for Ganger Dermatology, migrated from legacy PHP systems.

## Features

### ✅ Implemented
- **Authentication System**: Google OAuth integration with domain restrictions
- **Dashboard Layout**: Responsive design with sidebar navigation
- **Ticket Management**: Full CRUD operations for support tickets
- **Dynamic Forms**: Support tickets and time off requests
- **User Interface**: Modern, accessible components with Tailwind CSS
- **Mobile Support**: Responsive design that works on all devices

### 🚧 In Progress
- React Query integration for API state management
- Real-time subscriptions for live updates
- File upload components with progress tracking

### 📋 Planned
- Punch fix and availability change forms
- Admin user management
- Reporting and analytics
- Mobile PWA features

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Authentication**: Supabase Auth with Google OAuth
- **UI Library**: Tailwind CSS with custom components
- **State Management**: React Query + Zustand
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Deployment**: Cloudflare Workers (planned)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to Supabase project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   ├── tickets/        # Ticket management components
│   └── ui/             # Basic UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── pages/              # Next.js pages
├── stores/             # Zustand stores
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## Authentication

The app uses Google OAuth with domain restrictions to `@gangerdermatology.com` accounts only. Users are automatically redirected to the login page if not authenticated.

### User Roles
- **Staff**: Basic access to submit tickets and requests
- **Manager**: Can manage team tickets and approve requests
- **Admin**: Full system access and user management

## Forms System

The app includes a dynamic form system supporting multiple legacy form types:

### Support Tickets
- Equipment issues
- Software problems
- Network issues
- General support requests

### Time Off Requests
- Paid time off (PTO)
- Unpaid leave
- Sick leave
- Automatic business day calculation
- Holiday awareness

### Additional Forms (Planned)
- Punch fix requests
- Change of availability
- Custom form builder

## API Integration

The frontend is designed to work with the backend API endpoints:

- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/[id]` - Get ticket details
- `PUT /api/tickets/[id]` - Update ticket
- And more...

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript validation

# Testing (when implemented)
npm run test            # Run tests
npm run test:watch      # Watch mode
```

## Deployment

The app is configured for deployment to Cloudflare Workers:

1. Build the application:
```bash
npm run build
```

2. Deploy to staging:
```bash
npm run deploy:staging
```

3. Deploy to production:
```bash
npm run deploy:production
```

## Contributing

1. Follow the established code style and patterns
2. Use TypeScript for all new code
3. Ensure accessibility compliance (WCAG 2.1 AA)
4. Test on mobile devices
5. Update documentation as needed

## Security

- All API calls require authentication
- CSRF protection enabled
- Input validation with Zod schemas
- XSS prevention measures
- HTTPS only in production

## Support

For development questions or issues:
- Check the main project documentation
- Review the codebase patterns in existing components
- Follow the established TypeScript interfaces in `/types`