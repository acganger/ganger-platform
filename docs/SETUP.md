# Ganger Platform Setup Guide

This guide will help you set up the Ganger Platform development environment.

## Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** (v18 or later)
- **npm** (v8 or later)
- **Docker** (for Supabase local development)
- **Git**
- **Google Cloud CLI** (for deployment)

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

Copy the environment template and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your specific configuration:

```bash
# Required for local development
DATABASE_URL="postgresql://postgres:password@localhost:54322/postgres"
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="your-local-anon-key"

# Required for production
GOOGLE_CLOUD_PROJECT_ID="your-gcp-project-id"
GAE_APPLICATION="your-gae-application-id"
```

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
- Staff Management app on http://localhost:3001
- Lunch System app on http://localhost:3002
- L10 Platform app on http://localhost:3003

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
│   ├── staff/              # Staff Management Application
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   ├── lunch/              # Lunch System Application
│   └── l10/               # L10 Platform Application
├── packages/
│   ├── ui/                 # Shared UI Components
│   │   ├── src/
│   │   └── package.json
│   ├── auth/              # Authentication Utilities
│   ├── db/                # Database Schema & Client
│   ├── config/            # Shared Configuration
│   └── utils/             # Shared Utilities
├── supabase/
│   ├── migrations/        # Database Migrations
│   ├── functions/         # Edge Functions
│   └── config/           # Supabase Configuration
├── docs/                  # Documentation
├── scripts/              # Build & Deployment Scripts
├── .github/              # GitHub Actions Workflows
├── package.json          # Root Package Configuration
├── turbo.json           # Turborepo Configuration
└── .env                 # Environment Variables
```