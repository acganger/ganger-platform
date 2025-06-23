#!/bin/bash

# =============================================================================
# CLOUDFLARE WORKERS CONFIGURATION SCRIPT
# =============================================================================
# Automated Cloudflare Workers setup and configuration
# Version: 1.0.0
# Date: 2025-01-18
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../..\" && pwd)"
readonly DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
readonly APPS_DIR="${PROJECT_ROOT}/apps"
readonly REGISTRY_FILE="${DEPLOYMENT_DIR}/apps-registry.json"
readonly TEMPLATES_FILE="${SCRIPT_DIR}/wrangler-templates.json"
readonly LOG_DIR="${DEPLOYMENT_DIR}/logs"
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
    echo "  GANGER PLATFORM - CLOUDFLARE WORKERS CONFIGURATION"
    echo "  Automated Workers Setup and Deployment Configuration"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("jq" "wrangler" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check required files
    if [[ ! -f "$REGISTRY_FILE" ]]; then
        log_error "Application registry not found: $REGISTRY_FILE"
        exit 1
    fi
    
    if [[ ! -f "$TEMPLATES_FILE" ]]; then
        log_error "Wrangler templates not found: $TEMPLATES_FILE"
        exit 1
    fi
    
    # Check Cloudflare authentication
    if ! wrangler whoami &> /dev/null; then
        log_error "Wrangler not authenticated. Run 'wrangler login' first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_cloudflare_resources() {
    log_info "Creating Cloudflare resources..."
    
    # Create KV namespaces
    create_kv_namespace "ganger-platform-cache-prod" "production"
    create_kv_namespace "ganger-platform-cache-staging" "staging"
    create_kv_namespace "ganger-platform-analytics-prod" "production"
    create_kv_namespace "ganger-platform-analytics-staging" "staging"
    
    # Create R2 buckets
    create_r2_bucket "ganger-platform-production"
    create_r2_bucket "ganger-platform-staging"
    create_r2_bucket "ganger-platform-logs-production"
    create_r2_bucket "ganger-platform-logs-staging"
    
    log_success "Cloudflare resources created"
}

create_kv_namespace() {
    local namespace_name="$1"
    local environment="$2"
    
    log_info "Creating KV namespace: $namespace_name"
    
    if wrangler kv:namespace create "$namespace_name" 2>/dev/null; then
        log_success "KV namespace created: $namespace_name"
    else
        log_warning "KV namespace may already exist: $namespace_name"
    fi
}

create_r2_bucket() {
    local bucket_name="$1"
    
    log_info "Creating R2 bucket: $bucket_name"
    
    if wrangler r2 bucket create "$bucket_name" 2>/dev/null; then
        log_success "R2 bucket created: $bucket_name"
    else
        log_warning "R2 bucket may already exist: $bucket_name"
    fi
}

generate_wrangler_config() {
    local app_id="$1"
    local environment="${2:-production}"
    
    log_info "Generating wrangler config for: $app_id"
    
    # Get application metadata
    local app_path
    app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "$REGISTRY_FILE")"
    local app_name
    app_name="$(jq -r ".applications[] | select(.id == \"$app_id\") | .name" "$REGISTRY_FILE")"
    local subdomain
    subdomain="$(jq -r ".applications[] | select(.id == \"$app_id\") | .subdomain" "$REGISTRY_FILE" 2>/dev/null || echo "$app_id")"
    local priority
    priority="$(jq -r ".applications[] | select(.id == \"$app_id\") | .priority" "$REGISTRY_FILE")"
    
    # Determine template based on application
    local template_type="standard_workers"
    if [[ "$app_id" == "staff" ]]; then
        template_type="main_app"
    elif [[ "$priority" == "critical" ]]; then
        template_type="critical_app"
    fi
    
    # Get template
    local template
    template="$(jq -r ".templates.$template_type.template" "$TEMPLATES_FILE")"
    
    # Replace variables
    local config="$template"
    config="$(echo "$config" | sed "s/{{APP_NAME}}/ganger-$app_id/g")"
    config="$(echo "$config" | sed "s/{{SUBDOMAIN}}/$subdomain/g")"
    config="$(echo "$config" | sed "s/{{ENVIRONMENT}}/$environment/g")"
    
    # Replace Cloudflare variables
    local cloudflare_account_id
    cloudflare_account_id="$(jq -r '.variables.CLOUDFLARE_ACCOUNT_ID' "$TEMPLATES_FILE")"
    local cloudflare_zone_id
    cloudflare_zone_id="$(jq -r '.variables.CLOUDFLARE_ZONE_ID' "$TEMPLATES_FILE")"
    local production_domain
    production_domain="$(jq -r '.variables.PRODUCTION_DOMAIN' "$TEMPLATES_FILE")"
    local staging_domain
    staging_domain="$(jq -r '.variables.STAGING_DOMAIN' "$TEMPLATES_FILE")"
    
    config="$(echo "$config" | sed "s/{{CLOUDFLARE_ACCOUNT_ID}}/$cloudflare_account_id/g")"
    config="$(echo "$config" | sed "s/{{CLOUDFLARE_ZONE_ID}}/$cloudflare_zone_id/g")"
    config="$(echo "$config" | sed "s/{{PRODUCTION_DOMAIN}}/$production_domain/g")"
    config="$(echo "$config" | sed "s/{{STAGING_DOMAIN}}/$staging_domain/g")"
    
    # Replace KV namespace IDs (placeholder for now)
    config="$(echo "$config" | sed "s/{{KV_NAMESPACE_ID}}/placeholder_kv_prod/g")"
    config="$(echo "$config" | sed "s/{{KV_NAMESPACE_PREVIEW_ID}}/placeholder_kv_staging/g")"
    config="$(echo "$config" | sed "s/{{ANALYTICS_KV_ID}}/placeholder_analytics_prod/g")"
    config="$(echo "$config" | sed "s/{{ANALYTICS_KV_PREVIEW_ID}}/placeholder_analytics_staging/g")"
    
    # Write to application directory
    local app_full_path="${PROJECT_ROOT}/${app_path}"
    echo "$config" > "${app_full_path}/wrangler.jsonc"
    
    log_success "Wrangler config generated for: $app_id"
}

configure_all_applications() {
    log_info "Configuring all applications..."
    
    # Get all applications
    local apps=()
    mapfile -t apps < <(jq -r '.applications[].id' "$REGISTRY_FILE")
    
    for app_id in "${apps[@]}"; do
        generate_wrangler_config "$app_id" "production"
        
        # Validate configuration
        local app_path
        app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "$REGISTRY_FILE")"
        local wrangler_file="${PROJECT_ROOT}/${app_path}/wrangler.jsonc"
        
        if [[ -f "$wrangler_file" ]] && jq . "$wrangler_file" > /dev/null 2>&1; then
            log_success "✓ $app_id configuration valid"
        else
            log_error "✗ $app_id configuration invalid"
        fi
    done
    
    log_success "All applications configured"
}

setup_domain_routing() {
    log_info "Setting up domain routing..."
    
    # Create routing configuration
    local routing_config="${DEPLOYMENT_DIR}/cloudflare/routing-config.json"
    mkdir -p "$(dirname "$routing_config")"
    
    {
        echo "{"
        echo "  \"version\": \"1.0.0\","
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"routes\": ["
        
        local first=true
        local apps=()
        mapfile -t apps < <(jq -r '.applications[].id' "$REGISTRY_FILE")
        
        for app_id in "${apps[@]}"; do
            if [[ "$first" == "false" ]]; then
                echo ","
            fi
            first=false
            
            local subdomain
            subdomain="$(jq -r ".applications[] | select(.id == \"$app_id\") | .subdomain" "$REGISTRY_FILE" 2>/dev/null || echo "$app_id")"
            
            if [[ "$app_id" == "staff" ]]; then
                echo "    {"
                echo "      \"app_id\": \"$app_id\","
                echo "      \"pattern\": \"staff.gangerdermatology.com/*\","
                echo "      \"worker\": \"ganger-$app_id-production\","
                echo "      \"priority\": 1"
                echo -n "    }"
            else
                echo "    {"
                echo "      \"app_id\": \"$app_id\","
                echo "      \"pattern\": \"staff.gangerdermatology.com/$subdomain/*\","
                echo "      \"worker\": \"ganger-$app_id-production\","
                echo "      \"priority\": 10"
                echo -n "    }"
            fi
        done
        
        echo ""
        echo "  ]"
        echo "}"
    } > "$routing_config"
    
    log_success "Domain routing configuration created"
}

create_deployment_script() {
    log_info "Creating Cloudflare-specific deployment script..."
    
    local deploy_script="${SCRIPT_DIR}/deploy-to-workers.sh"
    
    cat > "$deploy_script" << 'EOF'
#!/bin/bash

# =============================================================================
# CLOUDFLARE WORKERS DEPLOYMENT SCRIPT
# =============================================================================
# Deploy applications to Cloudflare Workers
# Usage: ./deploy-to-workers.sh [APP_ID] [ENVIRONMENT]
# =============================================================================

set -euo pipefail

readonly APP_ID="${1:-}"
readonly ENVIRONMENT="${2:-production}"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

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

deploy_app() {
    local app_id="$1"
    local environment="$2"
    
    log_info "Deploying $app_id to $environment..."
    
    # Get app path
    local registry_file="${PROJECT_ROOT}/deployment/apps-registry.json"
    local app_path
    app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "$registry_file")"
    local full_path="${PROJECT_ROOT}/${app_path}"
    
    if [[ ! -d "$full_path" ]]; then
        log_error "Application directory not found: $full_path"
        return 1
    fi
    
    if [[ ! -f "${full_path}/wrangler.jsonc" ]]; then
        log_error "Wrangler configuration not found: ${full_path}/wrangler.jsonc"
        return 1
    fi
    
    # Deploy to Cloudflare Workers
    (
        cd "$full_path"
        
        if [[ "$environment" == "production" ]]; then
            wrangler deploy --env production
        else
            wrangler deploy --env staging
        fi
    )
    
    log_success "✓ $app_id deployed to $environment"
}

main() {
    if [[ -z "$APP_ID" ]]; then
        log_error "Usage: $0 [APP_ID] [ENVIRONMENT]"
        exit 1
    fi
    
    deploy_app "$APP_ID" "$ENVIRONMENT"
}

main "$@"
EOF
    
    chmod +x "$deploy_script"
    log_success "Cloudflare deployment script created"
}

create_monitoring_setup() {
    log_info "Creating monitoring and analytics setup..."
    
    local monitoring_script="${SCRIPT_DIR}/setup-monitoring.sh"
    
    cat > "$monitoring_script" << 'EOF'
#!/bin/bash

# =============================================================================
# CLOUDFLARE MONITORING SETUP
# =============================================================================
# Setup monitoring, analytics, and alerting for Cloudflare Workers
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

setup_analytics() {
    log_info "Setting up Cloudflare Analytics..."
    
    # Create analytics dataset
    if wrangler analytics-engine dataset create ganger_platform_metrics 2>/dev/null; then
        log_success "Analytics dataset created"
    else
        log_warning "Analytics dataset may already exist"
    fi
}

setup_alerting() {
    log_info "Setting up Cloudflare alerting..."
    
    # Note: Alerting rules are typically configured via Cloudflare Dashboard
    # This is a placeholder for future API-based configuration
    
    log_info "Alerting configuration should be set up via Cloudflare Dashboard:"
    echo "  - Worker error rate alerts"
    echo "  - Worker CPU time alerts"
    echo "  - Request rate alerts"
    echo "  - Health check failure alerts"
}

setup_logs() {
    log_info "Setting up log forwarding..."
    
    # Configure log forwarding to R2 bucket
    # This would typically be done via Cloudflare Dashboard or API
    
    log_info "Log forwarding configuration should be set up via:"
    echo "  - Cloudflare Dashboard > Analytics & Logs > Logs"
    echo "  - Forward to R2 bucket: ganger-platform-logs-production"
    echo "  - Configure log retention and sampling"
}

main() {
    log_info "Setting up Cloudflare monitoring and analytics..."
    
    setup_analytics
    setup_alerting
    setup_logs
    
    log_success "Monitoring setup completed"
    log_info "Complete the configuration in Cloudflare Dashboard for full functionality"
}

main "$@"
EOF
    
    chmod +x "$monitoring_script"
    log_success "Monitoring setup script created"
}

usage() {
    cat << EOF
USAGE: $(basename "$0") [OPTIONS] COMMAND

DESCRIPTION:
    Configure Cloudflare Workers for Ganger Platform applications.

COMMANDS:
    resources        Create Cloudflare resources (KV, R2, Analytics)
    configure        Generate wrangler configurations for all apps
    routing          Setup domain routing configuration
    deploy           Create deployment scripts
    monitoring       Setup monitoring and analytics
    all              Run all configuration steps

OPTIONS:
    -h, --help      Show this help message

EXAMPLES:
    $(basename "$0") resources
    $(basename "$0") configure
    $(basename "$0") all

EOF
}

main() {
    mkdir -p "$LOG_DIR"
    
    if [[ $# -eq 0 ]]; then
        usage
        exit 1
    fi
    
    print_banner
    check_prerequisites
    
    local command="$1"
    
    case "$command" in
        resources)
            create_cloudflare_resources
            ;;
        configure)
            configure_all_applications
            ;;
        routing)
            setup_domain_routing
            ;;
        deploy)
            create_deployment_script
            ;;
        monitoring)
            create_monitoring_setup
            ;;
        all)
            create_cloudflare_resources
            configure_all_applications
            setup_domain_routing
            create_deployment_script
            create_monitoring_setup
            log_success "All Cloudflare Workers configuration completed!"
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
    
    log_success "Cloudflare Workers configuration completed for: $command"
}

main "$@"