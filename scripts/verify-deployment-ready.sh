#!/bin/bash

# Ganger Platform Pre-Deployment Verification Script
# This script checks that all apps are ready for deployment to Vercel
# Based on documented deployment requirements from CLAUDE.md and true-docs

# Don't exit on error - we want to check all apps
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track total issues
TOTAL_ISSUES=0
CRITICAL_ISSUES=0
WARNINGS=0

# Check for --app parameter
SPECIFIC_APP=""
if [ "$1" == "--app" ] && [ -n "$2" ]; then
    SPECIFIC_APP="$2"
fi

echo "🔍 Ganger Platform Pre-Deployment Verification"
echo "=============================================="
echo "Based on CLAUDE.md deployment requirements"
if [ -n "$SPECIFIC_APP" ]; then
    echo "Checking specific app: $SPECIFIC_APP"
fi
echo ""

# Function to check an individual app
check_app() {
    local app_name=$1
    local app_path="apps/$app_name"
    local issues=0
    local critical=0
    
    echo -e "${BLUE}Checking $app_name...${NC}"
    
    # Check 1: App directory exists
    if [ ! -d "$app_path" ]; then
        echo -e "  ${RED}✗ App directory not found${NC}"
        ((issues++))
        ((critical++))
        return
    fi
    
    # Check 2: Package.json exists and has required scripts
    if [ ! -f "$app_path/package.json" ]; then
        echo -e "  ${RED}✗ Missing package.json${NC}"
        ((issues++))
        ((critical++))
    else
        # Check for required scripts
        if ! grep -q '"build"' "$app_path/package.json"; then
            echo -e "  ${RED}✗ No build script in package.json${NC}"
            ((issues++))
            ((critical++))
        fi
        if ! grep -q '"type-check"' "$app_path/package.json"; then
            echo -e "  ${YELLOW}⚠ No type-check script in package.json${NC}"
            ((issues++))
        fi
    fi
    
    # Check 3: Vercel.json configuration
    if [ ! -f "$app_path/vercel.json" ]; then
        echo -e "  ${YELLOW}⚠ Missing vercel.json (using defaults)${NC}"
        ((issues++))
    else
        # Check for correct monorepo commands
        if ! grep -q 'cd ../..' "$app_path/vercel.json"; then
            echo -e "  ${RED}✗ vercel.json missing monorepo-aware commands${NC}"
            ((issues++))
            ((critical++))
        fi
        # Check for NODE_ENV=development
        if ! grep -q 'NODE_ENV.*development' "$app_path/vercel.json"; then
            echo -e "  ${YELLOW}⚠ vercel.json should set NODE_ENV=development${NC}"
            ((issues++))
        fi
    fi
    
    # Check 4: PostCSS configuration (Tailwind v4 required)
    if [ -f "$app_path/postcss.config.js" ] || [ -f "$app_path/postcss.config.mjs" ]; then
        if grep -q "tailwindcss: {}" "$app_path/postcss.config."* 2>/dev/null; then
            echo -e "  ${RED}✗ Using Tailwind v3 syntax in PostCSS (must use '@tailwindcss/postcss': {})${NC}"
            ((issues++))
            ((critical++))
        fi
    fi
    
    # Check 5: Force-dynamic on auth pages (skip API routes)
    auth_pages=$(find "$app_path/src" -name "*.tsx" -o -name "*.ts" 2>/dev/null | xargs grep -l "useAuth\|AuthGuard\|withAuth\|useStaffAuth" 2>/dev/null || true)
    for page in $auth_pages; do
        # Skip API routes - they're always dynamic
        if [[ "$page" == *"/api/"* ]]; then
            continue
        fi
        
        if [[ "$page" == *"/pages/"* ]] || [[ "$page" == *"/app/"* ]]; then
            if ! grep -q "export const dynamic = 'force-dynamic'" "$page" && ! grep -q "getServerSideProps" "$page"; then
                echo -e "  ${YELLOW}⚠ Auth page missing force-dynamic: ${page#$app_path/}${NC}"
                ((issues++))
            fi
        fi
    done
    
    # Check 6: No auth imports without subpaths (currently allowed but not recommended)
    # Skipping as both patterns work according to the code review
    
    # Check 7: Environment variables
    env_issues=$(grep -r "process\.env\." "$app_path/src" 2>/dev/null | grep -E "SUPABASE_URL[^_]|SUPABASE_ANON_KEY[^_]" | grep -v "NEXT_PUBLIC_" || true)
    if [ ! -z "$env_issues" ]; then
        env_count=$(echo "$env_issues" | wc -l)
        echo -e "  ${RED}✗ Found $env_count incorrect environment variable references${NC}"
        ((issues++))
        ((critical++))
    fi
    
    # Check 8: API routes creating clients at module level (deployment killer)
    api_files=$(find "$app_path/src" -path "*/api/*" -name "*.ts" -o -path "*/api/*" -name "*.tsx" 2>/dev/null || true)
    for api_file in $api_files; do
        if grep -q "const.*=.*createClient.*process\.env" "$api_file" 2>/dev/null && ! grep -q "export.*function\|export.*async" "$api_file" 2>/dev/null; then
            echo -e "  ${RED}✗ API route creating client at module level: ${api_file#$app_path/}${NC}"
            ((issues++))
            ((critical++))
        fi
    done
    
    # Check 9: No placeholder values in production
    # Exclude legitimate placeholder attributes and Supabase project IDs
    if grep -r "your-.*-here\|PLACEHOLDER\|TODO.*implement\|xxx" "$app_path/src" 2>/dev/null | grep -v "example\|test\|mock\|placeholder=\"\|pfqtzmxxx" >/dev/null; then
        echo -e "  ${RED}✗ Found placeholder values in code${NC}"
        ((issues++))
        ((critical++))
    fi
    
    # Check 10: Missing AuthProvider for apps using auth
    if [ ! -z "$auth_pages" ]; then
        # Check if _app.tsx or layout.tsx has AuthProvider
        has_provider=false
        if [ -f "$app_path/src/pages/_app.tsx" ] && grep -q "AuthProvider" "$app_path/src/pages/_app.tsx"; then
            has_provider=true
        fi
        if [ -f "$app_path/src/app/layout.tsx" ] && grep -q "AuthProvider" "$app_path/src/app/layout.tsx"; then
            has_provider=true
        fi
        # Also check app/layout.tsx (without src/)
        if [ -f "$app_path/app/layout.tsx" ] && grep -q "AuthProvider" "$app_path/app/layout.tsx"; then
            has_provider=true
        fi
        if [ "$has_provider" = false ]; then
            echo -e "  ${RED}✗ App uses auth but missing AuthProvider in _app.tsx or layout.tsx${NC}"
            ((issues++))
            ((critical++))
        fi
    fi
    
    # Check 11: Public apps shouldn't use staff auth globally
    if [[ "$app_name" == "pharma-scheduling" ]] || [[ "$app_name" == "checkin-kiosk" ]]; then
        if grep -r "StaffOnly\|AdminOnly\|withAuthGuard" "$app_path/src/pages/_app.tsx" "$app_path/src/app/layout.tsx" 2>/dev/null | grep -v "condition"; then
            echo -e "  ${RED}✗ Public app using staff auth globally${NC}"
            ((issues++))
            ((critical++))
        fi
    fi
    
    # Check 12: No custom middleware.ts files (only ganger-staff should have it)
    if [[ "$app_name" != "ganger-staff" ]] && [ -f "$app_path/src/middleware.ts" ]; then
        echo -e "  ${RED}✗ App has middleware.ts (only ganger-staff should have middleware)${NC}"
        ((issues++))
        ((critical++))
    fi
    
    # Check 13: Component export check
    component_files=$(find "$app_path/src/components" -name "*.tsx" -o -name "*.ts" 2>/dev/null || true)
    for comp in $component_files; do
        if ! grep -q "export default\|export const\|export function\|export class" "$comp" 2>/dev/null; then
            echo -e "  ${YELLOW}⚠ Component without export: ${comp#$app_path/}${NC}"
            ((issues++))
        fi
    done
    
    # Check 14: No legacy code patterns
    if grep -r "cloudflare.*worker\|@cloudflare/\|export.*runtime.*=.*'edge'\|custom.*auth.*middleware" "$app_path/src" 2>/dev/null | grep -v "Removed for Vercel"; then
        echo -e "  ${YELLOW}⚠ Found legacy Cloudflare Worker code${NC}"
        ((issues++))
    fi
    
    # Check 15: No duplicate dependencies that exist in @ganger/deps
    if [ -f "$app_path/package.json" ]; then
        # Common deps that should be in @ganger/deps
        common_deps="lucide-react\|date-fns\|clsx\|zod\|@radix-ui"
        if grep -E "\"($common_deps)\"" "$app_path/package.json" >/dev/null 2>&1; then
            echo -e "  ${YELLOW}⚠ May have duplicate dependencies (check @ganger/deps)${NC}"
            ((issues++))
        fi
    fi
    
    # Check 16: No imports from non-existent @ganger packages
    invalid_imports=$(grep -r "from '@ganger/" "$app_path/src" 2>/dev/null | grep -v "@ganger/auth\|@ganger/cache\|@ganger/config\|@ganger/db\|@ganger/deps\|@ganger/docs\|@ganger/integrations\|@ganger/monitoring\|@ganger/types\|@ganger/ui\|@ganger/utils" || true)
    if [ ! -z "$invalid_imports" ]; then
        echo -e "  ${RED}✗ Found imports from non-existent @ganger packages${NC}"
        ((issues++))
        ((critical++))
    fi
    
    # Check 16a: Check for incorrect auth imports (useAuth from @ganger/auth/staff should be useStaffAuth)
    wrong_auth_imports=$(grep -r "useAuth.*from.*@ganger/auth/staff" "$app_path/src" 2>/dev/null || true)
    if [ ! -z "$wrong_auth_imports" ]; then
        echo -e "  ${RED}✗ Found incorrect auth imports: useAuth from @ganger/auth/staff (should be useStaffAuth)${NC}"
        ((issues++))
        ((critical++))
    fi
    
    # Check 16b: Check for non-existent subpath imports (@ganger/ui/staff doesn't exist)
    invalid_subpaths=$(grep -r "@ganger/ui/staff\|@ganger/ui/admin" "$app_path/src" 2>/dev/null || true)
    if [ ! -z "$invalid_subpaths" ]; then
        echo -e "  ${RED}✗ Found imports from non-existent @ganger/ui subpaths (ui/staff, ui/admin don't exist)${NC}"
        ((issues++))
        ((critical++))
    fi
    
    # Check 16c: Check for missing UI components (Textarea should come from a different package or be created)
    missing_ui_components=$(grep -r "Textarea.*from.*@ganger/ui" "$app_path/src" 2>/dev/null || true)
    if [ ! -z "$missing_ui_components" ]; then
        echo -e "  ${YELLOW}⚠ Found imports of Textarea from @ganger/ui (component may not exist)${NC}"
        ((issues++))
    fi
    
    # Check 17: Client components shouldn't use non-NEXT_PUBLIC env vars
    client_files=$(grep -r "'use client'" "$app_path/src" -l 2>/dev/null || true)
    for client_file in $client_files; do
        # Check if file uses process.env but exclude NODE_ENV and NEXT_PUBLIC vars
        if grep -q "process\.env\." "$client_file" 2>/dev/null; then
            # Get all env var usages, excluding NODE_ENV and NEXT_PUBLIC
            non_public_vars=$(grep -o "process\.env\.[A-Z_]*" "$client_file" 2>/dev/null | grep -v "process\.env\.NODE_ENV" | grep -v "process\.env\.NEXT_PUBLIC" || true)
            if [ ! -z "$non_public_vars" ]; then
                echo -e "  ${RED}✗ Client component using non-NEXT_PUBLIC env var: ${client_file#$app_path/}${NC}"
                ((issues++))
                ((critical++))
            fi
        fi
    done
    
    # Check 18: No .env.local usage (project uses single .env)
    if [ -f "$app_path/.env.local" ]; then
        echo -e "  ${YELLOW}⚠ Found .env.local (project uses single root .env file)${NC}"
        ((issues++))
    fi
    
    # Check 19: No forbidden patterns from CLAUDE.md
    if grep -r "next export\|output.*:.*'export'\|getStaticProps\|getStaticPaths" "$app_path/src" 2>/dev/null; then
        echo -e "  ${RED}✗ Found forbidden static export patterns${NC}"
        ((issues++))
        ((critical++))
    fi
    
    # Check 19a: Environment variables in getStaticProps/getStaticPaths
    static_files=$(grep -r "getStaticProps\|getStaticPaths" "$app_path/src" -l 2>/dev/null || true)
    for static_file in $static_files; do
        if grep -q "process\.env\." "$static_file" 2>/dev/null; then
            echo -e "  ${RED}✗ Using environment variables in static generation: ${static_file#$app_path/}${NC}"
            ((issues++))
            ((critical++))
        fi
    done
    
    # Check 19b: Directive placement issues ('use client' not at top)
    tsx_files=$(find "$app_path/src" -name "*.tsx" 2>/dev/null || true)
    for tsx_file in $tsx_files; do
        if grep -q "'use client'" "$tsx_file" 2>/dev/null; then
            # Check if 'use client' is in the first 3 lines (allowing for comments)
            if ! head -n 3 "$tsx_file" | grep -q "'use client'"; then
                echo -e "  ${YELLOW}⚠ 'use client' directive not at top of file: ${tsx_file#$app_path/}${NC}"
                ((issues++))
            fi
        fi
    done
    
    # Check 19c: Server-only imports in client components
    client_files=$(grep -r "'use client'" "$app_path/src" -l 2>/dev/null || true)
    for client_file in $client_files; do
        if grep -q "fs\|path\|crypto\|child_process\|@ganger/db" "$client_file" 2>/dev/null | grep -v "// \|/\*"; then
            echo -e "  ${RED}✗ Client component importing server-only modules: ${client_file#$app_path/}${NC}"
            ((issues++))
            ((critical++))
        fi
    done
    
    # Check 19d: Missing critical environment variables
    if grep -r "NEXT_PUBLIC_SUPABASE_URL\|NEXT_PUBLIC_SUPABASE_ANON_KEY" "$app_path/src" >/dev/null 2>&1; then
        # App uses Supabase, check if createClient is called without env vars
        if grep -r "createClient(" "$app_path/src" 2>/dev/null | grep -q "undefined\|''\|\"\""; then
            echo -e "  ${RED}✗ Creating Supabase client with missing/empty environment variables${NC}"
            ((issues++))
            ((critical++))
        fi
    fi
    
    # Check 20: tsconfig.json extends from shared config
    if [ -f "$app_path/tsconfig.json" ]; then
        if ! grep -q "extends.*@ganger/config" "$app_path/tsconfig.json"; then
            echo -e "  ${YELLOW}⚠ tsconfig.json should extend @ganger/config${NC}"
            ((issues++))
        fi
    fi
    
    # Check 21: Vercel URL consistency check
    # Check if app has hardcoded Vercel URLs that don't match the standard pattern
    vercel_urls=$(grep -r "\.vercel\.app" "$app_path/src" 2>/dev/null | grep -v "node_modules" | grep -v ".next" || true)
    if [ ! -z "$vercel_urls" ]; then
        # Expected pattern: https://ganger-[app-name].vercel.app
        expected_pattern="https://ganger-$app_name.vercel.app"
        
        # Check for old pattern with anand-gangers-projects
        if echo "$vercel_urls" | grep -q "anand-gangers-projects\.vercel\.app"; then
            echo -e "  ${RED}✗ Found outdated Vercel URLs with 'anand-gangers-projects' pattern${NC}"
            echo -e "    Should be: $expected_pattern"
            ((issues++))
            ((critical++))
        fi
        
        # Check for git-main pattern (also outdated)
        if echo "$vercel_urls" | grep -q "git-main-ganger\.vercel\.app"; then
            echo -e "  ${YELLOW}⚠ Found git-branch specific Vercel URLs${NC}"
            echo -e "    Consider using: $expected_pattern"
            ((issues++))
        fi
    fi
    
    # Update totals
    TOTAL_ISSUES=$((TOTAL_ISSUES + issues))
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + critical))
    WARNINGS=$((WARNINGS + (issues - critical)))
    
    if [ $issues -eq 0 ]; then
        echo -e "  ${GREEN}✓ All checks passed${NC}"
    else
        if [ $critical -gt 0 ]; then
            echo -e "  ${RED}Found $issues issues ($critical critical)${NC}"
        else
            echo -e "  ${YELLOW}Found $issues warnings${NC}"
        fi
    fi
    echo ""
}

# Main verification
if [ -n "$SPECIFIC_APP" ]; then
    # Check only the specified app
    if [ -d "apps/$SPECIFIC_APP" ]; then
        check_app "$SPECIFIC_APP"
    else
        echo -e "${RED}Error: App '$SPECIFIC_APP' not found in apps/ directory${NC}"
        exit 1
    fi
else
    # Check all apps
    echo "🔍 Checking all apps..."
    echo ""
    
    # Get all app directories
    for app_dir in apps/*/; do
        if [ -d "$app_dir" ]; then
            app_name=$(basename "$app_dir")
            check_app "$app_name"
        fi
    done
    
    # Global checks (only when checking all apps)
    echo -e "${BLUE}Checking global configuration...${NC}"
    
    # Check edge-config-items.json for outdated URLs
    if [ -f "edge-config-items.json" ]; then
        outdated_urls=$(grep -o "[^\"]*\.vercel\.app" edge-config-items.json | grep "anand-gangers-projects\|git-main-ganger" || true)
        if [ ! -z "$outdated_urls" ]; then
            echo -e "  ${RED}✗ Found outdated Vercel URLs in edge-config-items.json${NC}"
            echo "$outdated_urls" | while read url; do
                echo -e "    ${RED}$url${NC}"
            done
            echo -e "    URLs should follow pattern: https://ganger-[app-name].vercel.app"
            ((CRITICAL_ISSUES++))
            ((TOTAL_ISSUES++))
        else
            echo -e "  ${GREEN}✓ edge-config-items.json URLs are up to date${NC}"
        fi
    fi
    
    # Check update-vercel-rewrites-smart.js for hardcoded URLs
    if [ -f "scripts/update-vercel-rewrites-smart.js" ]; then
        script_urls=$(grep -o "[^\"]*\.vercel\.app" scripts/update-vercel-rewrites-smart.js 2>/dev/null || true)
        if echo "$script_urls" | grep -q "anand-gangers-projects\|git-main-ganger"; then
            echo -e "  ${YELLOW}⚠ Found outdated URLs in update-vercel-rewrites-smart.js${NC}"
            ((WARNINGS++))
            ((TOTAL_ISSUES++))
        fi
    fi
    
    echo ""
fi

# Summary
echo "=============================================="
echo "📊 Verification Summary"
echo "=============================================="
echo ""

if [ $CRITICAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ No critical issues found${NC}"
else
    echo -e "${RED}✗ Found $CRITICAL_ISSUES critical issues that will break deployment${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $WARNINGS warnings (non-blocking)${NC}"
fi

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All apps are ready for deployment!${NC}"
    exit 0
else
    echo -e "\nTotal issues: $TOTAL_ISSUES"
    echo ""
    if [ $CRITICAL_ISSUES -gt 0 ]; then
        echo "Critical issues must be fixed before deployment."
    fi
    echo ""
    echo "All issues should be fixed manually by reading and verifying files."
    echo "Automated fix scripts have been removed to ensure accuracy."
    
    # Exit with error if critical issues
    if [ $CRITICAL_ISSUES -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
fi