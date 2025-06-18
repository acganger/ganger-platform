#!/bin/bash

# =============================================================================
# GANGER PLATFORM - STATUS TRACKING SCRIPT
# =============================================================================
# Real-time deployment status tracking and reporting
# Version: 1.0.0
# Date: 2025-01-18
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly REGISTRY_FILE="${PROJECT_ROOT}/deployment/apps-registry.json"
readonly STATUS_DIR="${PROJECT_ROOT}/deployment/status"
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
    echo "  GANGER PLATFORM - DEPLOYMENT STATUS TRACKER"
    echo "  Real-time Application Status Monitoring"
    echo "  Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

check_app_health() {
    local app_id="$1"
    local environment="${2:-production}"
    
    local subdomain
    subdomain="$(jq -r ".applications[] | select(.id == \"$app_id\") | .subdomain" "$REGISTRY_FILE")"
    
    local health_endpoint
    health_endpoint="$(jq -r ".applications[] | select(.id == \"$app_id\") | .health_endpoint" "$REGISTRY_FILE")"
    
    local base_url
    if [[ "$environment" == "production" ]]; then
        base_url="https://staff.gangerdermatology.com"
    else
        base_url="https://staff-${environment}.gangerdermatology.com"
    fi
    
    local health_url
    if [[ "$subdomain" == "main" ]]; then
        health_url="${base_url}${health_endpoint}"
    else
        health_url="${base_url}/${subdomain}${health_endpoint}"
    fi
    
    local status="UNKNOWN"
    local response_time="N/A"
    local status_code="N/A"
    
    # Perform health check with timeout
    local start_time
    start_time="$(date +%s.%3N)"
    
    if response=$(curl -sf --max-time 10 -w "%{http_code}" "$health_url" 2>/dev/null); then
        local end_time
        end_time="$(date +%s.%3N)"
        response_time="$(echo "$end_time - $start_time" | bc -l | xargs printf "%.0f")"
        
        status_code="${response: -3}"
        if [[ "$status_code" == "200" ]]; then
            status="HEALTHY"
        else
            status="UNHEALTHY"
        fi
    else
        status="DOWN"
    fi
    
    echo "$status|$status_code|${response_time}ms|$health_url"
}

check_build_status() {
    local app_id="$1"
    local app_path
    app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "$REGISTRY_FILE")"
    local full_path="${PROJECT_ROOT}/${app_path}"
    
    if [[ ! -d "$full_path" ]]; then
        echo "MISSING|Directory not found"
        return
    fi
    
    if [[ ! -f "${full_path}/package.json" ]]; then
        echo "INVALID|No package.json"
        return
    fi
    
    # Check if built
    if [[ -f "${full_path}/.vercel/output/static/_worker.js/index.js" ]]; then
        local build_time="N/A"
        if [[ -f "${full_path}/.vercel/output/static/_worker.js/index.js" ]]; then
            build_time="$(stat -c %Y "${full_path}/.vercel/output/static/_worker.js/index.js" 2>/dev/null || echo "N/A")"
            if [[ "$build_time" != "N/A" ]]; then
                build_time="$(date -d "@$build_time" '+%Y-%m-%d %H:%M:%S')"
            fi
        fi
        echo "BUILT|Last built: $build_time"
    else
        echo "NOT_BUILT|Worker artifact missing"
    fi
}

generate_status_report() {
    local environment="${1:-production}"
    local output_format="${2:-table}"
    
    mkdir -p "$STATUS_DIR"
    
    print_banner
    log_info "Generating status report for environment: $environment"
    
    local report_file="${STATUS_DIR}/status_report_${environment}_${TIMESTAMP}.json"
    local apps=()
    
    # Get all applications
    mapfile -t apps < <(jq -r '.applications[].id' "$REGISTRY_FILE")
    
    echo "{" > "$report_file"
    echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$report_file"
    echo "  \"environment\": \"$environment\"," >> "$report_file"
    echo "  \"applications\": [" >> "$report_file"
    
    if [[ "$output_format" == "table" ]]; then
        echo -e "\n${BLUE}Application Status Report${NC}"
        echo "================================================================================================================"
        printf "%-20s %-12s %-8s %-12s %-12s %-10s %-40s\n" "Application" "Priority" "Health" "Status Code" "Response" "Build" "Health URL"
        echo "================================================================================================================"
    fi
    
    local healthy_count=0
    local total_count=0
    
    for i in "${!apps[@]}"; do
        local app_id="${apps[i]}"
        ((total_count++))
        
        # Get app metadata
        local app_name
        app_name="$(jq -r ".applications[] | select(.id == \"$app_id\") | .name" "$REGISTRY_FILE")"
        local priority
        priority="$(jq -r ".applications[] | select(.id == \"$app_id\") | .priority" "$REGISTRY_FILE")"
        
        # Check health
        local health_result
        health_result="$(check_app_health "$app_id" "$environment")"
        IFS='|' read -r health_status status_code response_time health_url <<< "$health_result"
        
        # Check build status
        local build_result
        build_result="$(check_build_status "$app_id")"
        IFS='|' read -r build_status build_info <<< "$build_result"
        
        if [[ "$health_status" == "HEALTHY" ]]; then
            ((healthy_count++))
        fi
        
        # JSON output
        echo "    {" >> "$report_file"
        echo "      \"id\": \"$app_id\"," >> "$report_file"
        echo "      \"name\": \"$app_name\"," >> "$report_file"
        echo "      \"priority\": \"$priority\"," >> "$report_file"
        echo "      \"health_status\": \"$health_status\"," >> "$report_file"
        echo "      \"status_code\": \"$status_code\"," >> "$report_file"
        echo "      \"response_time\": \"$response_time\"," >> "$report_file"
        echo "      \"build_status\": \"$build_status\"," >> "$report_file"
        echo "      \"build_info\": \"$build_info\"," >> "$report_file"
        echo "      \"health_url\": \"$health_url\"" >> "$report_file"
        if [[ $i -lt $((${#apps[@]} - 1)) ]]; then
            echo "    }," >> "$report_file"
        else
            echo "    }" >> "$report_file"
        fi
        
        # Table output
        if [[ "$output_format" == "table" ]]; then
            local health_color=""
            local build_color=""
            
            case "$health_status" in
                "HEALTHY") health_color="${GREEN}" ;;
                "UNHEALTHY") health_color="${YELLOW}" ;;
                "DOWN") health_color="${RED}" ;;
                *) health_color="${NC}" ;;
            esac
            
            case "$build_status" in
                "BUILT") build_color="${GREEN}" ;;
                "NOT_BUILT") build_color="${RED}" ;;
                *) build_color="${YELLOW}" ;;
            esac
            
            printf "%-20s %-12s ${health_color}%-8s${NC} %-12s %-12s ${build_color}%-10s${NC} %-40s\n" \
                "$app_id" "$priority" "$health_status" "$status_code" "$response_time" "$build_status" \
                "$(echo "$health_url" | cut -c1-40)"
        fi
    done
    
    echo "  ]," >> "$report_file"
    echo "  \"summary\": {" >> "$report_file"
    echo "    \"total_applications\": $total_count," >> "$report_file"
    echo "    \"healthy_applications\": $healthy_count," >> "$report_file"
    echo "    \"unhealthy_applications\": $((total_count - healthy_count))," >> "$report_file"
    echo "    \"health_percentage\": $(echo "scale=2; $healthy_count * 100 / $total_count" | bc -l)" >> "$report_file"
    echo "  }" >> "$report_file"
    echo "}" >> "$report_file"
    
    if [[ "$output_format" == "table" ]]; then
        echo "================================================================================================================"
        echo -e "\n${BLUE}Summary${NC}"
        echo "Total Applications: $total_count"
        echo "Healthy: ${GREEN}$healthy_count${NC}"
        echo "Unhealthy: ${RED}$((total_count - healthy_count))${NC}"
        echo "Health Rate: $(echo "scale=1; $healthy_count * 100 / $total_count" | bc -l)%"
        echo ""
        log_info "Detailed report saved to: $report_file"
    fi
}

watch_status() {
    local environment="${1:-production}"
    local interval="${2:-30}"
    
    log_info "Starting continuous monitoring (every ${interval}s). Press Ctrl+C to stop."
    
    while true; do
        clear
        generate_status_report "$environment" "table"
        sleep "$interval"
    done
}

usage() {
    cat << EOF
USAGE: $(basename "$0") [OPTIONS] COMMAND

DESCRIPTION:
    Real-time deployment status tracking for Ganger Platform applications.

COMMANDS:
    report [ENV]              Generate status report (default: production)
    watch [ENV] [INTERVAL]    Continuous monitoring (default: production, 30s)
    health APP [ENV]          Check specific application health
    build APP                 Check specific application build status

OPTIONS:
    -f, --format FORMAT      Output format (table|json) [default: table]
    -h, --help              Show this help message

EXAMPLES:
    $(basename "$0") report
    $(basename "$0") report staging
    $(basename "$0") watch production 60
    $(basename "$0") health inventory
    $(basename "$0") build medication-auth

EOF
}

main() {
    local output_format="table"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--format)
                output_format="$2"
                shift 2
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
    
    if [[ $# -eq 0 ]]; then
        generate_status_report "production" "$output_format"
        exit 0
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        report)
            local environment="${1:-production}"
            generate_status_report "$environment" "$output_format"
            ;;
        watch)
            local environment="${1:-production}"
            local interval="${2:-30}"
            watch_status "$environment" "$interval"
            ;;
        health)
            if [[ $# -eq 0 ]]; then
                log_error "Application ID required for health check"
                exit 1
            fi
            local app_id="$1"
            local environment="${2:-production}"
            local result
            result="$(check_app_health "$app_id" "$environment")"
            IFS='|' read -r status code time url <<< "$result"
            echo "Application: $app_id"
            echo "Status: $status"
            echo "Code: $code"
            echo "Response Time: $time"
            echo "URL: $url"
            ;;
        build)
            if [[ $# -eq 0 ]]; then
                log_error "Application ID required for build check"
                exit 1
            fi
            local app_id="$1"
            local result
            result="$(check_build_status "$app_id")"
            IFS='|' read -r status info <<< "$result"
            echo "Application: $app_id"
            echo "Build Status: $status"
            echo "Info: $info"
            ;;
        *)
            log_error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

main "$@"