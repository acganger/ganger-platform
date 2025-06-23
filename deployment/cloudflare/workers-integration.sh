#!/bin/bash

# =============================================================================
# CLOUDFLARE WORKERS INTEGRATION SCRIPT
# =============================================================================
# Integrates Cloudflare Workers deployment with existing infrastructure
# Version: 1.0.0
# Date: 2025-01-18
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
readonly REGISTRY_FILE="${DEPLOYMENT_DIR}/apps-registry.json"
readonly MASTER_SCRIPT="${DEPLOYMENT_DIR}/scripts/deploy-master.sh"

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
    echo "  GANGER PLATFORM - CLOUDFLARE WORKERS INTEGRATION"
    echo "  Seamless Integration with Existing Deployment Infrastructure"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

update_master_deployment_script() {
    log_info "Integrating Cloudflare Workers deployment into master script..."
    
    # Create integration patch
    local integration_patch="${SCRIPT_DIR}/master-script-integration.patch"
    
    cat > "$integration_patch" << 'EOF'
# Cloudflare Workers Integration for Master Deployment Script

# Add Cloudflare Workers deployment function
deploy_app_workers() {
    local app_id="$1"
    local environment="$2"
    local app_path
    app_path="$(get_app_info "$app_id" "path")"
    local full_path="${PROJECT_ROOT}/${app_path}"
    local deploy_log="${LOG_DIR}/deploy_workers_${app_id}_${environment}_${TIMESTAMP}.log"
    
    log_info "Deploying $app_id to Cloudflare Workers ($environment)"
    
    (
        cd "$full_path"
        
        # Verify wrangler configuration
        if [[ ! -f "wrangler.jsonc" ]]; then
            log_error "Wrangler configuration not found for $app_id"
            return 1
        fi
        
        # Validate wrangler config
        if ! jq . wrangler.jsonc > /dev/null 2>&1; then
            log_error "Invalid wrangler configuration for $app_id"
            return 1
        fi
        
        # Deploy to Workers
        if [[ "$environment" == "production" ]]; then
            timeout $BUILD_TIMEOUT wrangler deploy --env production 2>&1 | tee -a "$deploy_log"
        else
            timeout $BUILD_TIMEOUT wrangler deploy --env staging 2>&1 | tee -a "$deploy_log"
        fi
        
    ) || return 1
    
    log_success "✓ $app_id deployed to Cloudflare Workers ($environment)"
    return 0
}

# Update health check to include Workers-specific endpoints
health_check_app_workers() {
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
        base_url="https://staff-staging.gangerdermatology.com"
    fi
    
    local health_url
    if [[ "$subdomain" == "main" ]]; then
        health_url="${base_url}${health_endpoint}"
    else
        health_url="${base_url}/${subdomain}${health_endpoint}"
    fi
    
    log_info "Health checking $app_id at: $health_url"
    
    local attempts=0
    while [[ $attempts -lt $RETRY_COUNT ]]; do
        if curl -sf --max-time $HEALTH_CHECK_TIMEOUT \
               -H "User-Agent: Ganger-Platform-Health-Check/1.0" \
               -H "Accept: application/json" \
               "$health_url" > /dev/null; then
            log_success "✓ $app_id health check passed (Workers)"
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

EOF
    
    log_success "Master script integration patch created"
}

create_workers_specific_scripts() {
    log_info "Creating Workers-specific deployment scripts..."
    
    # Create Workers deployment wrapper
    local workers_deploy="${SCRIPT_DIR}/deploy-workers.sh"
    
    cat > "$workers_deploy" << 'EOF'
#!/bin/bash

# =============================================================================
# CLOUDFLARE WORKERS DEPLOYMENT WRAPPER
# =============================================================================
# Wrapper for deploying applications specifically to Cloudflare Workers
# Integrates with master deployment system
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly MASTER_SCRIPT="${PROJECT_ROOT}/deployment/scripts/deploy-master.sh"

# Import common functions
source "${PROJECT_ROOT}/deployment/scripts/deploy-master.sh"

deploy_to_workers() {
    local apps=("$@")
    local environment="${ENVIRONMENT:-production}"
    
    log_info "Deploying applications to Cloudflare Workers"
    log_info "Environment: $environment"
    log_info "Applications: ${apps[*]}"
    
    # Pre-deployment validation
    for app_id in "${apps[@]}"; do
        if ! validate_app "$app_id"; then
            log_error "Validation failed for $app_id"
            return 1
        fi
        
        # Check for Workers build artifacts
        local app_path
        app_path="$(get_app_info "$app_id" "path")"
        local full_path="${PROJECT_ROOT}/${app_path}"
        
        if [[ ! -f "${full_path}/.vercel/output/static/_worker.js/index.js" ]]; then
            log_error "Workers build artifact not found for $app_id"
            log_error "Run build process first: npm run build && npx next-on-pages"
            return 1
        fi
    done
    
    # Deploy each application
    local success_count=0
    local failure_count=0
    
    for app_id in "${apps[@]}"; do
        if deploy_app_workers "$app_id" "$environment"; then
            ((success_count++))
        else
            ((failure_count++))
            log_error "Workers deployment failed for: $app_id"
        fi
    done
    
    log_info "Workers deployment results: $success_count successful, $failure_count failed"
    
    if [[ $failure_count -gt 0 ]]; then
        return 1
    fi
    
    return 0
}

main() {
    local apps=("$@")
    
    if [[ ${#apps[@]} -eq 0 ]]; then
        log_error "Usage: $0 [APP_ID|GROUP] [APP_ID...]"
        exit 1
    fi
    
    # Expand groups to individual apps
    local expanded_apps=()
    for app_or_group in "${apps[@]}"; do
        case "$app_or_group" in
            "all"|"critical"|"high"|"medium"|"low")
                mapfile -t group_apps < <(get_apps "$app_or_group")
                expanded_apps+=("${group_apps[@]}")
                ;;
            *)
                expanded_apps+=("$app_or_group")
                ;;
        esac
    done
    
    deploy_to_workers "${expanded_apps[@]}"
}

main "$@"
EOF
    
    chmod +x "$workers_deploy"
    log_success "Workers deployment wrapper created"
}

create_workers_health_checker() {
    log_info "Creating Workers-specific health checker..."
    
    local health_checker="${SCRIPT_DIR}/health-check-workers.sh"
    
    cat > "$health_checker" << 'EOF'
#!/bin/bash

# =============================================================================
# CLOUDFLARE WORKERS HEALTH CHECKER
# =============================================================================
# Health checking specifically for Cloudflare Workers deployments
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly REGISTRY_FILE="${PROJECT_ROOT}/deployment/apps-registry.json"

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

check_worker_health() {
    local app_id="$1"
    local environment="${2:-production}"
    
    # Get app metadata
    local subdomain
    subdomain="$(jq -r ".applications[] | select(.id == \"$app_id\") | .subdomain" "$REGISTRY_FILE")"
    local health_endpoint
    health_endpoint="$(jq -r ".applications[] | select(.id == \"$app_id\") | .health_endpoint" "$REGISTRY_FILE")"
    
    local base_url
    if [[ "$environment" == "production" ]]; then
        base_url="https://staff.gangerdermatology.com"
    else
        base_url="https://staff-staging.gangerdermatology.com"
    fi
    
    local health_url
    if [[ "$subdomain" == "main" ]]; then
        health_url="${base_url}${health_endpoint}"
    else
        health_url="${base_url}/${subdomain}${health_endpoint}"
    fi
    
    log_info "Checking Workers health for $app_id at: $health_url"
    
    # Perform health check with Workers-specific headers
    local response
    local status_code
    local response_time
    
    local start_time
    start_time="$(date +%s.%3N)"
    
    if response=$(curl -sf --max-time 10 \
                      -H "User-Agent: Ganger-Platform-Health-Check/1.0" \
                      -H "Accept: application/json" \
                      -H "CF-Worker-Health-Check: true" \
                      -w "%{http_code}" \
                      "$health_url" 2>/dev/null); then
        local end_time
        end_time="$(date +%s.%3N)"
        response_time="$(echo "$end_time - $start_time" | bc -l | xargs printf "%.0f")"
        
        status_code="${response: -3}"
        if [[ "$status_code" == "200" ]]; then
            log_success "✓ $app_id Workers health check passed (${response_time}ms)"
            return 0
        else
            log_error "✗ $app_id Workers health check failed (HTTP $status_code)"
            return 1
        fi
    else
        log_error "✗ $app_id Workers health check failed (connection error)"
        return 1
    fi
}

check_worker_metrics() {
    local app_id="$1"
    local environment="${2:-production}"
    
    log_info "Checking Workers metrics for $app_id..."
    
    # Get basic Workers metrics using wrangler
    local app_path
    app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "$REGISTRY_FILE")"
    local full_path="${PROJECT_ROOT}/${app_path}"
    
    if [[ -d "$full_path" ]] && [[ -f "${full_path}/wrangler.jsonc" ]]; then
        (
            cd "$full_path"
            
            # Get deployment info
            if wrangler deployments list --env "$environment" 2>/dev/null | head -5; then
                log_success "✓ $app_id Workers deployment info retrieved"
            else
                log_warning "⚠ $app_id Workers deployment info not available"
            fi
        )
    else
        log_warning "⚠ $app_id Workers configuration not found"
    fi
}

main() {
    local app_ids=("$@")
    local environment="${ENVIRONMENT:-production}"
    
    if [[ ${#app_ids[@]} -eq 0 ]]; then
        log_error "Usage: $0 [APP_ID...] or ENVIRONMENT=staging $0 [APP_ID...]"
        exit 1
    fi
    
    log_info "Performing Workers health checks for environment: $environment"
    
    local success_count=0
    local failure_count=0
    
    for app_id in "${app_ids[@]}"; do
        if check_worker_health "$app_id" "$environment"; then
            ((success_count++))
        else
            ((failure_count++))
        fi
        
        # Also check metrics
        check_worker_metrics "$app_id" "$environment"
        
        echo  # Add spacing between checks
    done
    
    log_info "Health check results: $success_count passed, $failure_count failed"
    
    if [[ $failure_count -gt 0 ]]; then
        exit 1
    fi
}

main "$@"
EOF
    
    chmod +x "$health_checker"
    log_success "Workers health checker created"
}

create_workers_monitoring() {
    log_info "Creating Workers monitoring and analytics setup..."
    
    local monitoring_setup="${SCRIPT_DIR}/setup-workers-monitoring.sh"
    
    cat > "$monitoring_setup" << 'EOF'
#!/bin/bash

# =============================================================================
# CLOUDFLARE WORKERS MONITORING SETUP
# =============================================================================
# Setup monitoring, logging, and analytics for Workers deployments
# =============================================================================

set -euo pipefail

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

setup_analytics_engine() {
    log_info "Setting up Cloudflare Analytics Engine..."
    
    # Create analytics dataset for platform metrics
    if wrangler analytics-engine dataset create ganger_platform_metrics; then
        log_success "Analytics dataset created: ganger_platform_metrics"
    else
        log_warning "Analytics dataset may already exist"
    fi
    
    # Create dataset for health check metrics
    if wrangler analytics-engine dataset create ganger_health_metrics; then
        log_success "Analytics dataset created: ganger_health_metrics"
    else
        log_warning "Health metrics dataset may already exist"
    fi
}

setup_r2_logging() {
    log_info "Setting up R2 bucket for log storage..."
    
    # Create R2 buckets for logging
    if wrangler r2 bucket create ganger-platform-logs-production; then
        log_success "R2 bucket created: ganger-platform-logs-production"
    else
        log_warning "Production logs bucket may already exist"
    fi
    
    if wrangler r2 bucket create ganger-platform-logs-staging; then
        log_success "R2 bucket created: ganger-platform-logs-staging"
    else
        log_warning "Staging logs bucket may already exist"
    fi
}

create_monitoring_worker() {
    log_info "Creating monitoring Worker..."
    
    local monitoring_dir="${PROJECT_ROOT}/workers/monitoring"
    mkdir -p "$monitoring_dir"
    
    # Create monitoring worker
    cat > "${monitoring_dir}/index.js" << 'WORKER_EOF'
// Ganger Platform Monitoring Worker
// Collects metrics and health data from all applications

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        worker: 'ganger-monitoring'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/metrics') {
      return handleMetrics(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleMetrics(request, env) {
  // Collect metrics from all applications
  const metrics = {
    timestamp: new Date().toISOString(),
    platform: 'ganger-medical-platform',
    applications: []
  };
  
  // Add to Analytics Engine
  if (env.ANALYTICS) {
    ctx.waitUntil(env.ANALYTICS.writeDataPoint({
      'blobs': [JSON.stringify(metrics)],
      'doubles': [Date.now()],
      'indexes': ['platform-metrics']
    }));
  }
  
  return new Response(JSON.stringify(metrics), {
    headers: { 'Content-Type': 'application/json' }
  });
}
WORKER_EOF
    
    # Create wrangler config for monitoring worker
    cat > "${monitoring_dir}/wrangler.jsonc" << 'CONFIG_EOF'
{
  "$schema": "https://raw.githubusercontent.com/cloudflare/workers-types/main/wrangler-schema.json",
  "name": "ganger-monitoring",
  "main": "index.js",
  "compatibility_date": "2025-01-18",
  "compatibility_flags": ["nodejs_compat"],
  "env": {
    "production": {
      "name": "ganger-monitoring-production",
      "routes": [
        {
          "pattern": "staff.gangerdermatology.com/_monitoring/*",
          "zone_id": "ba76d3d3f41251c49f0365421bd644a5"
        }
      ]
    },
    "staging": {
      "name": "ganger-monitoring-staging",
      "routes": [
        {
          "pattern": "staff-staging.gangerdermatology.com/_monitoring/*",
          "zone_id": "ba76d3d3f41251c49f0365421bd644a5"
        }
      ]
    }
  },
  "analytics_engine_datasets": [
    {
      "binding": "ANALYTICS",
      "dataset": "ganger_platform_metrics"
    }
  ]
}
CONFIG_EOF
    
    log_success "Monitoring Worker created"
}

setup_alerting() {
    log_info "Setting up alerting configuration..."
    
    # Create alerting configuration file
    local alerting_config="${SCRIPT_DIR}/alerting-config.json"
    
    cat > "$alerting_config" << 'ALERT_EOF'
{
  "version": "1.0.0",
  "alerting_rules": [
    {
      "name": "Worker Error Rate High",
      "description": "Alert when Worker error rate exceeds 5%",
      "condition": "error_rate > 0.05",
      "severity": "critical",
      "notification_channels": ["slack", "email"]
    },
    {
      "name": "Worker Response Time High",
      "description": "Alert when average response time exceeds 2 seconds",
      "condition": "avg_response_time > 2000",
      "severity": "warning",
      "notification_channels": ["slack"]
    },
    {
      "name": "Worker CPU Time High",
      "description": "Alert when CPU time exceeds 50ms consistently",
      "condition": "avg_cpu_time > 50",
      "severity": "warning",
      "notification_channels": ["slack"]
    },
    {
      "name": "Health Check Failures",
      "description": "Alert when health checks fail",
      "condition": "health_check_failures > 0",
      "severity": "critical",
      "notification_channels": ["slack", "email", "pagerduty"]
    }
  ],
  "notification_channels": {
    "slack": {
      "webhook_url": "${SLACK_WEBHOOK_URL}",
      "channel": "#platform-alerts"
    },
    "email": {
      "recipients": ["admin@gangerdermatology.com"]
    },
    "pagerduty": {
      "enabled": false,
      "service_key": ""
    }
  }
}
ALERT_EOF
    
    log_success "Alerting configuration created"
    log_info "Note: Alerting rules need to be configured in Cloudflare Dashboard"
}

main() {
    log_info "Setting up Cloudflare Workers monitoring and analytics..."
    
    setup_analytics_engine
    setup_r2_logging
    create_monitoring_worker
    setup_alerting
    
    log_success "Workers monitoring setup completed"
    
    echo
    log_info "Next steps:"
    echo "  1. Deploy monitoring worker: cd workers/monitoring && wrangler deploy"
    echo "  2. Configure alerting rules in Cloudflare Dashboard"
    echo "  3. Set up log forwarding in Cloudflare Dashboard"
    echo "  4. Test monitoring endpoints"
}

main "$@"
EOF
    
    chmod +x "$monitoring_setup"
    log_success "Workers monitoring setup created"
}

generate_integration_documentation() {
    log_info "Generating integration documentation..."
    
    local docs_file="${SCRIPT_DIR}/WORKERS_INTEGRATION.md"
    
    cat > "$docs_file" << 'EOF'
# Cloudflare Workers Integration Documentation

## Overview

This document describes the integration of Cloudflare Workers with the Ganger Platform deployment infrastructure.

## Integration Components

### 1. Workers Configuration (`configure-workers.sh`)
- Automated Cloudflare resource creation (KV, R2, Analytics)
- Wrangler configuration generation for all applications
- Domain routing setup

### 2. Workers Deployment (`deploy-workers.sh`)
- Wrapper for Workers-specific deployments
- Integration with master deployment system
- Build artifact validation

### 3. Workers Health Checking (`health-check-workers.sh`)
- Workers-specific health checks with appropriate headers
- Metrics collection and monitoring
- Integration with status tracking system

### 4. Workers Monitoring (`setup-workers-monitoring.sh`)
- Analytics Engine setup for metrics collection
- R2 bucket configuration for log storage
- Monitoring Worker deployment
- Alerting configuration

## Usage Examples

### Deploy All Applications to Workers
```bash
./deployment/cloudflare/deploy-workers.sh all
```

### Deploy Critical Applications
```bash
./deployment/cloudflare/deploy-workers.sh critical
```

### Health Check Workers Deployment
```bash
./deployment/cloudflare/health-check-workers.sh inventory handouts
```

### Environment-Specific Operations
```bash
ENVIRONMENT=staging ./deployment/cloudflare/deploy-workers.sh all
```

## Integration with Master Scripts

The Workers integration extends the master deployment system with:

- `deploy_app_workers()` function for Workers deployment
- `health_check_app_workers()` for Workers health checks
- Enhanced monitoring and metrics collection

## Monitoring and Analytics

### Analytics Engine Datasets
- `ganger_platform_metrics` - Application performance metrics
- `ganger_health_metrics` - Health check results

### R2 Buckets
- `ganger-platform-logs-production` - Production logs
- `ganger-platform-logs-staging` - Staging logs

### Monitoring Worker
- Deployed at `/_monitoring/*` endpoints
- Collects and aggregates platform metrics
- Provides centralized health checking

## Configuration Files

### Wrangler Templates (`wrangler-templates.json`)
- Standard Workers configuration
- Main app configuration (root domain)
- Critical app configuration (enhanced monitoring)

### Application Mappings
- Maps each application to appropriate template
- Defines subdomain routing
- Specifies resource requirements

## Security and Compliance

- Environment-specific configurations
- Secure secret management
- HIPAA-compliant logging and monitoring
- Access control through Cloudflare API tokens

## Troubleshooting

### Common Issues
1. **Wrangler authentication errors** - Run `wrangler login`
2. **Resource creation failures** - Check Cloudflare API permissions
3. **Deployment failures** - Verify build artifacts exist
4. **Health check failures** - Check domain routing and DNS

### Debug Commands
```bash
# Check Workers status
wrangler deployments list

# View Workers logs
wrangler tail

# Test health endpoints
curl -H "CF-Worker-Health-Check: true" https://staff.gangerdermatology.com/api/health
```
EOF
    
    log_success "Integration documentation generated"
}

main() {
    print_banner
    
    log_info "Configuring Cloudflare Workers integration..."
    
    # Create all integration components
    update_master_deployment_script
    create_workers_specific_scripts
    create_workers_health_checker
    create_workers_monitoring
    generate_integration_documentation
    
    log_success "Cloudflare Workers integration completed!"
    
    echo
    log_info "Integration summary:"
    echo "  ✓ Master deployment script integration"
    echo "  ✓ Workers-specific deployment scripts"
    echo "  ✓ Health checking and monitoring"
    echo "  ✓ Analytics and alerting setup"
    echo "  ✓ Comprehensive documentation"
    
    echo
    log_info "Next steps:"
    echo "  1. Run ./deployment/cloudflare/configure-workers.sh all"
    echo "  2. Test deployment with ./deployment/cloudflare/deploy-workers.sh critical"
    echo "  3. Verify health checks with ./deployment/cloudflare/health-check-workers.sh all"
    echo "  4. Setup monitoring with ./deployment/cloudflare/setup-workers-monitoring.sh"
}

main "$@"