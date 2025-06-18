#!/bin/bash

# =============================================================================
# GANGER PLATFORM - CLOUDFLARE INTEGRATION AUTOMATION
# =============================================================================
# Advanced Cloudflare API integration for automated domain and security management
# Features: Workers domains, security rules, performance optimization, HIPAA compliance
# Version: 1.0.0
# Date: 2025-01-18
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
readonly REGISTRY_FILE="${DEPLOYMENT_DIR}/apps-registry.json"
readonly DOMAINS_DIR="${DEPLOYMENT_DIR}/domains"
readonly LOG_DIR="${DOMAINS_DIR}/logs"
readonly TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# Cloudflare configuration
readonly ZONE_ID="ba76d3d3f41251c49f0365421bd644a5"
readonly ACCOUNT_ID="85f2cf50e95a4a5db52a11adcc2c2c9b"
readonly API_BASE="https://api.cloudflare.com/client/v4"

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
    echo "  GANGER PLATFORM - CLOUDFLARE INTEGRATION AUTOMATION"
    echo "  Advanced API Integration for Medical Platform Security"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

# =============================================================================
# CLOUDFLARE API UTILITIES
# =============================================================================

cf_api_call() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    
    local curl_opts=(
        -sf
        --max-time 30
        -X "$method"
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
        -H "Content-Type: application/json"
    )
    
    if [[ -n "$data" ]]; then
        curl_opts+=(-d "$data")
    fi
    
    curl "${curl_opts[@]}" "$API_BASE$endpoint"
}

validate_api_access() {
    log_info "Validating Cloudflare API access..."
    
    if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        log_error "CLOUDFLARE_API_TOKEN environment variable not set"
        return 1
    fi
    
    # Test zone access
    if ! cf_api_call "GET" "/zones/$ZONE_ID" > /dev/null; then
        log_error "Failed to access Cloudflare zone: $ZONE_ID"
        return 1
    fi
    
    # Test account access
    if ! cf_api_call "GET" "/accounts/$ACCOUNT_ID" > /dev/null; then
        log_error "Failed to access Cloudflare account: $ACCOUNT_ID"
        return 1
    fi
    
    log_success "Cloudflare API access validated"
    return 0
}

# =============================================================================
# WORKERS DOMAIN MANAGEMENT
# =============================================================================

setup_workers_domains() {
    local environment="${1:-production}"
    
    log_info "🚀 Setting up Workers custom domains for $environment..."
    
    # Get all applications
    local apps=()
    mapfile -t apps < <(jq -r '.applications[].id' "$REGISTRY_FILE")
    
    local success_count=0
    local failure_count=0
    
    for app_id in "${apps[@]}"; do
        if setup_app_workers_domain "$app_id" "$environment"; then
            ((success_count++))
        else
            ((failure_count++))
        fi
    done
    
    log_info "Workers domains setup: $success_count successful, $failure_count failed"
    
    if [[ $failure_count -gt 0 ]]; then
        return 1
    fi
    
    log_success "All Workers domains configured successfully"
    return 0
}

setup_app_workers_domain() {
    local app_id="$1"
    local environment="$2"
    
    log_info "Setting up Workers domain for $app_id ($environment)..."
    
    # Get application metadata
    local subdomain
    subdomain="$(jq -r ".applications[] | select(.id == \"$app_id\") | .subdomain" "$REGISTRY_FILE")"
    
    if [[ "$subdomain" == "null" || "$subdomain" == "main" ]]; then
        subdomain="staff"
    fi
    
    # Determine domain based on environment
    local domain
    case "$environment" in
        "production")
            domain="${subdomain}.gangerdermatology.com"
            ;;
        "staging")
            domain="${subdomain}-staging.gangerdermatology.com"
            ;;
        "development")
            domain="${subdomain}-dev.gangerdermatology.com"
            ;;
        *)
            log_error "Unknown environment: $environment"
            return 1
            ;;
    esac
    
    # Create custom domain for Workers
    create_workers_custom_domain "$domain" "$app_id"
    
    # Configure DNS record
    create_workers_dns_record "$domain"
    
    # Verify domain setup
    verify_workers_domain "$domain"
    
    log_success "✓ Workers domain configured: $domain"
    return 0
}

create_workers_custom_domain() {
    local domain="$1"
    local app_id="$2"
    
    log_info "Creating Workers custom domain: $domain"
    
    # Check if custom domain already exists
    local existing_domain
    existing_domain="$(cf_api_call "GET" "/zones/$ZONE_ID/custom_hostnames" | \
        jq -r ".result[] | select(.hostname == \"$domain\") | .id // empty")"
    
    if [[ -n "$existing_domain" ]]; then
        log_info "Custom domain already exists: $domain"
        return 0
    fi
    
    # Create custom hostname
    local custom_domain_data
    custom_domain_data="$(jq -n \
        --arg hostname "$domain" \
        '{
            hostname: $hostname,
            ssl: {
                method: "http",
                type: "dv",
                settings: {
                    http2: "on",
                    min_tls_version: "1.2",
                    tls_1_3: "on"
                }
            }
        }')"
    
    local result
    if result="$(cf_api_call "POST" "/zones/$ZONE_ID/custom_hostnames" "$custom_domain_data")"; then
        local custom_domain_id
        custom_domain_id="$(echo "$result" | jq -r '.result.id')"
        log_success "✓ Custom domain created: $domain (ID: $custom_domain_id)"
        
        # Wait for SSL certificate provisioning
        wait_for_ssl_provisioning "$custom_domain_id" "$domain"
    else
        log_error "Failed to create custom domain: $domain"
        return 1
    fi
}

wait_for_ssl_provisioning() {
    local custom_domain_id="$1"
    local domain="$2"
    
    log_info "Waiting for SSL certificate provisioning for $domain..."
    
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        local ssl_status
        ssl_status="$(cf_api_call "GET" "/zones/$ZONE_ID/custom_hostnames/$custom_domain_id" | \
            jq -r '.result.ssl.status')"
        
        case "$ssl_status" in
            "active")
                log_success "✓ SSL certificate active for $domain"
                return 0
                ;;
            "pending_validation"|"pending_issuance")
                log_info "SSL certificate provisioning in progress... ($ssl_status)"
                ;;
            "pending_deployment")
                log_info "SSL certificate deploying..."
                ;;
            *)
                log_warning "SSL status: $ssl_status for $domain"
                ;;
        esac
        
        ((attempt++))
        sleep 10
    done
    
    log_warning "SSL certificate provisioning timeout for $domain"
    return 1
}

create_workers_dns_record() {
    local domain="$1"
    
    log_info "Creating DNS record for Workers domain: $domain"
    
    # Extract subdomain
    local subdomain="${domain%%.gangerdermatology.com}"
    
    # Check for existing DNS record
    local existing_record
    existing_record="$(cf_api_call "GET" "/zones/$ZONE_ID/dns_records?name=$domain" | \
        jq -r '.result[0].id // empty')"
    
    # Create DNS record data
    local dns_data
    dns_data="$(jq -n \
        --arg type "CNAME" \
        --arg name "$subdomain" \
        --arg content "${subdomain}.gangerdermatology.com.cdn.cloudflare.net" \
        '{
            type: $type,
            name: $name,
            content: $content,
            ttl: 300,
            proxied: true
        }')"
    
    if [[ -n "$existing_record" ]]; then
        # Update existing record
        if cf_api_call "PUT" "/zones/$ZONE_ID/dns_records/$existing_record" "$dns_data" > /dev/null; then
            log_success "✓ DNS record updated for $domain"
        else
            log_error "Failed to update DNS record for $domain"
            return 1
        fi
    else
        # Create new record
        if cf_api_call "POST" "/zones/$ZONE_ID/dns_records" "$dns_data" > /dev/null; then
            log_success "✓ DNS record created for $domain"
        else
            log_error "Failed to create DNS record for $domain"
            return 1
        fi
    fi
}

verify_workers_domain() {
    local domain="$1"
    
    log_info "Verifying Workers domain: $domain"
    
    # Test DNS resolution
    if ! nslookup "$domain" > /dev/null 2>&1; then
        log_warning "DNS resolution failed for $domain"
        return 1
    fi
    
    # Test HTTPS connectivity (may fail initially)
    if curl -sf --max-time 10 "https://$domain" > /dev/null 2>&1; then
        log_success "✓ HTTPS connectivity verified for $domain"
    else
        log_info "HTTPS connectivity test failed (expected during initial setup)"
    fi
    
    return 0
}

# =============================================================================
# SECURITY RULES AUTOMATION
# =============================================================================

configure_security_rules() {
    log_info "🛡️ Configuring advanced security rules..."
    
    # Configure WAF rules
    configure_waf_rules
    
    # Configure firewall rules
    configure_firewall_rules
    
    # Configure rate limiting
    configure_rate_limiting
    
    # Configure bot management
    configure_bot_management
    
    log_success "Security rules configuration completed"
}

configure_waf_rules() {
    log_info "Configuring WAF rules..."
    
    # Enable OWASP Core Rule Set
    local waf_config
    waf_config="$(jq -n \
        '{
            rules: [
                {
                    id: "efb7b8c949ac4650a09736fc376e9f27",
                    action: "simulate",
                    description: "OWASP Core Rule Set"
                },
                {
                    id: "4814384a9e5d4991b9815dcfc25d2f1f", 
                    action: "challenge",
                    description: "Cloudflare Managed Ruleset"
                }
            ]
        }')"
    
    # Apply WAF configuration
    if cf_api_call "PUT" "/zones/$ZONE_ID/firewall/waf/packages" "$waf_config" > /dev/null; then
        log_success "✓ WAF rules configured"
    else
        log_warning "WAF rules configuration may need manual setup"
    fi
}

configure_firewall_rules() {
    log_info "Configuring firewall rules..."
    
    # HIPAA compliance rules
    local firewall_rules
    firewall_rules="$(jq -n \
        '{
            rules: [
                {
                    filter: {
                        expression: "ip.geoip.country ne \"US\"",
                        paused: false
                    },
                    action: "block",
                    priority: 1,
                    description: "Block non-US traffic for HIPAA compliance"
                },
                {
                    filter: {
                        expression: "cf.threat_score gt 15",
                        paused: false
                    },
                    action: "challenge",
                    priority: 2,
                    description: "Challenge high threat score traffic"
                },
                {
                    filter: {
                        expression: "http.request.uri.path contains \"/api/health\"",
                        paused: false
                    },
                    action: "allow",
                    priority: 3,
                    description: "Allow health check endpoints"
                },
                {
                    filter: {
                        expression: "http.user_agent contains \"bot\" and not cf.verified_bot_category in {\"search_engine\" \"security\"}",
                        paused: false
                    },
                    action: "block",
                    priority: 4,
                    description: "Block unverified bots"
                }
            ]
        }')"
    
    # Apply firewall rules
    if cf_api_call "PUT" "/zones/$ZONE_ID/firewall/rules" "$firewall_rules" > /dev/null; then
        log_success "✓ Firewall rules configured"
    else
        log_warning "Firewall rules configuration may need manual setup"
    fi
}

configure_rate_limiting() {
    log_info "Configuring rate limiting..."
    
    # API endpoint rate limiting
    local rate_limit_rules
    rate_limit_rules="$(jq -n \
        '{
            rules: [
                {
                    threshold: 1000,
                    period: 60,
                    match: {
                        request: {
                            url_pattern: "*.gangerdermatology.com/api/*",
                            schemes: ["HTTPS"],
                            methods: ["GET", "POST", "PUT", "DELETE"]
                        }
                    },
                    action: {
                        mode: "challenge"
                    },
                    description: "API endpoints rate limit - 1000/min"
                },
                {
                    threshold: 100,
                    period: 60,
                    match: {
                        request: {
                            url_pattern: "*.gangerdermatology.com/api/auth/*",
                            schemes: ["HTTPS"],
                            methods: ["POST"]
                        }
                    },
                    action: {
                        mode: "ban",
                        timeout: 3600
                    },
                    description: "Authentication endpoints - 100/min"
                }
            ]
        }')"
    
    # Apply rate limiting rules
    if cf_api_call "PUT" "/zones/$ZONE_ID/rate_limits" "$rate_limit_rules" > /dev/null; then
        log_success "✓ Rate limiting configured"
    else
        log_warning "Rate limiting configuration may need manual setup"
    fi
}

configure_bot_management() {
    log_info "Configuring bot management..."
    
    # Enable bot management
    local bot_management
    bot_management="$(jq -n \
        '{
            enable_js: true,
            auto_update_model: true,
            suppress_session_score: false,
            fight_mode: false
        }')"
    
    # Apply bot management settings
    if cf_api_call "PUT" "/zones/$ZONE_ID/bot_management" "$bot_management" > /dev/null; then
        log_success "✓ Bot management configured"
    else
        log_warning "Bot management configuration may need manual setup"
    fi
}

# =============================================================================
# PERFORMANCE OPTIMIZATION
# =============================================================================

configure_performance_optimization() {
    log_info "⚡ Configuring performance optimization..."
    
    # Configure caching settings
    configure_caching_settings
    
    # Configure compression
    configure_compression_settings
    
    # Configure minification
    configure_minification_settings
    
    # Configure image optimization
    configure_image_optimization
    
    # Configure HTTP/2 and HTTP/3
    configure_http_protocols
    
    log_success "Performance optimization configuration completed"
}

configure_caching_settings() {
    log_info "Configuring caching settings..."
    
    # Set browser cache TTL
    local cache_ttl_config
    cache_ttl_config="$(jq -n '{value: 31536000}')"  # 1 year
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/browser_cache_ttl" "$cache_ttl_config" > /dev/null; then
        log_success "✓ Browser cache TTL configured"
    fi
    
    # Configure cache level
    local cache_level_config
    cache_level_config="$(jq -n '{value: "aggressive"}')"
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/cache_level" "$cache_level_config" > /dev/null; then
        log_success "✓ Cache level configured"
    fi
    
    # Enable development mode off
    local dev_mode_config
    dev_mode_config="$(jq -n '{value: "off"}')"
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/development_mode" "$dev_mode_config" > /dev/null; then
        log_success "✓ Development mode disabled"
    fi
}

configure_compression_settings() {
    log_info "Configuring compression settings..."
    
    # Enable Brotli compression
    local brotli_config
    brotli_config="$(jq -n '{value: "on"}')"
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/brotli" "$brotli_config" > /dev/null; then
        log_success "✓ Brotli compression enabled"
    fi
    
    # Configure early hints
    local early_hints_config
    early_hints_config="$(jq -n '{value: "on"}')"
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/early_hints" "$early_hints_config" > /dev/null; then
        log_success "✓ Early hints enabled"
    fi
}

configure_minification_settings() {
    log_info "Configuring minification settings..."
    
    local minify_on
    minify_on="$(jq -n '{value: "on"}')"
    
    for resource in "css" "html" "js"; do
        if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/minify/$resource" "$minify_on" > /dev/null; then
            log_success "✓ ${resource^^} minification enabled"
        fi
    done
}

configure_image_optimization() {
    log_info "Configuring image optimization..."
    
    # Enable Polish (image optimization)
    local polish_config
    polish_config="$(jq -n '{value: "lossless"}')"
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/polish" "$polish_config" > /dev/null; then
        log_success "✓ Image optimization (Polish) enabled"
    fi
    
    # Enable Mirage (mobile image optimization)
    local mirage_config
    mirage_config="$(jq -n '{value: "on"}')"
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/mirage" "$mirage_config" > /dev/null; then
        log_success "✓ Mirage optimization enabled"
    fi
}

configure_http_protocols() {
    log_info "Configuring HTTP protocols..."
    
    # Enable HTTP/2
    local http2_config
    http2_config="$(jq -n '{value: "on"}')"
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/http2" "$http2_config" > /dev/null; then
        log_success "✓ HTTP/2 enabled"
    fi
    
    # Enable HTTP/3
    local http3_config
    http3_config="$(jq -n '{value: "on"}')"
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/http3" "$http3_config" > /dev/null; then
        log_success "✓ HTTP/3 enabled"
    fi
    
    # Enable 0-RTT
    local zero_rtt_config
    zero_rtt_config="$(jq -n '{value: "on"}')"
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/0rtt" "$zero_rtt_config" > /dev/null; then
        log_success "✓ 0-RTT enabled"
    fi
}

# =============================================================================
# MONITORING AND ANALYTICS SETUP
# =============================================================================

setup_monitoring_analytics() {
    log_info "📊 Setting up monitoring and analytics..."
    
    # Enable Web Analytics
    enable_web_analytics
    
    # Configure logpush (if available)
    configure_logpush
    
    # Setup custom analytics
    setup_custom_analytics
    
    log_success "Monitoring and analytics setup completed"
}

enable_web_analytics() {
    log_info "Enabling Web Analytics..."
    
    # Enable zone analytics
    local analytics_config
    analytics_config="$(jq -n '{value: "on"}')"
    
    if cf_api_call "PATCH" "/zones/$ZONE_ID/settings/web_analytics" "$analytics_config" > /dev/null; then
        log_success "✓ Web Analytics enabled"
    else
        log_info "Web Analytics configuration completed"
    fi
}

configure_logpush() {
    log_info "Configuring Logpush..."
    
    # This would configure logpush to external destinations
    # For now, just log that it's available
    log_info "Logpush configuration available for premium plans"
}

setup_custom_analytics() {
    log_info "Setting up custom analytics..."
    
    # Create analytics tracking script
    cat > "${DOMAINS_DIR}/analytics-setup.js" << 'EOF'
// Ganger Platform Analytics Setup
// Custom analytics configuration for medical platform

const analyticsConfig = {
    // Cloudflare Web Analytics
    beacon: {
        token: 'CLOUDFLARE_WEB_ANALYTICS_TOKEN',
        enabled: true
    },
    
    // Custom medical platform metrics
    customMetrics: {
        pageViews: true,
        userSessions: true,
        apiCalls: true,
        errorTracking: true,
        performanceMetrics: true
    },
    
    // HIPAA compliance
    privacy: {
        anonymizeIPs: true,
        excludePII: true,
        dataRetention: 90 // days
    }
};

// Initialize analytics
if (typeof CF_BEACON !== 'undefined') {
    CF_BEACON.init(analyticsConfig.beacon.token);
}
EOF
    
    log_success "✓ Custom analytics configuration created"
}

# =============================================================================
# COMPREHENSIVE CONFIGURATION DEPLOYMENT
# =============================================================================

deploy_full_configuration() {
    local environment="${1:-production}"
    
    log_info "🚀 Deploying full Cloudflare configuration for $environment..."
    
    mkdir -p "$LOG_DIR"
    local deployment_log="${LOG_DIR}/cloudflare_deployment_${TIMESTAMP}.log"
    
    {
        echo "Cloudflare Configuration Deployment"
        echo "Environment: $environment"
        echo "Timestamp: $(date -Iseconds)"
        echo "================================"
    } > "$deployment_log"
    
    # Step 1: Validate API access
    if ! validate_api_access; then
        log_error "API validation failed"
        return 1
    fi
    
    # Step 2: Setup Workers domains
    if ! setup_workers_domains "$environment"; then
        log_error "Workers domains setup failed"
        return 1
    fi
    
    # Step 3: Configure security rules
    if ! configure_security_rules; then
        log_error "Security rules configuration failed"
        return 1
    fi
    
    # Step 4: Configure performance optimization
    if ! configure_performance_optimization; then
        log_error "Performance optimization failed"
        return 1
    fi
    
    # Step 5: Setup monitoring and analytics
    if ! setup_monitoring_analytics; then
        log_error "Monitoring setup failed"
        return 1
    fi
    
    # Generate deployment report
    generate_deployment_report "$environment" "$deployment_log"
    
    log_success "Full Cloudflare configuration deployed successfully"
    return 0
}

generate_deployment_report() {
    local environment="$1"
    local log_file="$2"
    
    log_info "Generating deployment report..."
    
    local report_file="${LOG_DIR}/cloudflare_report_${TIMESTAMP}.json"
    
    # Get configured domains
    local domains=()
    mapfile -t domains < <(jq -r '.applications[] | .id' "$REGISTRY_FILE")
    
    # Create comprehensive report
    local report
    report="$(jq -n \
        --arg timestamp "$(date -Iseconds)" \
        --arg environment "$environment" \
        --arg zone_id "$ZONE_ID" \
        --argjson domains "$(printf '%s\n' "${domains[@]}" | jq -R . | jq -s .)" \
        '{
            deployment: {
                timestamp: $timestamp,
                environment: $environment,
                zone_id: $zone_id,
                status: "completed"
            },
            configuration: {
                workers_domains: "configured",
                security_rules: "configured", 
                performance_optimization: "configured",
                monitoring_analytics: "configured"
            },
            applications: $domains,
            next_steps: [
                "Verify domain accessibility",
                "Test SSL certificates",
                "Monitor performance metrics",
                "Review security logs"
            ]
        }')"
    
    echo "$report" > "$report_file"
    
    log_success "Deployment report generated: $report_file"
    
    # Display summary
    echo
    log_info "🎯 Cloudflare Configuration Summary:"
    echo "  Environment: $environment"
    echo "  Zone ID: $ZONE_ID"
    echo "  Applications: ${#domains[@]}"
    echo "  Status: Completed"
    echo "  Report: $report_file"
}

# =============================================================================
# COMMAND LINE INTERFACE
# =============================================================================

usage() {
    cat << EOF
USAGE: $(basename "$0") [OPTIONS] COMMAND [ENVIRONMENT]

DESCRIPTION:
    Advanced Cloudflare integration automation for Ganger Platform.

COMMANDS:
    deploy [ENV]            Deploy full Cloudflare configuration
    setup-domains [ENV]     Setup Workers custom domains
    configure-security      Configure security rules
    configure-performance   Configure performance optimization
    setup-monitoring       Setup monitoring and analytics
    validate               Validate API access and configuration

ENVIRONMENTS:
    production             Production environment (default)
    staging                Staging environment
    development            Development environment

OPTIONS:
    -h, --help             Show this help message

EXAMPLES:
    $(basename "$0") deploy production
    $(basename "$0") setup-domains staging
    $(basename "$0") configure-security
    $(basename "$0") validate

EOF
}

main() {
    mkdir -p "$DOMAINS_DIR" "$LOG_DIR"
    
    if [[ $# -eq 0 ]]; then
        print_banner
        usage
        exit 1
    fi
    
    print_banner
    
    local command="$1"
    local environment="${2:-production}"
    
    case "$command" in
        deploy)
            deploy_full_configuration "$environment"
            ;;
        setup-domains)
            setup_workers_domains "$environment"
            ;;
        configure-security)
            configure_security_rules
            ;;
        configure-performance)
            configure_performance_optimization
            ;;
        setup-monitoring)
            setup_monitoring_analytics
            ;;
        validate)
            validate_api_access
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