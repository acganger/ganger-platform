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
        # Check for NODE_ENV=production (updated from development)
        if ! grep -q 'NODE_ENV.*production' "$app_path/vercel.json"; then
            echo -e "  ${RED}✗ vercel.json should set NODE_ENV=production${NC}"
            ((issues++))
            ((critical++))
        fi
        
        # Check for ENABLE_EXPERIMENTAL_COREPACK=1 (required for pnpm)
        if ! grep -q 'ENABLE_EXPERIMENTAL_COREPACK.*1' "$app_path/vercel.json"; then
            echo -e "  ${RED}✗ vercel.json missing ENABLE_EXPERIMENTAL_COREPACK=1${NC}"
            ((issues++))
            ((critical++))
        fi
        
        # Check for --no-frozen-lockfile (should NOT be present after lockfile fix)
        if grep -q '\-\-no\-frozen\-lockfile' "$app_path/vercel.json"; then
            echo -e "  ${YELLOW}⚠ vercel.json still has --no-frozen-lockfile (not needed after lockfile fix)${NC}"
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
    else
        echo -e "  ${RED}✗ Missing postcss.config.js${NC}"
        ((issues++))
        ((critical++))
    fi
    
    # Check 4a: Tailwind CSS v4 configuration
    if [ ! -f "$app_path/tailwind.config.js" ]; then
        echo -e "  ${RED}✗ Missing tailwind.config.js (required for v4 monorepo content detection)${NC}"
        ((issues++))
        ((critical++))
    else
        # Check for explicit content paths
        if ! grep -q "packages/ui/src" "$app_path/tailwind.config.js"; then
            echo -e "  ${RED}✗ tailwind.config.js missing monorepo content paths${NC}"
            ((issues++))
            ((critical++))
        fi
    fi
    
    # Check 4b: Tailwind CSS in dependencies (not devDependencies)
    if [ -f "$app_path/package.json" ]; then
        if grep -q "\"tailwindcss\"" "$app_path/package.json" && ! grep -A 50 "\"dependencies\"" "$app_path/package.json" | grep -q "\"tailwindcss\""; then
            echo -e "  ${RED}✗ Tailwind CSS should be in dependencies, not devDependencies${NC}"
            ((issues++))
            ((critical++))
        fi
    fi
    
    # Check 4c: Correct CSS import syntax
    if [ -f "$app_path/src/styles/globals.css" ]; then
        if grep -q "@tailwind base" "$app_path/src/styles/globals.css"; then
            echo -e "  ${RED}✗ Using old @tailwind directives (must use @import \"tailwindcss\")${NC}"
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
    
    # Check 12: No custom middleware.ts files (removed per expert guidance)
    if [ -f "$app_path/src/middleware.ts" ]; then
        echo -e "  ${RED}✗ App has middleware.ts (use vercel.json rewrites instead)${NC}"
        ((issues++))
        ((critical++))
    fi
    
    # Check 12a: Staff portal router configuration
    if [[ "$app_name" == "ganger-staff" ]]; then
        if [ -f "$app_path/vercel.json" ]; then
            # Check for rewrites
            if ! grep -q "\"rewrites\":" "$app_path/vercel.json"; then
                echo -e "  ${RED}✗ Staff portal missing rewrites configuration${NC}"
                ((issues++))
                ((critical++))
            else
                # Check that rewrites include basePath in destination
                if grep -q "\"destination\": \"https://ganger-.*\.vercel\.app/:path\*\"" "$app_path/vercel.json"; then
                    echo -e "  ${RED}✗ Staff portal rewrites missing basePath in destinations${NC}"
                    echo -e "    Destinations should include the basePath (e.g., /inventory/:path*)${NC}"
                    ((issues++))
                    ((critical++))
                fi
            fi
        fi
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
    
    # Check 21: basePath configuration for router
    if [[ "$app_name" != "ganger-staff" ]]; then
        if [ -f "$app_path/next.config.js" ]; then
            if ! grep -q "basePath:" "$app_path/next.config.js"; then
                echo -e "  ${RED}✗ Missing basePath in next.config.js (required for subpath routing)${NC}"
                ((issues++))
                ((critical++))
            fi
        fi
    fi
    
    # Check 22: Vercel URL consistency check
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
    
    # Check NEW PATTERNS: Dual TypeScript configuration
    if [ -f "$app_path/tsconfig.build.json" ]; then
        echo -e "  ${GREEN}✓ Has tsconfig.build.json for production builds${NC}"
        # Verify it has empty paths object
        if ! grep -q '"paths": {}' "$app_path/tsconfig.build.json"; then
            echo -e "  ${RED}✗ tsconfig.build.json should have empty paths object${NC}"
            ((issues++))
            ((critical++))
        fi
    else
        # Only critical for packages, not apps
        if [[ "$app_path" == packages/* ]]; then
            echo -e "  ${RED}✗ Package missing tsconfig.build.json${NC}"
            ((issues++))
            ((critical++))
        fi
    fi
    
    # Check NEW PATTERNS: Package.json points to dist/ for packages
    if [[ "$app_path" == packages/* ]] && [ -f "$app_path/package.json" ]; then
        if ! grep -q '"main": "dist/' "$app_path/package.json"; then
            echo -e "  ${RED}✗ Package main field should point to dist/index.js${NC}"
            ((issues++))
            ((critical++))
        fi
        if ! grep -q '"types": "dist/' "$app_path/package.json"; then
            echo -e "  ${RED}✗ Package types field should point to dist/index.d.ts${NC}"
            ((issues++))
            ((critical++))
        fi
    fi
    
    # Check NEW PATTERNS: Build order includes @ganger/db before @ganger/config
    if [ -f "$app_path/vercel.json" ] && grep -q "@ganger/config" "$app_path/package.json"; then
        if ! grep -q "pnpm -F @ganger/db build" "$app_path/vercel.json"; then
            echo -e "  ${RED}✗ vercel.json missing @ganger/db build step before @ganger/config${NC}"
            ((issues++))
            ((critical++))
        fi
    fi
    
    # Check NEW PATTERNS: No legacy --no-frozen-lockfile in production
    if [ -f "$app_path/vercel.json" ]; then
        if grep -q '\-\-no\-frozen\-lockfile' "$app_path/vercel.json"; then
            echo -e "  ${YELLOW}⚠ Still using --no-frozen-lockfile (should be removed after lockfile fix)${NC}"
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
    
    # Check NEW GLOBAL PATTERNS: Packages have dual TypeScript configs
    echo "📋 Checking monorepo package patterns..."
    missing_build_configs=0
    for pkg_dir in packages/*/; do
        if [ -d "$pkg_dir" ]; then
            pkg_name=$(basename "$pkg_dir")
            if [ ! -f "${pkg_dir}tsconfig.build.json" ]; then
                echo -e "  ${RED}✗ Package $pkg_name missing tsconfig.build.json${NC}"
                ((missing_build_configs++))
            fi
            
            # Check if package.json points to src/ instead of dist/
            if [ -f "${pkg_dir}package.json" ]; then
                if grep -q '"main": "src/' "${pkg_dir}package.json"; then
                    echo -e "  ${RED}✗ Package $pkg_name main field points to src/ (should be dist/)${NC}"
                    ((CRITICAL_ISSUES++))
                    ((TOTAL_ISSUES++))
                fi
            fi
        fi
    done
    
    if [ $missing_build_configs -eq 0 ]; then
        echo -e "  ${GREEN}✓ All packages have production build configs${NC}"
    else
        echo -e "  ${RED}✗ $missing_build_configs packages missing build configs${NC}"
        ((CRITICAL_ISSUES += missing_build_configs))
        ((TOTAL_ISSUES += missing_build_configs))
    fi
    
    # Check for proper pnpm lockfile state
    if [ -f "pnpm-lock.yaml" ]; then
        echo -e "  ${GREEN}✓ pnpm lockfile exists and should be current${NC}"
    else
        echo -e "  ${RED}✗ Missing pnpm-lock.yaml${NC}"
        ((CRITICAL_ISSUES++))
        ((TOTAL_ISSUES++))
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