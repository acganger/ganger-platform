# Deprecated true-docs Documentation

## Overview

This folder contains documentation that was moved from `/true-docs/` because it relates to abandoned deployment approaches that conflict with the current **Vercel Distributed Deployment** strategy.

## Why These Files Were Moved

The Ganger Platform evolved through several deployment approaches:
1. **Cloudflare Workers (21+ workers)** - Too complex, abandoned
2. **Clean Architecture (5 workers)** - Cloudflare limitations, abandoned  
3. **VM Tunnel Deployment** - Too complex to maintain, abandoned
4. **Vercel Distributed Architecture** - CURRENT APPROACH ✅

## Files Moved and Replacement Documentation

### Obsolete Architecture Documentation

| Moved File | Original Purpose | Current Replacement |
|------------|------------------|-------------------|
| `CLEAN_ARCHITECTURE.md` | 5-worker Cloudflare system | `/true-docs/deployment/` |
| `CLEAN_ARCHITECTURE_DEPLOYMENT_GUIDE.md` | Cloudflare deployment guide | `/true-docs/deployment/02-deployment-plan.md` |
| `CLEAN_ARCHITECTURE_QUICK_REFERENCE.md` | Cloudflare quick reference | `/true-docs/deployment/QUICK_REFERENCE.md` |
| `DEPLOYMENT_GUIDE_CLOUDFLARE_WORKERS.md` | 1000+ lines of Workers deployment | `/true-docs/deployment/` |
| `HYBRID_WORKER_ARCHITECTURE.md` | Worker architecture design | `/true-docs/deployment/README.md` |
| `ROUTING_ARCHITECTURE.md` | Cloudflare routing patterns | Staff Portal URL rewrites (Vercel) |
| `MULTI_APP_DEPLOYMENT.md` | VM deployment guide | `/true-docs/deployment/` |

## Current Documentation Structure

**For New Developers**, use these updated paths:

### ✅ **DEPLOYMENT** (Vercel Strategy)
- **Primary**: `/true-docs/deployment/` - Complete Vercel deployment documentation
- **Quick Start**: `/true-docs/deployment/QUICK_REFERENCE.md`
- **Step-by-Step**: `/true-docs/deployment/02-deployment-plan.md`

### ✅ **DEVELOPMENT** (Still Current)
- **Frontend**: `/true-docs/FRONTEND_DEVELOPMENT_GUIDE.md` (updated to align with Vercel)
- **Backend**: `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md` (updated to align with Vercel)
- **Infrastructure**: `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md` (updated to align with Vercel)
- **AI Workflow**: `/true-docs/AI_WORKFLOW_GUIDE.md` (deployment-agnostic)
- **Project Status**: `/true-docs/PROJECT_TRACKER.md` (deployment-agnostic)

## Historical Context Preserved

These files are preserved for:
- **Historical reference** - Understanding why certain approaches were abandoned
- **Decision documentation** - Context for architectural decisions
- **Learning purposes** - Examples of what didn't work and why

## Migration Path

If you find references to these obsolete files:
1. Check `/true-docs/deployment/` for current deployment information
2. Check updated development guides for current best practices
3. Contact the development team if specific historical context is needed

---

**Moved Date**: January 2025
**Reason**: Alignment with Vercel Distributed Deployment strategy
**Status**: Obsolete deployment approaches archived, current approach documented in `/true-docs/deployment/`