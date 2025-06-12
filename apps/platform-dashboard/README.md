# Platform Entrypoint Dashboard

The central hub for the Ganger Platform, providing unified access to all applications, personalized dashboard widgets, and real-time system status.

## Features

- **Unified Application Launcher**: Quick access to all Ganger Platform applications
- **Personalized Dashboard**: Customizable widget layout with drag & drop functionality
- **Real-time Notifications**: Live updates from across the platform
- **Global Search**: Search across applications and help content
- **Team Activity**: View team presence and activity feeds
- **Quick Actions**: Common tasks accessible from the dashboard
- **Mobile Responsive**: Optimized experience for all device sizes

## Technology Stack

- **Frontend**: Next.js 14 with React 18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with design system tokens
- **UI Components**: @ganger/ui component library
- **Authentication**: @ganger/auth with Google OAuth
- **Real-time**: Supabase subscriptions
- **Drag & Drop**: react-beautiful-dnd

## Development

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Run linting
npm run lint
```

## Architecture

This application follows the Ganger Platform standards:

- **Client-only components** use 'use client' directive
- **Shared packages** via @ganger/* imports
- **No custom authentication** - uses @ganger/auth exclusively
- **No custom UI components** - uses @ganger/ui exclusively
- **Performance budgets** enforced via automated testing

## URL

- **Development**: http://localhost:3007
- **Production**: https://dashboard.gangerdermatology.com