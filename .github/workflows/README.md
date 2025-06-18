# 🚀 GitHub Actions CI/CD Pipeline Documentation

## Overview

The Ganger Platform uses a comprehensive GitHub Actions CI/CD pipeline that supports automated deployment of all 17 medical applications to Cloudflare Workers with quality gates, parallel builds, and health checks.

## Workflow Architecture

### Main Deployment Pipeline (`deploy.yml`)

**Trigger Events:**
- `push` to `main` branch → Production deployment (critical apps only)
- `push` to `staging` branch → Staging deployment (all apps)
- `workflow_dispatch` → Manual deployment with full control

**Pipeline Stages:**

1. **🔍 Quality Gate** - Linting, TypeScript validation, tests, application verification
2. **🏗️ Parallel Builds** - Matrix builds by priority (critical/high/medium/low)
3. **🚀 Environment Deployment** - Staging or Production with Cloudflare Workers
4. **🏥 Health Verification** - Post-deployment health checks and monitoring
5. **📊 Reporting** - Status tracking and Slack notifications

### Build Matrix Strategy

**Critical Applications (Max Parallel: 4)**
- call-center-ops, checkin-kiosk, config-dashboard
- handouts, inventory, medication-auth
- platform-dashboard, staff

**High Priority Applications (Max Parallel: 3)**
- batch-closeout, clinical-staffing, compliance-training
- eos-l10, integration-status, pharma-scheduling

**Medium/Low Priority Applications (Max Parallel: 2)**
- ai-receptionist, socials-reviews, component-showcase

## Manual Deployment Options

### Workflow Dispatch Parameters

```yaml
Environment: staging | production
Deployment Group: all | critical | high | medium | low
Force Deploy: false | true (bypass health check failures)
Skip Tests: false | true (emergency deployments only)
```

### Example Manual Deployments

**Deploy Critical Apps to Production:**
```
Environment: production
Deployment Group: critical
Force Deploy: false
Skip Tests: false
```

**Emergency Staging Deployment:**
```
Environment: staging
Deployment Group: all
Force Deploy: true
Skip Tests: true
```

## Required GitHub Secrets

### Cloudflare Configuration
```
CLOUDFLARE_API_TOKEN=<workers_deploy_token>
CLOUDFLARE_ACCOUNT_ID=<account_id>
```

### Application Environment Variables
```
SUPABASE_URL=<supabase_project_url>
SUPABASE_ANON_KEY=<supabase_anon_key>
SLACK_WEBHOOK_URL=<slack_notification_webhook>
```

### Optional Secrets (for enhanced features)
```
STRIPE_PUBLISHABLE_KEY=<stripe_public_key>
STRIPE_SECRET_KEY=<stripe_secret_key>
TWILIO_ACCOUNT_SID=<twilio_account_sid>
TWILIO_AUTH_TOKEN=<twilio_auth_token>
```

## Environment Configurations

### Staging Environment
- **URL**: https://staff-staging.gangerdermatology.com
- **Purpose**: Pre-production testing and validation
- **Deployment**: Automatic on `staging` branch push
- **Applications**: All applications deployed

### Production Environment
- **URL**: https://staff.gangerdermatology.com
- **Purpose**: Live medical platform
- **Deployment**: Automatic on `main` branch push (critical apps only)
- **Applications**: Critical priority applications only

## Build Process

### Application Build Steps

1. **Dependency Installation**: `pnpm install --frozen-lockfile`
2. **Application Build**: `pnpm run build`
3. **Workers Conversion**: `pnpm exec next-on-pages`
4. **Artifact Verification**: Check for `.vercel/output/static/_worker.js/index.js`
5. **Artifact Upload**: Store build artifacts for deployment

### Build Timeouts

- **Critical Apps**: 10 minutes
- **High Priority Apps**: 8 minutes
- **Medium/Low Apps**: 6 minutes

## Deployment Process

### Deployment Integration

The pipeline integrates with our master deployment scripts:

```bash
# Staging deployment
./deployment/scripts/deploy-master.sh -e staging deploy critical

# Production deployment
./deployment/scripts/deploy-master.sh -e production deploy critical

# Health verification
./deployment/scripts/deploy-master.sh -e production health critical
```

### Health Check Process

1. **Application Health Endpoints**: `/api/health` for each application
2. **Health Check Timeout**: 60 seconds per application
3. **Retry Logic**: 3 attempts with 10-second delays
4. **Failure Handling**: Continue on staging, fail on production

## Monitoring and Notifications

### Slack Integration

**Success Notifications Include:**
- Environment deployed to
- Applications deployed
- Git commit SHA
- Triggered by user
- Deployment timestamp

**Failure Notifications Include:**
- Error details and logs
- Failed applications
- Debugging information
- Link to GitHub Actions run

### Deployment Reports

**Automated Reports Generated:**
- Application status tracking
- Health check results
- Build performance metrics
- Deployment duration analysis

**Report Storage:**
- GitHub Actions artifacts (30-day retention)
- `/deployment/status/` directory
- Slack channel notifications

## Security and Permissions

### Workflow Permissions

```yaml
permissions:
  contents: read        # Repository access
  actions: read         # Workflow access
  deployments: write    # Environment deployments
  id-token: write      # OIDC token access
```

### Concurrency Control

```yaml
concurrency:
  group: deployment-${{ github.ref }}-${{ environment }}
  cancel-in-progress: false  # Prevent concurrent deployments
```

## Troubleshooting

### Common Issues

**Build Failures:**
- Check TypeScript compilation errors
- Verify dependency installation
- Review application-specific logs

**Deployment Failures:**
- Validate Cloudflare API tokens
- Check wrangler configuration files
- Verify Workers compatibility

**Health Check Failures:**
- Confirm application health endpoints
- Check network connectivity
- Validate environment variables

### Debug Commands

**Local Testing:**
```bash
# Test build process locally
pnpm run build
pnpm exec next-on-pages

# Test deployment scripts
./deployment/scripts/batch-verify.sh
./deployment/scripts/deploy-master.sh validate all

# Test health checks
./deployment/scripts/status-tracker.sh report staging
```

### Emergency Procedures

**Production Hotfix:**
1. Create hotfix branch from `main`
2. Apply critical fixes
3. Manual workflow dispatch to production
4. Set `force_deploy: true` if health checks fail
5. Monitor application status

**Rollback Process:**
1. Manual workflow dispatch
2. Deploy previous stable version
3. Use `force_deploy` if necessary
4. Verify system health

## Performance Metrics

### Build Performance

- **Total Build Time**: ~15-20 minutes for all applications
- **Parallel Efficiency**: 4 concurrent critical app builds
- **Cache Utilization**: npm dependency caching enabled

### Deployment Performance

- **Staging Deployment**: ~10-15 minutes
- **Production Deployment**: ~8-12 minutes (critical apps only)
- **Health Check Duration**: ~2-5 minutes

---

**Pipeline Version**: 1.0.0  
**Last Updated**: 2025-01-18  
**Maintained by**: Dev 6 - Deployment Engineering & Infrastructure Automation