# Deployment Risk Mitigation Guide

## Table of Contents
- [Configuration & Setup Risk Mitigation](#1-configuration--setup-risk-mitigation)
- [Build & Deployment Risk Mitigation](#2-build--deployment-risk-mitigation)
- [Application & Runtime Risk Mitigation](#3-application--runtime-risk-mitigation)
- [Process & Compliance Risk Mitigation](#4-process--compliance-risk-mitigation)
- [Critical Success Factors](#critical-success-factors)
- [Risk Matrix](#risk-matrix)
- [Go/No-Go Checklist](#gono-go-checklist)
- [Final Recommendation](#final-recommendation)
- [Related Documentation](#related-documentation)

Based on deployment engineer's risk assessment, here's how to address each category of risk:

## 1. Configuration & Setup Risk Mitigation

### Managing 20+ Projects
- **Use deployment-urls.json** as single source of truth
- **Script all operations** - never manually configure
- **Create project naming convention**: `ganger-{app-name}`
- **Document every URL** immediately after deployment

### Environment Variable Management
```bash
# Before deployment
✓ Create deployment-env.secret from template
✓ Use same file for all deployments
✓ Never commit .env files
✓ Use script's set_env_vars() function for consistency
```

### Routing Configuration Checklist
- [ ] Test each rewrite rule individually
- [ ] Check for overlapping patterns
- [ ] Verify no route conflicts
- [ ] Test basePath settings per app:
  ```bash
  # Quick test for each app
  curl -I https://staff.gangerdermatology.com/inventory
  curl -I https://staff.gangerdermatology.com/inventory/dashboard
  ```

## 2. Build & Deployment Risk Mitigation

### Prevent Build Failures
```json
// In each app's package.json
{
  "engines": {
    "node": ">=18.0.0 <19.0.0",  // Pin to specific range
    "pnpm": "9.0.0"               // Exact version
  }
}
```

### Deployment Rollback Plan
```bash
# Document deployment versions
echo "$(date): Deployed version X.Y.Z" >> deployment-log.txt

# Quick rollback script
vercel rollback [deployment-url] --token=$VERCEL_TOKEN
```

## 3. Application & Runtime Risk Mitigation

### Authentication Checklist
- [ ] Set cookie domain to `.gangerdermatology.com`
- [ ] Test cross-app navigation maintains session
- [ ] Verify logout works across all apps
- [ ] Check session timeout consistency

### API & Navigation Audit
```javascript
// Add to pre-deployment check
const checkForLocalhost = () => {
  // Already implemented
};

const checkForRelativeAPIs = () => {
  // Search for fetch("/api") vs fetch("https://")
};
```

### Performance Monitoring
```bash
# Add to post-deployment verification
lighthouse https://staff.gangerdermatology.com/inventory \
  --output=json \
  --output-path=./lighthouse-results.json
```

### Security Audit Commands
```bash
# Check for outdated dependencies
pnpm audit --audit-level=moderate

# HIPAA compliance check for medical apps
grep -r "patient\|medical\|health" apps/medication-auth/src \
  --include="*.ts" --include="*.tsx" | \
  grep -v "encrypted\|hashed"
```

## 4. Process & Compliance Risk Mitigation

### Deployment Checklist Enforcement
```javascript
// Add to deployment script
const preflightCheck = () => {
  if (!fs.existsSync('deployment-env.secret')) {
    console.error('❌ Missing deployment-env.secret');
    process.exit(1);
  }
  
  // Run all checks
  execSync('node scripts/pre-deployment-check.js');
};
```

### Post-Deployment Verification Script
```bash
#!/bin/bash
# scripts/verify-deployment.sh

APPS=("inventory" "handouts" "l10" "meds" "kiosk")
FAILED=0

for app in "${APPS[@]}"; do
  echo "Testing $app..."
  
  # Test direct access
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://ganger-$app.vercel.app")
  
  if [ "$STATUS" != "200" ]; then
    echo "❌ $app direct access failed: $STATUS"
    FAILED=$((FAILED + 1))
  fi
  
  # Test via router
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://staff.gangerdermatology.com/$app")
  
  if [ "$STATUS" != "200" ]; then
    echo "❌ $app router access failed: $STATUS"
    FAILED=$((FAILED + 1))
  fi
done

if [ $FAILED -gt 0 ]; then
  echo "❌ $FAILED tests failed!"
  exit 1
fi

echo "✅ All apps accessible!"
```

### Documentation Update Checklist
- [ ] Update deployment-urls.json
- [ ] Update CLAUDE.md with new URLs
- [ ] Create deployment runbook with:
  - [ ] Exact commands used
  - [ ] Any workarounds needed
  - [ ] Rollback procedures
- [ ] Update team wiki/docs

## Critical Success Factors

### 1. **Never Skip Pre-Deployment Validation**
```bash
# Make it mandatory
npm run deploy  # Should run validation first
```

### 2. **Test Authentication Flow End-to-End**
```bash
# Automated auth test
node scripts/test-auth-flow.js
```

### 3. **Monitor First 24 Hours**
- Set up Vercel monitoring alerts
- Check error logs hourly
- Monitor user feedback channels

### 4. **Create "Break Glass" Procedures**
```bash
# Emergency rollback all apps
./scripts/emergency-rollback.sh

# Switch to maintenance mode
./scripts/enable-maintenance.sh
```

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Environment variable mismatch | Medium | High | Automated script + verification |
| Route configuration error | Medium | High | Pre-deployment testing |
| Authentication break | Low | Critical | Extensive testing + monitoring |
| Build failure | Medium | Medium | Rollback capability |
| Performance degradation | Low | Medium | Lighthouse monitoring |

## Go/No-Go Checklist

Before proceeding with production deployment:

- [ ] All 20+ apps pass pre-deployment checks
- [ ] Environment variables verified (no hardcoded secrets)
- [ ] Authentication tested across apps
- [ ] Performance benchmarks met (Lighthouse > 80)
- [ ] Rollback plan documented and tested
- [ ] Team notified of deployment window
- [ ] Monitoring alerts configured
- [ ] "Break glass" procedures ready

## Final Recommendation

**Deploy in phases:**
1. **Phase 1**: Deploy 2-3 low-risk apps first
2. **Phase 2**: Monitor for 24 hours
3. **Phase 3**: Deploy remaining apps in batches
4. **Phase 4**: Deploy staff portal router last

This phased approach reduces risk while maintaining the automated deployment benefits.

## Related Documentation

- **Previous**: [Vercel Deployment Checklist](./03-deployment-checklist.md)
- **Next**: [Deployment Improvements Summary](./05-improvements-summary.md)
- **Overview**: [Back to Index](./README.md)