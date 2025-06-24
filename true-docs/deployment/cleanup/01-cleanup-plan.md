# Vercel Cleanup Plan

## 📋 Overview

This plan automates the cleanup of Vercel-related resources after migrating to the clean architecture deployment.

## 🎯 What Needs Cleanup

### 1. **Vercel Projects** (6 projects)
Based on the deployment scripts, these projects likely exist:
- `ganger-staff`
- `ganger-inventory`
- `ganger-handouts`
- `ganger-checkin-kiosk`
- `ganger-medication-auth`
- `ganger-eos-l10`

### 2. **GitHub Actions**
- `.github/workflows/deploy-vercel.yml` - Active Vercel deployment workflow

### 3. **Configuration Files**
- `apps/staff/vercel.json` - Staff app Vercel configuration
- Package.json deploy scripts referencing `.vercel/output/static`

### 4. **Documentation**
- Multiple references to Vercel in deployment docs

## 🚀 Cleanup Process

### Phase 1: Disable Active Deployments
1. **Disable GitHub Actions** - Prevent accidental deployments
2. **Archive workflow file** - Keep for reference

### Phase 2: Remove Vercel Projects
1. **List all projects** - Verify what exists
2. **Delete projects** - One by one with confirmation
3. **Document deletion** - Keep audit trail

### Phase 3: Clean Codebase
1. **Remove vercel.json files**
2. **Update package.json scripts** - Remove `.vercel` references
3. **Update documentation** - Mark Vercel sections as deprecated

### Phase 4: Security Cleanup
1. **Revoke Vercel token** - Invalidate exposed credentials
2. **Remove credentials from code** - Clean up any remaining references

## ⚠️ Important Notes

1. **Backup First** - Archive important configurations before deletion
2. **Verify Clean Architecture** - Ensure new deployment is working
3. **Team Communication** - Notify team before cleanup
4. **Gradual Process** - Can be reversed if needed

## 📊 Success Criteria

- [ ] All Vercel projects deleted
- [ ] GitHub Actions workflow disabled/removed
- [ ] No Vercel references in active code
- [ ] Documentation updated
- [ ] Security credentials revoked

## 🔗 Related Documents

- [Deployment Plan](../02-deployment-plan.md) - New architecture
- [Risk Mitigation](../04-risk-mitigation.md) - Handling issues
- [Emergency Rollback](../scripts/05-emergency-rollback.sh) - If needed