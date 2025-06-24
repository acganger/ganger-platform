#!/bin/bash

# ============================================================================
# 05-security-cleanup.sh - Revoke Exposed Vercel Credentials
# ============================================================================
# Purpose: Security cleanup - revoke exposed tokens and update credentials
# Dependencies: None (manual process)
# Related Docs: ./01-cleanup-plan.md
# CRITICAL: This should be done IMMEDIATELY
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🔒 SECURITY CLEANUP - CRITICAL${NC}"
echo "================================"

# Exposed credentials found in codebase
echo -e "\n${RED}⚠️  EXPOSED CREDENTIALS DETECTED:${NC}"
echo "  - Vercel Token: RdwA23mHSvPcm9ptReM6zxjF"
echo "  - Vercel Org ID: team_wpY7PcIsYQNnslNN39o7fWvS"
echo "  - Vercel Project ID: prj_9PlXR5HftwXI4u4hAxVhyOjwk6y5"

echo -e "\n${RED}These credentials are exposed in:${NC}"
echo "  - .github/workflows/deploy-vercel.yml"
echo "  - Multiple deployment scripts"

# Step 1: Manual token revocation steps
echo -e "\n${YELLOW}Step 1: Revoke Vercel Token (MANUAL)${NC}"
echo "================================"
echo "1. Go to: https://vercel.com/account/tokens"
echo "2. Find the token ending in: ...zxjF"
echo "3. Click 'Delete' or 'Revoke'"
echo "4. Confirm deletion"

echo -e "\n${YELLOW}Press Enter after revoking the token...${NC}"
read -r

# Step 2: Check for credential usage
echo -e "\n${YELLOW}Step 2: Checking for credential usage in code...${NC}"

# Find all files with the exposed token
echo -e "\n${BLUE}Files containing exposed token:${NC}"
grep -r "RdwA23mHSvPcm9ptReM6zxjF" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude="*.log" \
  -l 2>/dev/null || echo "  No files found (good!)"

# Find all files with Vercel org ID
echo -e "\n${BLUE}Files containing Vercel Org ID:${NC}"
grep -r "team_wpY7PcIsYQNnslNN39o7fWvS" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude="*.log" \
  -l 2>/dev/null || echo "  No files found"

# Step 3: Create new token instructions
echo -e "\n${YELLOW}Step 3: Create New Token (IF NEEDED)${NC}"
echo "================================"
echo "If you need a new Vercel token:"
echo "1. Go to: https://vercel.com/account/tokens"
echo "2. Click 'Create Token'"
echo "3. Name it appropriately (e.g., 'ganger-platform-prod')"
echo "4. Set expiration (recommended: 90 days)"
echo "5. Save securely in password manager"
echo ""
echo -e "${RED}⚠️  NEVER commit tokens to git!${NC}"

# Step 4: Update GitHub Secrets
echo -e "\n${YELLOW}Step 4: Update GitHub Secrets${NC}"
echo "================================"
echo "If you created a new token, update GitHub secrets:"
echo "1. Go to: https://github.com/acganger/ganger-platform/settings/secrets/actions"
echo "2. Update VERCEL_TOKEN with new value"
echo "3. Remove/update any other Vercel-related secrets"

# Step 5: Security audit log
AUDIT_FILE="security-audit-$(date +%Y%m%d-%H%M%S).log"

cat > "$AUDIT_FILE" << EOF
# Security Cleanup Audit Log

**Date**: $(date)
**Action**: Vercel credential cleanup

## Exposed Credentials (NOW REVOKED)
- Token: RdwA23mHSvPcm9ptReM6zxjF
- Org ID: team_wpY7PcIsYQNnslNN39o7fWvS
- Project ID: prj_9PlXR5HftwXI4u4hAxVhyOjwk6y5

## Actions Taken
1. [ ] Vercel token revoked via dashboard
2. [ ] GitHub Actions workflow removed/archived
3. [ ] Credentials removed from codebase
4. [ ] GitHub secrets updated/removed
5. [ ] Team notified of security incident

## Recommendations
1. Enable token rotation policy (90 days)
2. Use GitHub secrets for all credentials
3. Never commit credentials to git
4. Regular security audits

## Files Cleaned
See other cleanup scripts for file modifications.
EOF

echo -e "\n${GREEN}✓${NC} Security audit log created: $AUDIT_FILE"

# Step 6: Final security check
echo -e "\n${YELLOW}Step 6: Final Security Check${NC}"
echo "================================"

# Create a security checklist
cat > "security-checklist.md" << EOF
# Security Cleanup Checklist

## Immediate Actions Required

- [ ] Revoke Vercel token at https://vercel.com/account/tokens
- [ ] Archive/remove .github/workflows/deploy-vercel.yml
- [ ] Remove hardcoded credentials from all scripts
- [ ] Update any GitHub secrets
- [ ] Notify team about credential rotation

## Verification Steps

- [ ] Search codebase for "RdwA23mHSvPcm9ptReM6zxjF" - should return 0 results
- [ ] Search codebase for "team_wpY7PcIsYQNnslNN39o7fWvS" - should return 0 results
- [ ] Verify old token no longer works (Vercel CLI should fail)
- [ ] Check GitHub Actions - no Vercel workflows should be active

## Prevention Measures

1. **Use Environment Variables**
   - Store in .env.local (gitignored)
   - Use GitHub secrets for CI/CD

2. **Token Best Practices**
   - Set expiration dates
   - Use minimal scopes
   - Rotate regularly

3. **Code Review**
   - Check for credentials before committing
   - Use pre-commit hooks
   - Regular security audits
EOF

echo -e "\n${GREEN}✓${NC} Security checklist created: security-checklist.md"

# Summary
echo -e "\n================================"
echo -e "${RED}🔒 SECURITY CLEANUP SUMMARY${NC}"
echo "================================"

echo -e "\n${RED}CRITICAL ACTIONS:${NC}"
echo "1. ⚠️  REVOKE the exposed Vercel token immediately"
echo "2. ⚠️  Remove credentials from all code"
echo "3. ⚠️  Update GitHub secrets if needed"

echo -e "\n${YELLOW}Documentation:${NC}"
echo "- Security audit log: $AUDIT_FILE"
echo "- Security checklist: security-checklist.md"

echo -e "\n${RED}This is a security incident that requires immediate action!${NC}"