# Deprecated Files Summary

## Overview
Files have been organized and moved to deprecated folders based on their relevance to the current deployment strategy. The platform has successfully moved to Vercel deployment (June 28-29, 2025), making many previous deployment attempts and Cloudflare-related files obsolete.

## Criteria for Deprecation
- Files from early June (5-12): Initial setup and configuration attempts
- Files from mid-June (13-27): Various failed deployment strategies
- Cloudflare-related scripts: Platform moved from Cloudflare Workers to Vercel
- Redundant documentation: Multiple versions of the same status reports
- Failed deployment strategies: Scripts for approaches that didn't work

## Kept Files (Still Relevant)

### Root Directory (44 files)
- **Core Documentation**: CLAUDE.md, README.md
- **Current Deployment**: Files from June 28-29 related to successful Vercel deployment
- **Active Scripts**: Deployment, monitoring, and management scripts that work with current setup
- **Final Status**: DEPLOYMENT_SUCCESS.md, FINAL_DEPLOYMENT_STATUS.md, etc.

### scripts/ Directory (4 files)
- COMMANDS.md - Command reference
- add-turbo-ignore.sh - Turbo build optimization
- run-app-tests.sh - Testing scripts
- setup-mcp-environment.sh - MCP server setup

### true-docs/deployment/scripts/ (10 files)
- Current deployment scripts from June 28-29
- Environment variable management
- Project creation and status checking
- Vercel-specific deployment scripts

## Deprecated Files (121 total)

### deprecated/root/ (69 files)
- Early configuration attempts (June 5-12)
- Cloudflare deployment strategies
- Failed Vercel deployment attempts (June 13-27)
- Redundant status reports
- Old architecture documentation
- Tunnel scripts (MySQL, SSH)

### deprecated/scripts/ (28 files)
- Cloudflare-specific scripts (workers, DNS, artifacts)
- Old Vercel setup attempts
- GitHub Actions scripts (moved to Vercel auto-deploy)
- Puppeteer and screenshot guides
- Edge runtime removal scripts

### deprecated/true-docs-deployment-scripts/ (24 files)
- Old numbered deployment sequences (01-, 04-, 05-)
- Asset prefix fixes (no longer needed)
- DNS update scripts (Cloudflare-specific)
- Staff portal automated deployment (replaced by simpler approach)
- GitHub integration scripts (Vercel handles this now)

## Current Deployment Strategy
The platform now uses:
1. Individual Vercel projects for each app (20+ projects)
2. Automatic deployment on git push (no GitHub Actions needed)
3. Simple environment variable management via Vercel dashboard
4. Staff portal as router using vercel.json rewrites

## Notes
- All deprecated files are preserved in case historical reference is needed
- The current setup is much simpler and more maintainable
- Focus is on Vercel's native Next.js support rather than custom solutions