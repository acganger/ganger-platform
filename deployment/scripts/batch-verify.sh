#!/bin/bash

# =============================================================================
# GANGER PLATFORM - BATCH VERIFICATION SCRIPT
# =============================================================================
# Comprehensive verification across all applications
# Version: 1.0.0
# Date: 2025-01-18
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly APPS_DIR="${PROJECT_ROOT}/apps"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

print_section() {
    echo -e "\n${BLUE}━━━ $1 ━━━${NC}"
}

verify_application() {
    local app_path="$1"
    local app_name="$(basename "$app_path")"
    local errors=0
    
    echo "Verifying: $app_name"
    
    # Check required files
    local required_files=("package.json" "next.config.js" "wrangler.jsonc")
    for file in "${required_files[@]}"; do
        if [[ ! -f "${app_path}/${file}" ]]; then
            log_error "  ❌ Missing: $file"
            ((errors++))
        else
            log_success "  ✅ Found: $file"
        fi
    done
    
    # Check package.json structure
    if [[ -f "${app_path}/package.json" ]]; then
        if ! jq -e '.scripts.build' "${app_path}/package.json" > /dev/null 2>&1; then
            log_error "  ❌ No build script in package.json"
            ((errors++))
        else
            log_success "  ✅ Build script found"
        fi
        
        if ! jq -e '.scripts["type-check"]' "${app_path}/package.json" > /dev/null 2>&1; then
            log_warning "  ⚠️  No type-check script in package.json"
        else
            log_success "  ✅ Type-check script found"
        fi
    fi
    
    # Check next.config.js for Workers compatibility
    if [[ -f "${app_path}/next.config.js" ]]; then
        if grep -q "output.*export\|trailingSlash.*true\|distDir.*out" "${app_path}/next.config.js"; then
            log_error "  ❌ Forbidden static export patterns found"
            ((errors++))
        else
            log_success "  ✅ Workers-compatible configuration"
        fi
        
        if grep -q "esmExternals.*true" "${app_path}/next.config.js"; then
            log_success "  ✅ ESM externals configured"
        else
            log_warning "  ⚠️  ESM externals not configured"
        fi
    fi
    
    # Check wrangler.jsonc structure
    if [[ -f "${app_path}/wrangler.jsonc" ]]; then
        if ! jq -e '.name' "${app_path}/wrangler.jsonc" > /dev/null 2>&1; then
            log_error "  ❌ Invalid wrangler.jsonc structure"
            ((errors++))
        else
            log_success "  ✅ Valid wrangler.jsonc"
        fi
        
        local main_path
        main_path="$(jq -r '.main' "${app_path}/wrangler.jsonc" 2>/dev/null || echo "")"
        if [[ "$main_path" == ".vercel/output/static/_worker.js/index.js" ]]; then
            log_success "  ✅ Correct Workers main path"
        else
            log_error "  ❌ Incorrect main path: $main_path"
            ((errors++))
        fi
        
        local compat_date
        compat_date="$(jq -r '.compatibility_date' "${app_path}/wrangler.jsonc" 2>/dev/null || echo "")"
        if [[ "$compat_date" =~ ^2025- ]]; then
            log_success "  ✅ 2025 compatibility date"
        else
            log_warning "  ⚠️  Old compatibility date: $compat_date"
        fi
    fi
    
    # Check TypeScript compilation
    if [[ -f "${app_path}/tsconfig.json" ]] && command -v tsc > /dev/null; then
        log_info "  🔍 Checking TypeScript compilation..."
        (
            cd "$app_path"
            if timeout 60 npx tsc --noEmit > /dev/null 2>&1; then
                log_success "  ✅ TypeScript compilation passed"
            else
                log_warning "  ⚠️  TypeScript compilation issues"
            fi
        )
    fi
    
    return $errors
}

main() {
    print_section "Ganger Platform - Batch Application Verification"
    
    local total_apps=0
    local total_errors=0
    local failed_apps=()
    
    # Find all application directories
    while IFS= read -r -d '' app_path; do
        if [[ -f "${app_path}/package.json" ]]; then
            ((total_apps++))
            
            local app_errors
            app_errors="$(verify_application "$app_path" || echo $?)"
            
            if [[ "$app_errors" -gt 0 ]]; then
                failed_apps+=("$(basename "$app_path")")
                total_errors=$((total_errors + app_errors))
            fi
            
            echo
        fi
    done < <(find "$APPS_DIR" -maxdepth 1 -type d -print0)
    
    print_section "Verification Summary"
    log_info "Total applications verified: $total_apps"
    log_info "Total errors found: $total_errors"
    
    if [[ ${#failed_apps[@]} -gt 0 ]]; then
        log_error "Applications with issues: ${failed_apps[*]}"
        exit 1
    else
        log_success "All applications passed verification!"
        exit 0
    fi
}

main "$@"