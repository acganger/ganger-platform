# Ganger Platform Setup Guide

Complete setup instructions for the Ganger Platform development environment.

## Prerequisites

**Verified Environment (June 5, 2025):**
- **Node.js**: v22.16.0 (18+ required)
- **npm**: 10.9.2 (9+ required)  
- **Docker**: For Supabase local development
- **Git**: 2.34.1+
- **Claude Code**: Run `./claude_permissions_script.sh` for permissions

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ganger-platform
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies for the monorepo and all packages.

### 3. Environment Configuration

**⚠️ SECURITY NOTICE: Secret Management Transition**
The platform is transitioning to enterprise-grade secret management. See [Secret Management PRD](../PRDs/06_SECRET_MANAGEMENT_SYSTEM.md) for complete implementation details.

**Current Development Setup:**
Copy the environment template and configure your variables:

```bash
cp .env.example .env
```

**⚠️ CRITICAL: Never commit .env files to version control**

Edit `.env` with your specific configuration:

```bash
# Database Configuration (Development Only)
DATABASE_URL="postgresql://postgres:password@localhost:54322/postgres"
DIRECT_URL="postgresql://postgres:password@localhost:54322/postgres"

# Supabase Configuration (Development Only - Production uses Google Secret Manager)
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Payment Processing (Development Only - MCP Integration)
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio Communication (Development Only - MCP Integration)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Google OAuth & Workspace (Development Only)
GOOGLE_CLIENT_ID=745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_DOMAIN=gangerdermatology.com

# Cloudflare Configuration (Development Only)
CLOUDFLARE_ZONE_ID=ba76d3d3f41251c49f0365421bd644a5
CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf

# Application URLs
NEXT_PUBLIC_STAFF_URL=https://staff.gangerdermatology.com
NEXT_PUBLIC_LUNCH_URL=https://lunch.gangerdermatology.com
NEXT_PUBLIC_L10_URL=https://l10.gangerdermatology.com

# Secret Management (Production)
# Production secrets are managed via Google Secret Manager
# See: ../PRDs/06_SECRET_MANAGEMENT_SYSTEM.md
```

**✅ Security Best Practices:**
- ✅ `.env` is in `.gitignore` (never committed)
- ✅ Development secrets are separate from production
- ✅ Production uses Google Secret Manager
- ✅ CI/CD uses GitHub Secrets as backup

### 4. Start Supabase

Start the local Supabase stack:

```bash
npm run supabase:start
```

This will:
- Start PostgreSQL database
- Start Supabase Auth
- Start Supabase Storage
- Start Supabase Edge Functions
- Create initial database schema

### 5. Generate Database Client

Generate the Prisma client for database access:

```bash
npm run db:generate
```

### 6. Start Development Servers

Start all applications in development mode:

```bash
npm run dev
```

This will start:
- Inventory Management System on http://localhost:3001
- Patient Handouts Generator on http://localhost:3002
- Check-in Kiosk on http://localhost:3003

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the appropriate app or package

3. **Run quality checks:**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a pull request** on GitHub

### Database Changes

1. **Modify the schema** in `packages/db/prisma/schema.prisma`

2. **Generate migration:**
   ```bash
   npm run db:migrate
   ```

3. **Apply changes:**
   ```bash
   npm run db:push
   ```

4. **Regenerate client:**
   ```bash
   npm run db:generate
   ```

### Adding New Packages

To add a new shared package:

1. **Create the package directory:**
   ```bash
   mkdir packages/your-package
   cd packages/your-package
   ```

2. **Initialize package.json:**
   ```bash
   npm init -y
   ```

3. **Add the package to the workspace** in the root `package.json`

4. **Install from other packages:**
   ```bash
   npm install @ganger/your-package
   ```

## Production Deployment

### Google Cloud Platform Setup

1. **Install Google Cloud CLI:**
   ```bash
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   ```

2. **Authenticate:**
   ```bash
   gcloud auth login
   gcloud config set project your-project-id
   ```

3. **Enable required APIs:**
   ```bash
   gcloud services enable appengine.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

### Deployment Process

1. **Build applications:**
   ```bash
   npm run build
   ```

2. **Deploy to staging:**
   ```bash
   npm run deploy:staging
   ```

3. **Deploy to production:**
   ```bash
   npm run deploy:production
   ```

### GitHub Actions Setup

Configure the following secrets in your GitHub repository:

- `GCP_PROJECT_ID` - Your Google Cloud project ID
- `GAE_APPLICATION` - Your App Engine application ID
- `GCP_SA_KEY` - Base64 encoded service account key JSON

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Check if ports 3001-3003 are available
   - Modify port configuration in individual app configs

2. **Supabase connection issues:**
   - Ensure Docker is running
   - Restart Supabase: `npm run supabase:stop && npm run supabase:start`

3. **Build failures:**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear Turbo cache: `npm run clean`

4. **Database issues:**
   - Reset local database: `npm run supabase:reset`
   - Regenerate Prisma client: `npm run db:generate`

### Getting Help

- Check the main [README.md](../README.md) for overview
- Review individual app documentation in their respective directories
- Check GitHub Issues for known problems
- Contact the development team

## Project Structure

```
ganger-platform/
├── apps/
│   ├── inventory/          # ✅ Inventory Management System (Production Ready)
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   ├── handouts/          # ✅ Patient Handouts Generator (Production Ready)
│   ├── checkin-kiosk/     # ✅ Check-in Kiosk (Production Ready)
│   ├── staff/             # 📋 Staff Management Application (Phase 2)
│   ├── lunch/             # 📋 Lunch System Application (Phase 2)
│   └── l10/               # 📋 L10 Platform Application (Phase 2)
├── packages/
│   ├── ui/                # Shared UI Components (13 production-ready components)
│   │   ├── src/
│   │   └── package.json
│   ├── auth/              # Authentication Utilities (Google OAuth + roles)
│   ├── db/                # Database Schema & Client (Supabase + repositories)
│   ├── integrations/      # ✅ Universal Service Hubs with MCP Integration
│   │   ├── communication/ # ✅ Universal Communication Hub (Twilio MCP)
│   │   ├── payments/      # ✅ Universal Payment Hub (Stripe MCP)
│   │   ├── database/      # ✅ Enhanced Database Client (Supabase MCP)
│   │   ├── google/        # Google API integrations
│   │   ├── email/         # Email service clients
│   │   └── pdf/           # PDF generation services
│   ├── config/            # Shared Configuration (ESLint, TypeScript, Tailwind)
│   └── utils/             # Shared Utilities (Validation, formatting, analytics)
├── mcp-servers/           # 🚀 7 MCP servers for development acceleration
│   ├── supabase-mcp/      # ✅ INTEGRATED - Database operations
│   ├── agent-toolkit/     # ✅ INTEGRATED - Stripe payment processing
│   ├── twilio-mcp/        # ✅ INTEGRATED - HIPAA-compliant communication
│   ├── github-mcp-server/ # Available - Repository management
│   ├── mcp-server-cloudflare/ # Available - Workers deployment
│   ├── cloud-run-mcp/     # Available - Containerized microservices
│   └── mcp-servers-official/ # Available - Filesystem operations
├── supabase/
│   ├── migrations/        # 7 production-ready migration files
│   ├── functions/         # Edge functions
│   └── config/            # Supabase configuration
├── docs/                  # Documentation + MCP integration guide
├── scripts/              # Build & Deployment Scripts
├── .github/              # GitHub Actions Workflows
├── package.json          # Root Package Configuration
├── turbo.json            # Turborepo Configuration
└── .env                  # Environment Variables
```