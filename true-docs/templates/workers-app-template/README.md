# [APP_NAME] - Ganger Platform Application

## Overview
[APP_DESCRIPTION]

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Deploy to Cloudflare Workers
wrangler deploy --config wrangler.jsonc --env production
```

## Configuration

### Environment Variables
- `APP_NAME`: Application identifier
- `APP_PATH`: URL path for staff portal routing
- `STAFF_PORTAL_URL`: Base URL for staff portal

### Template Variables to Replace
- `[APP_NAME]` → your-app-name
- `[APP_PATH]` → your-app-path
- `[APP_SLUG]` → your-app-slug
- `[APP_DESCRIPTION]` → "Description of your app"

## Architecture
- **Framework**: Next.js 14 with App Router
- **Runtime**: Cloudflare Workers Edge Runtime
- **Authentication**: @ganger/auth with staff portal integration
- **UI Components**: @ganger/ui design system
- **Deployment**: Cloudflare Workers with staff.gangerdermatology.com routing

## Development Guidelines
- Use only @ganger/* packages for UI, auth, and integrations
- Follow Workers-compatible configuration (no static export)
- Implement StaffPortalLayout for consistent navigation
- Use TypeScript with strict mode enabled
