# Vercel Cleanup Scripts

## 🧹 Overview

These scripts automate the cleanup of Vercel resources after migrating to the clean architecture deployment.

## 📋 Scripts in Order

1. **[01-cleanup-plan.md](./01-cleanup-plan.md)** - Overview and strategy
2. **[02-cleanup-vercel-projects.sh](./02-cleanup-vercel-projects.sh)** - Remove Vercel projects
3. **[03-cleanup-github-actions.sh](./03-cleanup-github-actions.sh)** - Archive GitHub workflows
4. **[04-cleanup-codebase.sh](./04-cleanup-codebase.sh)** - Remove Vercel from code
5. **[05-security-cleanup.sh](./05-security-cleanup.sh)** - Revoke exposed credentials
6. **[06-run-all-cleanup.sh](./06-run-all-cleanup.sh)** - Master cleanup orchestrator

## 🚀 Quick Start

```bash
cd true-docs/deployment/cleanup
chmod +x *.sh

# Run the master script for guided cleanup
./06-run-all-cleanup.sh

# Or run individual scripts
./05-security-cleanup.sh  # Do this FIRST - security critical
./02-cleanup-vercel-projects.sh
./03-cleanup-github-actions.sh
./04-cleanup-codebase.sh
```

## ⚠️ Important Notes

1. **Run Security Cleanup First** - Exposed credentials must be revoked
2. **Verify Clean Architecture** - Ensure new deployment works before cleanup
3. **Keep Backups** - All removed items are backed up in `backups/`
4. **Commit Changes** - Use the generated commit helper script

## 📊 What Gets Cleaned

### Vercel Projects (6 expected)
- ganger-staff
- ganger-inventory
- ganger-handouts
- ganger-checkin-kiosk
- ganger-medication-auth
- ganger-eos-l10

### GitHub Actions
- `.github/workflows/deploy-vercel.yml`

### Code References
- `vercel.json` files
- Package.json deploy scripts with `.vercel/output/static`
- Hardcoded Vercel credentials

### Security Items
- Exposed Vercel token
- Vercel organization and project IDs

## 🔐 Security Priority

**CRITICAL**: The Vercel token `RdwA23mHSvPcm9ptReM6zxjF` is exposed in the codebase and must be revoked immediately via the Vercel dashboard.

## 📁 Backup Structure

```
backups/
├── *.backup           # Original files before modification
├── cleanup-report-*.md # Detailed cleanup reports
└── security-audit-*.log # Security action logs
```

## ✅ Success Criteria

- [ ] All Vercel projects deleted
- [ ] GitHub Actions workflow archived
- [ ] No active Vercel references in code
- [ ] Security credentials revoked
- [ ] All changes committed to git

## 🔗 Related Documentation

- [Main Deployment Docs](../README.md)
- [Clean Architecture](../../../clean-architecture/README.md)
- [Deployment Plan](../02-deployment-plan.md)