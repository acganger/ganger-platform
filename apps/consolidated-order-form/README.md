# Consolidated Order Form

Simplified medical supply ordering interface for clinical staff at Ganger Dermatology.

## Overview

The Consolidated Order Form provides a standardized, user-friendly interface for clinical staff to request medical supplies without needing to know vendor details or navigate complex procurement systems.

## Features

- **Standardized Product Catalog**: Pre-populated with frequently ordered items
- **Smart Categories**: Organized by supply type (Gloves/PPE, Wound Care, etc.)
- **Usage-Based Suggestions**: Auto-populate quantities based on historical patterns
- **Mobile-Optimized**: Works on tablets and phones in clinical areas
- **Department Tracking**: Know which department is requesting supplies
- **Simplified Workflow**: Submit orders for buyer optimization

## Target Users

- Nurses and Medical Assistants
- Clinical staff who identify supply needs
- Staff without procurement system access
- Mobile users in patient care areas

## Tech Stack

- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Supabase for database and auth
- Shared Ganger Platform packages

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check
```

## Deployment

This app follows the standard Ganger Platform deployment process via Vercel.