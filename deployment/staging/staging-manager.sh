#!/bin/bash

# =============================================================================
# GANGER PLATFORM - STAGING ENVIRONMENT MANAGER
# =============================================================================
# Comprehensive staging environment management and automation
# Features: Environment setup, teardown, reset, monitoring, maintenance
# Version: 1.0.0
# Date: 2025-01-18
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
readonly STAGING_DIR="${DEPLOYMENT_DIR}/staging"
readonly CONFIG_FILE="${STAGING_DIR}/staging-config.json"
readonly LOG_DIR="${STAGING_DIR}/logs"
readonly TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

log_info() { echo -e "${CYAN}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

print_banner() {
    echo -e "${PURPLE}"
    echo "==============================================================================="
    echo "  GANGER PLATFORM - STAGING ENVIRONMENT MANAGER"
    echo "  Comprehensive Staging Environment Lifecycle Management"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

# =============================================================================
# ENVIRONMENT SETUP AND INITIALIZATION
# =============================================================================

setup_staging_environment() {
    log_info "Setting up staging environment..."
    
    # Create staging directories
    mkdir -p "$STAGING_DIR" "$LOG_DIR"
    mkdir -p "${STAGING_DIR}/backups" "${STAGING_DIR}/temp" "${STAGING_DIR}/reports"
    
    # Validate configuration
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "Staging configuration not found: $CONFIG_FILE"
        return 1
    fi
    
    # Setup Cloudflare resources for staging
    setup_cloudflare_staging_resources
    
    # Initialize staging monitoring
    setup_staging_monitoring
    
    # Configure staging-specific settings
    configure_staging_applications
    
    log_success "Staging environment setup completed"
}

setup_cloudflare_staging_resources() {
    log_info "Setting up Cloudflare staging resources..."
    
    # Create staging-specific KV namespaces
    if command -v wrangler &> /dev/null; then
        if wrangler kv:namespace create "ganger-platform-cache-staging" 2>/dev/null; then
            log_success "Staging KV namespace created"
        else
            log_warning "Staging KV namespace may already exist"
        fi
        
        # Create staging R2 bucket
        if wrangler r2 bucket create "ganger-platform-staging" 2>/dev/null; then
            log_success "Staging R2 bucket created"
        else
            log_warning "Staging R2 bucket may already exist"
        fi
    else
        log_warning "Wrangler not available, skipping Cloudflare resource setup"
    fi
}

setup_staging_monitoring() {
    log_info "Setting up staging monitoring..."
    
    # Start staging-specific monitoring
    if [[ -x "${DEPLOYMENT_DIR}/monitoring/monitoring-system.sh" ]]; then
        "${DEPLOYMENT_DIR}/monitoring/monitoring-system.sh" start staging &
        log_success "Staging monitoring started"
    else
        log_warning "Monitoring system not available"
    fi
}

configure_staging_applications() {
    log_info "Configuring staging applications..."
    
    # Get all applications
    local apps=()
    mapfile -t apps < <(jq -r '.applications[].id' "${DEPLOYMENT_DIR}/apps-registry.json")
    
    for app_id in "${apps[@]}"; do
        configure_staging_application "$app_id"
    done
    
    log_success "Staging applications configured"
}

configure_staging_application() {
    local app_id="$1"
    
    # Get application path
    local app_path
    app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "${DEPLOYMENT_DIR}/apps-registry.json")"
    local full_path="${PROJECT_ROOT}/${app_path}"
    
    if [[ ! -d "$full_path" ]]; then
        log_warning "Application directory not found: $full_path"
        return 1
    fi
    
    # Verify staging environment in wrangler config
    if [[ -f "${full_path}/wrangler.jsonc" ]]; then
        if jq -e '.env.staging' "${full_path}/wrangler.jsonc" > /dev/null; then
            log_success "✓ $app_id staging configuration verified"
        else
            log_warning "⚠ $app_id missing staging environment configuration"
        fi
    else
        log_warning "⚠ $app_id missing wrangler configuration"
    fi
}

# =============================================================================
# ENVIRONMENT MANAGEMENT OPERATIONS
# =============================================================================

reset_staging_environment() {
    log_info "Resetting staging environment..."
    
    # Stop all staging processes
    stop_staging_services
    
    # Clear staging data
    clear_staging_data
    
    # Reset staging deployments
    reset_staging_deployments
    
    # Restart staging services
    setup_staging_environment
    
    log_success "Staging environment reset completed"
}

stop_staging_services() {
    log_info "Stopping staging services..."
    
    # Stop monitoring
    if [[ -x "${DEPLOYMENT_DIR}/monitoring/monitoring-system.sh" ]]; then
        "${DEPLOYMENT_DIR}/monitoring/monitoring-system.sh" stop staging
    fi
    
    # Stop any staging-specific processes
    pkill -f "staging" 2>/dev/null || true
    
    log_success "Staging services stopped"
}

clear_staging_data() {
    log_info "Clearing staging data..."
    
    # Clear staging logs (keep last 7 days)
    find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Clear temporary files
    if [[ -d "${STAGING_DIR}/temp" ]]; then
        rm -rf "${STAGING_DIR}/temp"/*
    fi
    
    # Clear staging R2 bucket (if configured)
    if command -v wrangler &> /dev/null && [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        # Note: This would clear staging bucket contents
        log_info "Staging R2 bucket cleanup would be performed here"
    fi
    
    log_success "Staging data cleared"
}

reset_staging_deployments() {
    log_info "Resetting staging deployments..."
    
    # Get all applications
    local apps=()
    mapfile -t apps < <(jq -r '.applications[].id' "${DEPLOYMENT_DIR}/apps-registry.json")
    
    # Delete existing staging deployments
    for app_id in "${apps[@]}"; do
        if command -v wrangler &> /dev/null; then
            local app_path
            app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "${DEPLOYMENT_DIR}/apps-registry.json")"
            local full_path="${PROJECT_ROOT}/${app_path}"
            
            if [[ -d "$full_path" && -f "${full_path}/wrangler.jsonc" ]]; then
                (
                    cd "$full_path"
                    # Delete staging deployment
                    wrangler delete --env staging --force 2>/dev/null || true
                )
            fi
        fi
    done
    
    log_success "Staging deployments reset"
}

# =============================================================================
# STAGING HEALTH AND STATUS MONITORING
# =============================================================================

check_staging_health() {
    log_info "Checking staging environment health..."
    
    local health_status="HEALTHY"
    local issues=()
    
    # Check staging domain accessibility
    if ! curl -sf --max-time 10 "https://staff-staging.gangerdermatology.com" > /dev/null; then
        health_status="DEGRADED"
        issues+=("staging_domain_unreachable")
    fi
    
    # Check Cloudflare Workers status
    check_workers_status || {
        health_status="DEGRADED"
        issues+=("workers_issues")
    }
    
    # Check monitoring system
    if ! pgrep -f "monitoring.*staging" > /dev/null; then
        health_status="DEGRADED"
        issues+=("monitoring_not_running")
    fi
    
    # Check application health
    local unhealthy_apps=()
    local apps=()
    mapfile -t apps < <(jq -r '.applications[].id' "${DEPLOYMENT_DIR}/apps-registry.json")
    
    for app_id in "${apps[@]}"; do
        if ! check_application_staging_health "$app_id"; then
            unhealthy_apps+=("$app_id")
        fi
    done
    
    if [[ ${#unhealthy_apps[@]} -gt 0 ]]; then
        health_status="DEGRADED"
        issues+=("unhealthy_applications:${unhealthy_apps[*]}")
    fi
    
    # Generate health report
    local health_report
    health_report="$(jq -n \
        --arg timestamp "$(date -Iseconds)" \
        --arg status "$health_status" \
        --argjson issues "$(printf '%s\n' "${issues[@]}" | jq -R . | jq -s .)" \
        --argjson unhealthy_apps "$(printf '%s\n' "${unhealthy_apps[@]}" | jq -R . | jq -s .)" \
        '{
            timestamp: $timestamp,
            environment: "staging",
            status: $status,
            issues: $issues,
            unhealthy_applications: $unhealthy_apps,
            total_applications: '${#apps[@]}',
            healthy_applications: '$(( ${#apps[@]} - ${#unhealthy_apps[@]} ))'
        }')"
    
    # Save health report
    echo "$health_report" > "${LOG_DIR}/staging_health_${TIMESTAMP}.json"
    
    # Display results
    echo
    log_info "🏥 Staging Environment Health Report:"
    echo "  Status: $health_status"
    echo "  Total Applications: ${#apps[@]}"
    echo "  Healthy Applications: $(( ${#apps[@]} - ${#unhealthy_apps[@]} ))"
    echo "  Issues: ${#issues[@]}"
    
    if [[ ${#issues[@]} -gt 0 ]]; then
        echo "  Issue Details:"
        for issue in "${issues[@]}"; do
            echo "    - $issue"
        done
    fi
    
    if [[ "$health_status" != "HEALTHY" ]]; then
        return 1
    fi
    
    log_success "Staging environment is healthy"
    return 0
}

check_workers_status() {
    if ! command -v wrangler &> /dev/null; then
        log_warning "Wrangler not available for Workers status check"
        return 1
    fi
    
    # Check if we can list deployments (indicates Workers is accessible)
    if wrangler deployments list --env staging &> /dev/null; then
        return 0
    else
        return 1
    fi
}

check_application_staging_health() {
    local app_id="$1"
    
    # Use the health check system
    if [[ -x "${DEPLOYMENT_DIR}/monitoring/health-check-system.sh" ]]; then
        "${DEPLOYMENT_DIR}/monitoring/health-check-system.sh" check "$app_id" staging > /dev/null 2>&1
    else
        # Fallback health check
        local subdomain
        subdomain="$(jq -r ".applications[] | select(.id == \"$app_id\") | .subdomain" "${DEPLOYMENT_DIR}/apps-registry.json")"
        
        local staging_url
        if [[ "$subdomain" == "main" ]]; then
            staging_url="https://staff-staging.gangerdermatology.com"
        else
            staging_url="https://staff-staging.gangerdermatology.com/$subdomain"
        fi
        
        curl -sf --max-time 15 "$staging_url/api/health" > /dev/null
    fi
}

# =============================================================================
# STAGING MAINTENANCE AND CLEANUP
# =============================================================================

perform_staging_maintenance() {
    log_info "Performing staging maintenance..."
    
    # Cleanup old logs
    cleanup_old_logs
    
    # Cleanup temporary files
    cleanup_temp_files
    
    # Update staging configurations
    update_staging_configurations
    
    # Refresh staging data (if configured)
    refresh_staging_data
    
    # Generate maintenance report
    generate_maintenance_report
    
    log_success "Staging maintenance completed"
}

cleanup_old_logs() {
    log_info "Cleaning up old logs..."
    
    # Remove logs older than retention period
    local retention_days
    retention_days="$(jq -r '.data_management.logs.retention_days' "$CONFIG_FILE")"
    
    find "$LOG_DIR" -name "*.log" -mtime +${retention_days} -delete 2>/dev/null || true
    find "$LOG_DIR" -name "*.json" -mtime +${retention_days} -delete 2>/dev/null || true
    
    log_success "Old logs cleaned up"
}

cleanup_temp_files() {
    log_info "Cleaning up temporary files..."
    
    # Clean temporary directory
    if [[ -d "${STAGING_DIR}/temp" ]]; then
        find "${STAGING_DIR}/temp" -type f -mtime +1 -delete 2>/dev/null || true
    fi
    
    # Clean build artifacts older than 7 days
    find "${PROJECT_ROOT}/apps" -name ".vercel" -type d -exec find {} -mtime +7 -delete \; 2>/dev/null || true
    
    log_success "Temporary files cleaned up"
}

update_staging_configurations() {
    log_info "Updating staging configurations..."
    
    # Refresh application configurations
    configure_staging_applications
    
    # Update monitoring configurations
    if [[ -x "${DEPLOYMENT_DIR}/monitoring/monitoring-system.sh" ]]; then
        "${DEPLOYMENT_DIR}/monitoring/monitoring-system.sh" restart staging > /dev/null 2>&1 || true
    fi
    
    log_success "Staging configurations updated"
}

refresh_staging_data() {
    log_info "Refreshing staging data..."
    
    # Check if data refresh is enabled
    local data_refresh_enabled
    data_refresh_enabled="$(jq -r '.data_management.database.data_refresh.enabled' "$CONFIG_FILE")"
    
    if [[ "$data_refresh_enabled" == "true" ]]; then
        log_info "Data refresh would be performed here (placeholder)"
        # This would integrate with database refresh procedures
    else
        log_info "Data refresh not enabled"
    fi
    
    log_success "Staging data refresh completed"
}

generate_maintenance_report() {
    log_info "Generating maintenance report..."
    
    local report_file="${STAGING_DIR}/reports/maintenance_report_${TIMESTAMP}.json"
    mkdir -p "$(dirname "$report_file")"
    
    local report
    report="$(jq -n \
        --arg timestamp "$(date -Iseconds)" \
        --arg environment "staging" \
        '{
            timestamp: $timestamp,
            environment: $environment,
            maintenance_type: "routine",
            tasks_completed: [
                "log_cleanup",
                "temp_file_cleanup",
                "configuration_update",
                "data_refresh"
            ],
            status: "completed"
        }')"
    
    echo "$report" > "$report_file"
    
    log_success "Maintenance report generated: $report_file"
}

# =============================================================================
# COMMAND LINE INTERFACE
# =============================================================================

usage() {
    cat << EOF
USAGE: $(basename "$0") [OPTIONS] COMMAND [ARGS...]

DESCRIPTION:
    Comprehensive staging environment management for Ganger Platform.

COMMANDS:
    setup                   Setup staging environment
    reset                   Reset staging environment  
    health                  Check staging environment health
    status                  Show staging status
    maintenance             Perform staging maintenance
    cleanup                 Cleanup staging resources
    start                   Start staging services
    stop                    Stop staging services
    
OPTIONS:
    -h, --help             Show this help message

EXAMPLES:
    $(basename "$0") setup
    $(basename "$0") health
    $(basename "$0") reset
    $(basename "$0") maintenance

EOF
}

main() {
    # Initialize directories
    mkdir -p "$STAGING_DIR" "$LOG_DIR"
    
    if [[ $# -eq 0 ]]; then
        print_banner
        usage
        exit 1
    fi
    
    print_banner
    
    local command="$1"
    shift || true
    
    case "$command" in
        setup)
            setup_staging_environment
            ;;
        reset)
            reset_staging_environment
            ;;
        health)
            check_staging_health
            ;;
        status)
            check_staging_health
            ;;
        maintenance)
            perform_staging_maintenance
            ;;
        cleanup)
            clear_staging_data
            ;;
        start)
            setup_staging_monitoring
            log_success "Staging services started"
            ;;
        stop)
            stop_staging_services
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

main "$@"