#!/bin/bash

# =============================================================================
# GANGER PLATFORM - MASTER DEPLOYMENT SCRIPT
# =============================================================================
# Mission-Critical Deployment Infrastructure for Medical Platform
# Version: 1.0.0
# Date: 2025-01-18
# Author: Dev 6 - Deployment Engineering & Infrastructure Automation
# =============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures
IFS=$'\n\t'       # Secure Internal Field Separator

# =============================================================================
# CONFIGURATION AND CONSTANTS
# =============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
readonly APPS_DIR="${PROJECT_ROOT}/apps"
readonly REGISTRY_FILE="${DEPLOYMENT_DIR}/apps-registry.json"
readonly LOG_DIR="${DEPLOYMENT_DIR}/logs"
readonly TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
readonly LOG_FILE="${LOG_DIR}/deployment_${TIMESTAMP}.log"

# Deployment Configuration
readonly MAX_PARALLEL_BUILDS=4
readonly BUILD_TIMEOUT=300  # 5 minutes
readonly HEALTH_CHECK_TIMEOUT=60
readonly RETRY_COUNT=3
readonly RETRY_DELAY=10

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# =============================================================================
# LOGGING AND OUTPUT FUNCTIONS
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
    
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() {
    log "INFO" "$@"
    echo -e "${CYAN}[INFO]${NC} $*"
}

log_success() {
    log "SUCCESS" "$@"
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    log "WARNING" "$@"
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    log "ERROR" "$@"
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

log_critical() {
    log "CRITICAL" "$@"
    echo -e "${RED}[CRITICAL]${NC} $*" >&2
}

print_banner() {
    echo -e "${PURPLE}"
    echo "==============================================================================="
    echo "  GANGER PLATFORM - MASTER DEPLOYMENT SYSTEM"
    echo "  Mission-Critical Medical Platform Deployment"
    echo "  Version: 1.0.0 | Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${BLUE}━━━ $1 ━━━${NC}"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

cleanup() {
    local exit_code=$?
    log_info "Performing cleanup operations..."
    
    # Kill any background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "Deployment completed successfully"
    else
        log_error "Deployment failed with exit code: $exit_code"
    fi
    
    log_info "Cleanup completed. Log file: ${LOG_FILE}"
    exit $exit_code
}

trap cleanup EXIT INT TERM

check_prerequisites() {
    print_section "Checking Prerequisites"
    
    local errors=0
    
    # Check required commands
    local required_commands=("node" "npm" "pnpm" "jq" "wrangler" "git")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            ((errors++))
        else
            local version
            case "$cmd" in
                "node") version="$(node --version)" ;;
                "npm") version="$(npm --version)" ;;
                "pnpm") version="$(pnpm --version)" ;;
                "wrangler") version="$(wrangler --version)" ;;
                "git") version="$(git --version)" ;;
                *) version="installed" ;;
            esac
            log_info "✓ $cmd: $version"
        fi
    done
    
    # Check required files
    local required_files=("$REGISTRY_FILE")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not found: $file"
            ((errors++))
        else
            log_info "✓ Registry file: $(basename "$file")"
        fi
    done
    
    # Check project structure
    if [[ ! -d "$APPS_DIR" ]]; then
        log_error "Apps directory not found: $APPS_DIR"
        ((errors++))
    else
        local app_count
        app_count="$(find "$APPS_DIR" -maxdepth 1 -type d | grep -v "^${APPS_DIR}$" | wc -l)"
        log_info "✓ Found $app_count applications"
    fi
    
    # Check environment variables
    local required_env_vars=("CLOUDFLARE_API_TOKEN" "CLOUDFLARE_ACCOUNT_ID")
    for var in "${required_env_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_warning "Environment variable not set: $var (may be provided by CI/CD)"
        else
            log_info "✓ Environment variable set: $var"
        fi
    done
    
    if [[ $errors -gt 0 ]]; then
        log_critical "Prerequisites check failed with $errors errors"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# =============================================================================
# APPLICATION MANAGEMENT FUNCTIONS
# =============================================================================

get_apps() {
    local filter="$1"
    local apps=()
    
    case "$filter" in
        "all")
            mapfile -t apps < <(jq -r '.applications[].id' "$REGISTRY_FILE")
            ;;
        "critical"|"high"|"medium"|"low")
            mapfile -t apps < <(jq -r ".deployment_groups.${filter}[]" "$REGISTRY_FILE")
            ;;
        *)
            if jq -e ".applications[] | select(.id == \"$filter\")" "$REGISTRY_FILE" > /dev/null; then
                apps=("$filter")
            else
                log_error "Unknown application or filter: $filter"
                return 1
            fi
            ;;
    esac
    
    printf '%s\n' "${apps[@]}"
}

get_app_info() {
    local app_id="$1"
    local field="$2"
    
    jq -r ".applications[] | select(.id == \"$app_id\") | .${field}" "$REGISTRY_FILE"
}

validate_app() {
    local app_id="$1"
    local app_path
    app_path="$(get_app_info "$app_id" "path")"
    local full_path="${PROJECT_ROOT}/${app_path}"
    
    log_info "Validating application: $app_id"
    
    # Check if directory exists
    if [[ ! -d "$full_path" ]]; then
        log_error "Application directory not found: $full_path"
        return 1
    fi
    
    # Check required files
    local required_files=("package.json" "next.config.js" "wrangler.jsonc")
    for file in "${required_files[@]}"; do
        if [[ ! -f "${full_path}/${file}" ]]; then
            log_error "Required file missing in $app_id: $file"
            return 1
        fi
    done
    
    # Validate package.json
    if ! jq -e '.scripts.build' "${full_path}/package.json" > /dev/null; then
        log_error "No build script found in $app_id package.json"
        return 1
    fi
    
    # Validate wrangler.jsonc
    if ! jq -e '.name' "${full_path}/wrangler.jsonc" > /dev/null; then
        log_error "Invalid wrangler.jsonc in $app_id"
        return 1
    fi
    
    log_success "✓ $app_id validation passed"
    return 0
}

# =============================================================================
# BUILD FUNCTIONS
# =============================================================================

build_app() {
    local app_id="$1"
    local app_path
    app_path="$(get_app_info "$app_id" "path")"
    local full_path="${PROJECT_ROOT}/${app_path}"
    local build_log="${LOG_DIR}/build_${app_id}_${TIMESTAMP}.log"
    
    log_info "Building application: $app_id"
    
    (
        cd "$full_path"
        
        # Install dependencies if needed
        if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
            log_info "Installing dependencies for $app_id"
            timeout $BUILD_TIMEOUT pnpm install 2>&1 | tee -a "$build_log"
        fi
        
        # Run type check
        log_info "Running type check for $app_id"
        timeout $BUILD_TIMEOUT npm run type-check 2>&1 | tee -a "$build_log" || {
            log_warning "Type check failed for $app_id (continuing anyway)"
        }
        
        # Build application
        log_info "Building $app_id"
        timeout $BUILD_TIMEOUT npm run build 2>&1 | tee -a "$build_log"
        
        # Convert to Workers format
        log_info "Converting $app_id to Workers format"
        timeout $BUILD_TIMEOUT pnpm exec next-on-pages 2>&1 | tee -a "$build_log"
        
        # Verify build artifacts
        if [[ ! -f ".vercel/output/static/_worker.js/index.js" ]]; then
            log_error "Workers build artifact not found for $app_id"
            return 1
        fi
        
    ) || return 1
    
    log_success "✓ $app_id build completed"
    return 0
}

build_apps_parallel() {
    local apps=("$@")
    local pids=()
    local results=()
    local success_count=0
    local failure_count=0
    
    print_section "Building Applications (Parallel)"
    
    # Start builds in parallel
    for app_id in "${apps[@]}"; do
        # Limit parallel builds
        while [[ ${#pids[@]} -ge $MAX_PARALLEL_BUILDS ]]; do
            sleep 1
            # Check for completed builds
            for i in "${!pids[@]}"; do
                if ! kill -0 "${pids[i]}" 2>/dev/null; then
                    wait "${pids[i]}"
                    local exit_code=$?
                    if [[ $exit_code -eq 0 ]]; then
                        results[i]="SUCCESS"
                        ((success_count++))
                    else
                        results[i]="FAILED"
                        ((failure_count++))
                    fi
                    unset pids[i]
                fi
            done
            # Rebuild arrays to remove holes
            pids=("${pids[@]}")
        done
        
        # Start new build
        log_info "Starting build for: $app_id"
        build_app "$app_id" &
        pids+=($!)
    done
    
    # Wait for remaining builds
    for pid in "${pids[@]}"; do
        wait "$pid"
        local exit_code=$?
        if [[ $exit_code -eq 0 ]]; then
            ((success_count++))
        else
            ((failure_count++))
        fi
    done
    
    log_info "Build results: $success_count successful, $failure_count failed"
    
    if [[ $failure_count -gt 0 ]]; then
        log_error "Some builds failed. Check individual build logs."
        return 1
    fi
    
    log_success "All builds completed successfully"
    return 0
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

deploy_app() {
    local app_id="$1"
    local environment="$2"
    local app_path
    app_path="$(get_app_info "$app_id" "path")"
    local full_path="${PROJECT_ROOT}/${app_path}"
    local deploy_log="${LOG_DIR}/deploy_${app_id}_${environment}_${TIMESTAMP}.log"
    
    log_info "Deploying $app_id to $environment"
    
    (
        cd "$full_path"
        
        # Deploy using wrangler
        local wrangler_cmd="wrangler deploy"
        if [[ "$environment" != "production" ]]; then
            wrangler_cmd="$wrangler_cmd --env $environment"
        fi
        
        timeout $BUILD_TIMEOUT $wrangler_cmd 2>&1 | tee -a "$deploy_log"
        
    ) || return 1
    
    log_success "✓ $app_id deployed to $environment"
    return 0
}

health_check_app() {
    local app_id="$1"
    local environment="$2"
    local subdomain
    subdomain="$(get_app_info "$app_id" "subdomain")"
    local health_endpoint
    health_endpoint="$(get_app_info "$app_id" "health_endpoint")"
    
    local base_url
    if [[ "$environment" == "production" ]]; then
        base_url="https://staff.gangerdermatology.com"
    else
        base_url="https://staff-${environment}.gangerdermatology.com"
    fi
    
    local health_url="${base_url}/${subdomain}${health_endpoint}"
    
    log_info "Health checking $app_id at: $health_url"
    
    local attempts=0
    while [[ $attempts -lt $RETRY_COUNT ]]; do
        if curl -sf --max-time $HEALTH_CHECK_TIMEOUT "$health_url" > /dev/null; then
            log_success "✓ $app_id health check passed"
            return 0
        fi
        
        ((attempts++))
        log_warning "Health check attempt $attempts failed for $app_id"
        
        if [[ $attempts -lt $RETRY_COUNT ]]; then
            sleep $RETRY_DELAY
        fi
    done
    
    log_error "Health check failed for $app_id after $RETRY_COUNT attempts"
    return 1
}

# =============================================================================
# MAIN DEPLOYMENT ORCHESTRATION
# =============================================================================

deploy_applications() {
    local apps=("$@")
    local environment="${ENVIRONMENT:-staging}"
    
    print_section "Deployment Orchestration"
    log_info "Environment: $environment"
    log_info "Applications: ${apps[*]}"
    
    # Phase 1: Validation
    print_section "Phase 1: Application Validation"
    for app_id in "${apps[@]}"; do
        if ! validate_app "$app_id"; then
            log_critical "Validation failed for $app_id"
            return 1
        fi
    done
    
    # Phase 2: Build
    print_section "Phase 2: Application Builds"
    if ! build_apps_parallel "${apps[@]}"; then
        log_critical "Build phase failed"
        return 1
    fi
    
    # Phase 3: Deploy
    print_section "Phase 3: Application Deployment"
    local deploy_success=0
    local deploy_failures=0
    
    for app_id in "${apps[@]}"; do
        if deploy_app "$app_id" "$environment"; then
            ((deploy_success++))
        else
            ((deploy_failures++))
            log_error "Deployment failed for: $app_id"
        fi
    done
    
    # Phase 4: Health Checks
    print_section "Phase 4: Health Verification"
    local health_success=0
    local health_failures=0
    
    for app_id in "${apps[@]}"; do
        if health_check_app "$app_id" "$environment"; then
            ((health_success++))
        else
            ((health_failures++))
            log_error "Health check failed for: $app_id"
        fi
    done
    
    # Summary
    print_section "Deployment Summary"
    log_info "Deploy Results: $deploy_success successful, $deploy_failures failed"
    log_info "Health Results: $health_success healthy, $health_failures unhealthy"
    
    if [[ $deploy_failures -gt 0 ]] || [[ $health_failures -gt 0 ]]; then
        log_critical "Deployment completed with failures"
        return 1
    fi
    
    log_success "All applications deployed and healthy"
    return 0
}

# =============================================================================
# COMMAND LINE INTERFACE
# =============================================================================

usage() {
    cat << EOF
USAGE: $(basename "$0") [OPTIONS] COMMAND [ARGS...]

DESCRIPTION:
    Master deployment script for Ganger Platform medical applications.
    Provides comprehensive build, deploy, and verification capabilities.

COMMANDS:
    validate [APP|GROUP]     Validate application(s) configuration
    build [APP|GROUP]        Build application(s) for deployment
    deploy [APP|GROUP]       Deploy application(s) to environment
    health [APP|GROUP]       Check health of deployed application(s)
    full [APP|GROUP]         Complete deployment pipeline (build + deploy + health)
    
    list                     List all available applications
    status                   Show deployment status

OPTIONS:
    -e, --environment ENV    Target environment (staging|production) [default: staging]
    -p, --parallel N         Max parallel builds [default: $MAX_PARALLEL_BUILDS]
    -t, --timeout SECONDS    Build timeout [default: $BUILD_TIMEOUT]
    -v, --verbose            Verbose logging
    -h, --help              Show this help message

EXAMPLES:
    $(basename "$0") list
    $(basename "$0") validate all
    $(basename "$0") build critical
    $(basename "$0") deploy inventory
    $(basename "$0") -e production full critical
    $(basename "$0") health all

GROUPS:
    critical    Mission-critical applications
    high        High-priority applications  
    medium      Medium-priority applications
    low         Low-priority applications
    all         All applications

EOF
}

main() {
    # Initialize logging
    mkdir -p "$LOG_DIR"
    
    # Parse command line arguments
    local environment="staging"
    local verbose=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                environment="$2"
                shift 2
                ;;
            -p|--parallel)
                MAX_PARALLEL_BUILDS="$2"
                shift 2
                ;;
            -t|--timeout)
                BUILD_TIMEOUT="$2"
                shift 2
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
            *)
                break
                ;;
        esac
    done
    
    # Set environment variable for other functions
    export ENVIRONMENT="$environment"
    
    if [[ $# -eq 0 ]]; then
        print_banner
        usage
        exit 1
    fi
    
    print_banner
    log_info "Starting deployment operation: $*"
    log_info "Environment: $environment"
    log_info "Log file: $LOG_FILE"
    
    check_prerequisites
    
    local command="$1"
    shift
    
    case "$command" in
        validate)
            local target="${1:-all}"
            local apps
            mapfile -t apps < <(get_apps "$target")
            
            print_section "Validating Applications: ${apps[*]}"
            for app_id in "${apps[@]}"; do
                validate_app "$app_id"
            done
            ;;
            
        build)
            local target="${1:-all}"
            local apps
            mapfile -t apps < <(get_apps "$target")
            
            build_apps_parallel "${apps[@]}"
            ;;
            
        deploy)
            local target="${1:-all}"
            local apps
            mapfile -t apps < <(get_apps "$target")
            
            print_section "Deploying Applications: ${apps[*]}"
            for app_id in "${apps[@]}"; do
                deploy_app "$app_id" "$environment"
            done
            ;;
            
        health)
            local target="${1:-all}"
            local apps
            mapfile -t apps < <(get_apps "$target")
            
            print_section "Health Checking Applications: ${apps[*]}"
            for app_id in "${apps[@]}"; do
                health_check_app "$app_id" "$environment"
            done
            ;;
            
        full)
            local target="${1:-all}"
            local apps
            mapfile -t apps < <(get_apps "$target")
            
            deploy_applications "${apps[@]}"
            ;;
            
        list)
            print_section "Available Applications"
            jq -r '.applications[] | "\(.id) - \(.name) (\(.priority))"' "$REGISTRY_FILE"
            
            echo
            print_section "Deployment Groups"
            jq -r '.deployment_groups | to_entries[] | "\(.key): \(.value | join(", "))"' "$REGISTRY_FILE"
            ;;
            
        status)
            print_section "Deployment Status"
            log_info "Registry: $REGISTRY_FILE"
            log_info "Applications: $(jq -r '.applications | length' "$REGISTRY_FILE")"
            log_info "Environment: $environment"
            log_info "Last deployment: $TIMESTAMP"
            ;;
            
        *)
            log_error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
    
    log_success "Operation completed successfully"
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi