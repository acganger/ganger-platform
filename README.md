# Ganger Platform

A comprehensive monorepo containing three integrated business applications:

- **Staff Management System** - Employee management, scheduling, and HR tools
- **Lunch System** - Food ordering and delivery management
- **L10 Platform** - Localization and internationalization management

## Architecture

This is a Turborepo monorepo with the following structure:

```
ganger-platform/
├── apps/
│   ├── staff/          # Staff Management Next.js app
│   ├── lunch/          # Lunch System Next.js app
│   └── l10/           # L10 Platform Next.js app
├── packages/
│   ├── ui/            # Shared UI components
│   ├── auth/          # Authentication utilities
│   ├── db/            # Database schemas and utilities
│   ├── config/        # Shared configuration
│   └── utils/         # Shared utilities
├── supabase/
│   ├── migrations/    # Database migrations
│   ├── functions/     # Edge functions
│   └── config/        # Supabase configuration
└── docs/              # Documentation
```

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd ganger-platform
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start Supabase (requires Docker):**
   ```bash
   npm run supabase:start
   ```

4. **Run all applications in development:**
   ```bash
   npm run dev
   ```

5. **Access the applications:**
   - Staff Management: http://localhost:3001
   - Lunch System: http://localhost:3002
   - L10 Platform: http://localhost:3003

## Available Scripts

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps for production
- `npm run lint` - Run ESLint across all packages
- `npm run test` - Run tests across all packages
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean all build artifacts

## Database Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Supabase Scripts

- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:status` - Check Supabase status
- `npm run supabase:reset` - Reset local database

## Deployment

The platform is configured for deployment to Google Cloud Platform using App Engine:

- `npm run deploy:staging` - Deploy to staging environment
- `npm run deploy:production` - Deploy to production environment

## Technology Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS
- **Build Tool:** Turborepo
- **Deployment:** Google Cloud Platform (App Engine)
- **CI/CD:** GitHub Actions

## Documentation

For detailed setup and development instructions, see [docs/SETUP.md](./docs/SETUP.md).

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm run type-check`
4. Create a pull request

## License

Private - All rights reserved.