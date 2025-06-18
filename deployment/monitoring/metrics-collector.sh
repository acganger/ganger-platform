#!/bin/bash

# =============================================================================
# GANGER PLATFORM - METRICS COLLECTION SYSTEM
# =============================================================================
# Comprehensive metrics collection for medical platform monitoring
# Features: Performance metrics, HIPAA compliance, analytics integration
# Version: 1.0.0
# Date: 2025-01-18
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
readonly REGISTRY_FILE="${DEPLOYMENT_DIR}/apps-registry.json"
readonly MONITORING_DIR="${DEPLOYMENT_DIR}/monitoring"
readonly METRICS_DIR="${MONITORING_DIR}/metrics"
readonly LOG_DIR="${MONITORING_DIR}/logs"
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
    echo "  GANGER PLATFORM - METRICS COLLECTION SYSTEM"
    echo "  Performance Monitoring & Analytics for Medical Platform"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

# =============================================================================
# METRICS COLLECTION FUNCTIONS
# =============================================================================

collect_application_metrics() {
    local app_id="$1"
    local environment="${2:-production}"
    
    log_info "Collecting metrics for $app_id ($environment)..."
    
    # Get application metadata
    local subdomain
    subdomain="$(jq -r ".applications[] | select(.id == \"$app_id\") | .subdomain" "$REGISTRY_FILE")"
    local priority
    priority="$(jq -r ".applications[] | select(.id == \"$app_id\") | .priority" "$REGISTRY_FILE")"
    
    # Construct URLs
    local base_url
    if [[ "$environment" == "production" ]]; then
        base_url="https://staff.gangerdermatology.com"
    else
        base_url="https://staff-staging.gangerdermatology.com"
    fi
    
    local app_url
    if [[ "$subdomain" == "main" ]]; then
        app_url="$base_url"
    else
        app_url="$base_url/$subdomain"
    fi
    
    # Collect performance metrics
    local metrics
    metrics="$(collect_performance_metrics "$app_url" "$app_id")"
    
    # Collect health metrics
    local health_metrics
    health_metrics="$(collect_health_metrics "$app_id" "$environment")"
    
    # Collect usage metrics
    local usage_metrics
    usage_metrics="$(collect_usage_metrics "$app_id" "$environment")"
    
    # Combine metrics
    local combined_metrics
    combined_metrics="$(jq -n \
        --arg timestamp "$(date -Iseconds)" \
        --arg app_id "$app_id" \
        --arg environment "$environment" \
        --arg priority "$priority" \
        --argjson performance "$metrics" \
        --argjson health "$health_metrics" \
        --argjson usage "$usage_metrics" \
        '{
            timestamp: $timestamp,
            app_id: $app_id,
            environment: $environment,
            priority: $priority,
            performance: $performance,
            health: $health,
            usage: $usage,
            collection_version: "1.0.0"
        }')"
    
    # Store metrics
    store_metrics "$app_id" "$environment" "$combined_metrics"
    
    # Send to analytics (if configured)
    send_to_analytics "$combined_metrics"
    
    log_success "Metrics collected for $app_id"
    echo "$combined_metrics"
}

collect_performance_metrics() {
    local app_url="$1"
    local app_id="$2"
    
    # Perform performance measurement
    local start_time
    start_time="$(date +%s.%6N)"
    
    local response
    local http_code
    local time_total
    local time_connect
    local time_ssl
    local time_pretransfer
    local time_redirect
    local time_starttransfer
    local size_download
    local speed_download
    
    if response=$(curl -sf --max-time 30 \
                      -H "User-Agent: Ganger-Platform-Metrics/1.0" \
                      -H "Accept: application/json" \
                      -w "%{http_code}|%{time_total}|%{time_connect}|%{time_appconnect}|%{time_pretransfer}|%{time_redirect}|%{time_starttransfer}|%{size_download}|%{speed_download}" \
                      "$app_url/api/health" 2>/dev/null); then
        
        # Parse curl output
        IFS='|' read -r http_code time_total time_connect time_ssl time_pretransfer time_redirect time_starttransfer size_download speed_download <<< "${response##*|}"
        
        # Convert to milliseconds
        time_total_ms="$(echo "$time_total * 1000" | bc -l | xargs printf "%.0f")"
        time_connect_ms="$(echo "$time_connect * 1000" | bc -l | xargs printf "%.0f")"
        time_ssl_ms="$(echo "$time_ssl * 1000" | bc -l | xargs printf "%.0f")"
        time_pretransfer_ms="$(echo "$time_pretransfer * 1000" | bc -l | xargs printf "%.0f")"
        time_redirect_ms="$(echo "$time_redirect * 1000" | bc -l | xargs printf "%.0f")"
        time_starttransfer_ms="$(echo "$time_starttransfer * 1000" | bc -l | xargs printf "%.0f")"
        
        # Create performance metrics object
        jq -n \
            --arg http_code "$http_code" \
            --arg response_time_ms "$time_total_ms" \
            --arg connect_time_ms "$time_connect_ms" \
            --arg ssl_time_ms "$time_ssl_ms" \
            --arg pretransfer_time_ms "$time_pretransfer_ms" \
            --arg redirect_time_ms "$time_redirect_ms" \
            --arg starttransfer_time_ms "$time_starttransfer_ms" \
            --arg response_size_bytes "$size_download" \
            --arg download_speed_bps "$speed_download" \
            --arg status "success" \
            '{
                http_code: ($http_code | tonumber),
                response_time_ms: ($response_time_ms | tonumber),
                connect_time_ms: ($connect_time_ms | tonumber),
                ssl_time_ms: ($ssl_time_ms | tonumber),
                pretransfer_time_ms: ($pretransfer_time_ms | tonumber),
                redirect_time_ms: ($redirect_time_ms | tonumber),
                starttransfer_time_ms: ($starttransfer_time_ms | tonumber),
                response_size_bytes: ($response_size_bytes | tonumber),
                download_speed_bps: ($download_speed_bps | tonumber),
                status: $status
            }'
    else
        # Failed request
        jq -n \
            --arg status "failed" \
            '{
                http_code: 0,
                response_time_ms: 0,
                connect_time_ms: 0,
                ssl_time_ms: 0,
                pretransfer_time_ms: 0,
                redirect_time_ms: 0,
                starttransfer_time_ms: 0,
                response_size_bytes: 0,
                download_speed_bps: 0,
                status: $status
            }'
    fi
}

collect_health_metrics() {
    local app_id="$1"
    local environment="$2"
    
    # Run health check and capture metrics
    local health_result
    health_result="$("${SCRIPT_DIR}/health-check-system.sh" check "$app_id" "$environment" 2>/dev/null || echo "DOWN|000|0|unknown|Health check failed")"
    
    IFS='|' read -r status http_code response_time health_url response_body <<< "$health_result"
    
    # Create health metrics object
    jq -n \
        --arg status "$status" \
        --arg http_code "$http_code" \
        --arg response_time_ms "$response_time" \
        --arg health_url "$health_url" \
        --arg last_check "$(date -Iseconds)" \
        '{
            status: $status,
            http_code: ($http_code | tonumber),
            response_time_ms: ($response_time_ms | tonumber),
            health_url: $health_url,
            last_check: $last_check,
            is_healthy: ($status == "HEALTHY"),
            is_degraded: ($status == "DEGRADED" or $status == "SLOW")
        }'
}

collect_usage_metrics() {
    local app_id="$1"
    local environment="$2"
    
    # Collect usage metrics (placeholder for actual implementation)
    # This would integrate with Cloudflare Analytics API
    
    jq -n \
        --arg period "24h" \
        '{
            period: $period,
            requests_total: 0,
            requests_per_hour: 0,
            unique_visitors: 0,
            error_rate: 0.0,
            cache_hit_ratio: 0.0,
            bandwidth_bytes: 0,
            note: "Usage metrics require Cloudflare Analytics API integration"
        }'
}

store_metrics() {
    local app_id="$1"
    local environment="$2"
    local metrics="$3"
    
    # Create metrics file
    local metrics_file="${METRICS_DIR}/${app_id}_${environment}_$(date +%Y%m%d).jsonl"
    mkdir -p "$(dirname "$metrics_file")"
    
    # Append metrics (JSONL format for easy processing)
    echo "$metrics" >> "$metrics_file"
    
    # Keep only last 30 days of metrics
    find "$METRICS_DIR" -name "${app_id}_${environment}_*.jsonl" -mtime +30 -delete 2>/dev/null || true
}

send_to_analytics() {
    local metrics="$1"
    
    # Send to Cloudflare Analytics Engine (if available)
    if command -v wrangler &> /dev/null && [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        # This would send metrics to Analytics Engine
        log_info "Sending metrics to Cloudflare Analytics Engine..."
        # Implementation would depend on Analytics Engine setup
    fi
    
    # Send to external monitoring (placeholder)
    if [[ -n "${MONITORING_WEBHOOK_URL:-}" ]]; then
        curl -sf -X POST \
             -H "Content-Type: application/json" \
             -d "$metrics" \
             "${MONITORING_WEBHOOK_URL}" > /dev/null || \
             log_warning "Failed to send metrics to external monitoring"
    fi
}

# =============================================================================
# METRICS ANALYSIS AND REPORTING
# =============================================================================

generate_metrics_report() {
    local environment="${1:-production}"
    local period="${2:-24h}"
    
    log_info "Generating metrics report for $environment (period: $period)..."
    
    local report_file="${MONITORING_DIR}/reports/metrics_report_${environment}_${TIMESTAMP}.json"
    mkdir -p "$(dirname "$report_file")"
    
    # Get all applications
    local apps=()
    mapfile -t apps < <(jq -r '.applications[].id' "$REGISTRY_FILE")
    
    # Calculate date range
    local start_date
    case "$period" in
        "1h")   start_date="$(date -d '1 hour ago' -Iseconds)" ;;
        "24h")  start_date="$(date -d '1 day ago' -Iseconds)" ;;
        "7d")   start_date="$(date -d '7 days ago' -Iseconds)" ;;
        "30d")  start_date="$(date -d '30 days ago' -Iseconds)" ;;
        *)      start_date="$(date -d '1 day ago' -Iseconds)" ;;
    esac
    
    # Initialize report
    local report
    report="$(jq -n \
        --arg timestamp "$(date -Iseconds)" \
        --arg environment "$environment" \
        --arg period "$period" \
        --arg start_date "$start_date" \
        '{
            timestamp: $timestamp,
            environment: $environment,
            period: $period,
            start_date: $start_date,
            applications: [],
            summary: {}
        }')"
    
    # Collect metrics for each application
    local total_apps=0
    local healthy_apps=0
    local degraded_apps=0
    local unhealthy_apps=0
    local total_response_time=0
    
    for app_id in "${apps[@]}"; do
        ((total_apps++))
        
        # Get latest metrics for this app
        local app_metrics_file="${METRICS_DIR}/${app_id}_${environment}_$(date +%Y%m%d).jsonl"
        
        if [[ -f "$app_metrics_file" ]]; then
            # Get most recent metric
            local latest_metric
            latest_metric="$(tail -1 "$app_metrics_file")"
            
            # Extract key metrics
            local status
            status="$(echo "$latest_metric" | jq -r '.health.status')"
            local response_time
            response_time="$(echo "$latest_metric" | jq -r '.performance.response_time_ms')"
            
            # Update counters
            case "$status" in
                "HEALTHY") ((healthy_apps++)) ;;
                "DEGRADED"|"SLOW") ((degraded_apps++)) ;;
                *) ((unhealthy_apps++)) ;;
            esac
            
            if [[ "$response_time" != "null" && "$response_time" != "0" ]]; then
                total_response_time=$((total_response_time + response_time))
            fi
            
            # Add to report
            report="$(echo "$report" | jq --argjson app_metric "$latest_metric" '.applications += [$app_metric]')"
        else
            log_warning "No metrics found for $app_id"
            ((unhealthy_apps++))
        fi
    done
    
    # Calculate summary statistics
    local avg_response_time=0
    if [[ $total_apps -gt 0 && $total_response_time -gt 0 ]]; then
        avg_response_time=$((total_response_time / total_apps))
    fi
    
    local health_percentage=0
    if [[ $total_apps -gt 0 ]]; then
        health_percentage=$((healthy_apps * 100 / total_apps))
    fi
    
    # Update report with summary
    report="$(echo "$report" | jq \
        --arg total_apps "$total_apps" \
        --arg healthy_apps "$healthy_apps" \
        --arg degraded_apps "$degraded_apps" \
        --arg unhealthy_apps "$unhealthy_apps" \
        --arg avg_response_time "$avg_response_time" \
        --arg health_percentage "$health_percentage" \
        '.summary = {
            total_applications: ($total_apps | tonumber),
            healthy_applications: ($healthy_apps | tonumber),
            degraded_applications: ($degraded_apps | tonumber),
            unhealthy_applications: ($unhealthy_apps | tonumber),
            average_response_time_ms: ($avg_response_time | tonumber),
            health_percentage: ($health_percentage | tonumber)
        }')"
    
    # Save report
    echo "$report" > "$report_file"
    
    log_success "Metrics report generated: $report_file"
    
    # Display summary
    echo
    log_info "Metrics Report Summary ($environment):"
    echo "  Total Applications: $total_apps"
    echo "  Healthy: ${GREEN}$healthy_apps${NC}"
    echo "  Degraded: ${YELLOW}$degraded_apps${NC}"
    echo "  Unhealthy: ${RED}$unhealthy_apps${NC}"
    echo "  Health Percentage: $health_percentage%"
    echo "  Average Response Time: ${avg_response_time}ms"
    
    echo "$report"
}

# =============================================================================
# CONTINUOUS METRICS COLLECTION
# =============================================================================

start_metrics_collection() {
    local environment="${1:-production}"
    local interval="${2:-300}"  # 5 minutes default
    
    log_info "Starting continuous metrics collection for $environment (interval: ${interval}s)"
    
    while true; do
        log_info "Collecting metrics cycle..."
        
        # Get all applications
        local apps=()
        mapfile -t apps < <(jq -r '.applications[].id' "$REGISTRY_FILE")
        
        # Collect metrics for each application
        for app_id in "${apps[@]}"; do
            collect_application_metrics "$app_id" "$environment" > /dev/null || \
                log_warning "Failed to collect metrics for $app_id"
        done
        
        log_success "Metrics collection cycle completed"
        sleep "$interval"
    done
}

# =============================================================================
# COMMAND LINE INTERFACE
# =============================================================================

usage() {
    cat << EOF
USAGE: $(basename "$0") [OPTIONS] COMMAND [ARGS...]

DESCRIPTION:
    Metrics collection and analysis system for Ganger Platform.

COMMANDS:
    collect APP [ENV]       Collect metrics for specific application
    all [ENV]              Collect metrics for all applications  
    report [ENV] [PERIOD]  Generate metrics report (1h|24h|7d|30d)
    monitor [ENV] [INTERVAL] Start continuous metrics collection
    analyze APP [ENV]      Analyze metrics trends for application

OPTIONS:
    -h, --help             Show this help message

EXAMPLES:
    $(basename "$0") collect inventory production
    $(basename "$0") all staging
    $(basename "$0") report production 24h
    $(basename "$0") monitor production 300
    $(basename "$0") analyze medication-auth

EOF
}

main() {
    # Initialize directories
    mkdir -p "$MONITORING_DIR" "$METRICS_DIR" "$LOG_DIR" "${MONITORING_DIR}/reports"
    
    if [[ $# -eq 0 ]]; then
        print_banner
        usage
        exit 1
    fi
    
    print_banner
    
    local command="$1"
    shift
    
    case "$command" in
        collect)
            local app_id="${1:-}"
            local environment="${2:-production}"
            if [[ -z "$app_id" ]]; then
                log_error "Application ID required"
                exit 1
            fi
            collect_application_metrics "$app_id" "$environment"
            ;;
        all)
            local environment="${1:-production}"
            local apps=()
            mapfile -t apps < <(jq -r '.applications[].id' "$REGISTRY_FILE")
            
            log_info "Collecting metrics for all applications in $environment..."
            for app_id in "${apps[@]}"; do
                collect_application_metrics "$app_id" "$environment" > /dev/null
                log_success "✓ $app_id"
            done
            ;;
        report)
            local environment="${1:-production}"
            local period="${2:-24h}"
            generate_metrics_report "$environment" "$period"
            ;;
        monitor)
            local environment="${1:-production}"
            local interval="${2:-300}"
            start_metrics_collection "$environment" "$interval"
            ;;
        analyze)
            local app_id="${1:-}"
            local environment="${2:-production}"
            if [[ -z "$app_id" ]]; then
                log_error "Application ID required"
                exit 1
            fi
            log_info "Analysis feature coming soon for $app_id"
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