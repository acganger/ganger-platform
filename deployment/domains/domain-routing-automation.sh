#!/bin/bash

# =============================================================================
# GANGER PLATFORM - DOMAIN ROUTING AND SSL AUTOMATION
# =============================================================================
# Comprehensive domain management and SSL automation for medical platform
# Features: Multi-environment routing, SSL certificate automation, DNS management
# Version: 1.0.0
# Date: 2025-01-18
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
readonly REGISTRY_FILE="${DEPLOYMENT_DIR}/apps-registry.json"
readonly DOMAINS_DIR="${DEPLOYMENT_DIR}/domains"
readonly CONFIG_FILE="${DOMAINS_DIR}/domain-config.json"
readonly TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# Domain configuration
readonly PRIMARY_DOMAIN="gangerdermatology.com"
readonly ZONE_ID="ba76d3d3f41251c49f0365421bd644a5"
readonly CLOUDFLARE_ACCOUNT_ID="85f2cf50e95a4a5db52a11adcc2c2c9b"

# SSL configuration
readonly SSL_MODE="full"
readonly HSTS_ENABLED=true
readonly HSTS_MAX_AGE=31536000
readonly ALWAYS_USE_HTTPS=true

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
log_critical() { echo -e "${RED}[CRITICAL]${NC} $*" >&2; }

print_banner() {
    echo -e "${PURPLE}"
    echo "==============================================================================="
    echo "  GANGER PLATFORM - DOMAIN ROUTING AND SSL AUTOMATION"
    echo "  Comprehensive Domain Management for Medical Platform"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

# =============================================================================
# DOMAIN CONFIGURATION MANAGEMENT
# =============================================================================

setup_domain_configuration() {
    local environment="${1:-production}"
    
    log_info "🌐 Setting up domain configuration for $environment..."
    
    mkdir -p "$DOMAINS_DIR"
    
    # Create domain configuration if not exists
    if [[ ! -f "$CONFIG_FILE" ]]; then
        create_domain_config
    fi
    
    # Validate Cloudflare credentials
    validate_cloudflare_credentials
    
    # Setup environment-specific domains
    setup_environment_domains "$environment"
    
    # Configure SSL settings
    configure_ssl_settings "$environment"
    
    # Setup routing rules
    configure_routing_rules "$environment"
    
    log_success "Domain configuration setup completed for $environment"
}

create_domain_config() {
    log_info "Creating domain configuration..."
    
    cat > "$CONFIG_FILE" << 'EOF'
{
  "version": "1.0.0",
  "primary_domain": "gangerdermatology.com",
  "zone_id": "ba76d3d3f41251c49f0365421bd644a5",
  "cloudflare_account_id": "85f2cf50e95a4a5db52a11adcc2c2c9b",
  "environments": {
    "production": {
      "domain_pattern": "{subdomain}.gangerdermatology.com",
      "ssl_mode": "full",
      "hsts_enabled": true,
      "always_use_https": true,
      "custom_domains": {
        "staff": "staff.gangerdermatology.com",
        "inventory": "inventory.gangerdermatology.com",
        "handouts": "handouts.gangerdermatology.com",
        "checkin": "checkin.gangerdermatology.com",
        "meds": "meds.gangerdermatology.com",
        "eos": "eos.gangerdermatology.com",
        "pharma": "pharma.gangerdermatology.com",
        "calls": "calls.gangerdermatology.com",
        "batch": "batch.gangerdermatology.com",
        "social": "social.gangerdermatology.com",
        "clinical": "clinical.gangerdermatology.com",
        "platform": "platform.gangerdermatology.com",
        "config": "config.gangerdermatology.com",
        "showcase": "showcase.gangerdermatology.com",
        "integration": "integration.gangerdermatology.com",
        "ai": "ai.gangerdermatology.com",
        "compliance": "compliance.gangerdermatology.com"
      }
    },
    "staging": {
      "domain_pattern": "{subdomain}-staging.gangerdermatology.com",
      "ssl_mode": "full",
      "hsts_enabled": false,
      "always_use_https": true,
      "custom_domains": {
        "staff": "staff-staging.gangerdermatology.com"
      }
    },
    "development": {
      "domain_pattern": "{subdomain}-dev.gangerdermatology.com",
      "ssl_mode": "flexible",
      "hsts_enabled": false,
      "always_use_https": false,
      "custom_domains": {}
    }
  },
  "ssl_configuration": {
    "certificate_authority": "cloudflare",
    "minimum_tls_version": "1.2",
    "opportunistic_encryption": true,
    "tls_1_3": "on",
    "automatic_https_rewrites": true,
    "security_headers": {
      "hsts": {
        "enabled": true,
        "max_age": 31536000,
        "include_subdomains": true,
        "preload": true
      },
      "x_frame_options": "DENY",
      "x_content_type_options": "nosniff",
      "x_xss_protection": "1; mode=block",
      "referrer_policy": "strict-origin-when-cross-origin"
    }
  },
  "routing_rules": {
    "health_check_bypass": {
      "pattern": "*/api/health",
      "action": "bypass_cache"
    },
    "api_routes": {
      "pattern": "*/api/*",
      "cache_level": "bypass",
      "security_level": "high"
    },
    "static_assets": {
      "pattern": "*/_next/static/*",
      "cache_level": "cache_everything",
      "edge_cache_ttl": 31536000
    },
    "images": {
      "pattern": "*/images/*",
      "cache_level": "cache_everything",
      "edge_cache_ttl": 86400
    }
  },
  "security_settings": {
    "waf_enabled": true,
    "ddos_protection": true,
    "bot_management": true,
    "rate_limiting": {
      "enabled": true,
      "threshold": 1000,
      "period": 60,
      "action": "challenge"
    },
    "firewall_rules": [
      {
        "description": "Block non-US traffic for HIPAA compliance",
        "expression": "ip.geoip.country ne \"US\"",
        "action": "block"
      },
      {
        "description": "Allow health checks",
        "expression": "http.request.uri.path contains \"/api/health\"",
        "action": "allow"
      }
    ]
  },
  "monitoring": {
    "uptime_checks": true,
    "ssl_expiry_alerts": true,
    "dns_resolution_checks": true,
    "performance_monitoring": true
  }
}
EOF
    
    log_success "Domain configuration created"
}

validate_cloudflare_credentials() {
    log_info "Validating Cloudflare credentials..."
    
    if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        log_error "CLOUDFLARE_API_TOKEN environment variable not set"
        return 1
    fi
    
    # Test API connectivity
    if ! curl -sf --max-time 10 \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID" > /dev/null; then
        log_error "Failed to connect to Cloudflare API"
        return 1
    fi
    
    log_success "Cloudflare credentials validated"
    return 0
}

setup_environment_domains() {
    local environment="$1"
    
    log_info "Setting up domains for $environment environment..."
    
    # Get all applications
    local apps=()
    mapfile -t apps < <(jq -r '.applications[].id' "$REGISTRY_FILE")
    
    local domain_pattern
    domain_pattern="$(jq -r ".environments.${environment}.domain_pattern" "$CONFIG_FILE")"
    
    for app_id in "${apps[@]}"; do
        setup_application_domain "$app_id" "$environment" "$domain_pattern"
    done
    
    log_success "Environment domains setup completed for $environment"
}

setup_application_domain() {
    local app_id="$1"
    local environment="$2"
    local domain_pattern="$3"
    
    # Get application metadata
    local subdomain
    subdomain="$(jq -r ".applications[] | select(.id == \"$app_id\") | .subdomain" "$REGISTRY_FILE")"
    
    if [[ "$subdomain" == "null" || "$subdomain" == "main" ]]; then
        subdomain="staff"  # Default to staff subdomain
    fi
    
    # Check for custom domain mapping
    local custom_domain
    custom_domain="$(jq -r ".environments.${environment}.custom_domains.${subdomain} // empty" "$CONFIG_FILE")"
    
    local target_domain
    if [[ -n "$custom_domain" ]]; then
        target_domain="$custom_domain"
    else
        target_domain="${domain_pattern/\{subdomain\}/$subdomain}"
    fi
    
    log_info "Configuring domain for $app_id: $target_domain"
    
    # Create DNS record
    create_dns_record "$target_domain" "$environment"
    
    # Configure domain in wrangler
    configure_wrangler_domain "$app_id" "$target_domain" "$environment"
    
    log_success "✓ $app_id domain configured: $target_domain"
}

create_dns_record() {
    local domain="$1"
    local environment="$2"
    
    log_info "Creating DNS record for $domain..."
    
    # Extract subdomain from full domain
    local subdomain="${domain%%.gangerdermatology.com}"
    
    # Create CNAME record pointing to Workers custom domain
    local dns_record_data
    dns_record_data="$(jq -n \
        --arg type "CNAME" \
        --arg name "$subdomain" \
        --arg content "${subdomain}.gangerdermatology.com.cdn.cloudflare.net" \
        --arg ttl 300 \
        '{
            type: $type,
            name: $name,
            content: $content,
            ttl: ($ttl | tonumber),
            proxied: true
        }')"
    
    # Create or update DNS record
    local existing_record_id
    existing_record_id="$(curl -sf \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$domain" | \
        jq -r '.result[0].id // empty')"
    
    if [[ -n "$existing_record_id" && "$existing_record_id" != "null" ]]; then
        # Update existing record
        if curl -sf \
            -X PUT \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$dns_record_data" \
            "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$existing_record_id" > /dev/null; then
            log_success "✓ DNS record updated for $domain"
        else
            log_error "Failed to update DNS record for $domain"
            return 1
        fi
    else
        # Create new record
        if curl -sf \
            -X POST \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$dns_record_data" \
            "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" > /dev/null; then
            log_success "✓ DNS record created for $domain"
        else
            log_error "Failed to create DNS record for $domain"
            return 1
        fi
    fi
}

configure_wrangler_domain() {
    local app_id="$1"
    local domain="$2"
    local environment="$3"
    
    # Get application path
    local app_path
    app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "$REGISTRY_FILE")"
    local full_path="${PROJECT_ROOT}/${app_path}"
    
    if [[ ! -f "${full_path}/wrangler.jsonc" ]]; then
        log_warning "Wrangler configuration not found for $app_id"
        return 1
    fi
    
    # Update wrangler configuration with custom domain
    log_info "Configuring custom domain in wrangler for $app_id..."
    
    # Add routes configuration to wrangler.jsonc
    local temp_file="${full_path}/wrangler.jsonc.tmp"
    
    # Create updated wrangler config with domain routing
    jq \
        --arg domain "$domain" \
        --arg env "$environment" \
        '
        if .env == null then .env = {} else . end |
        if .env[$env] == null then .env[$env] = {} else . end |
        .env[$env].routes = [
            {
                pattern: ($domain + "/*"),
                custom_domain: true
            }
        ] |
        if $env == "production" then
            .routes = [
                {
                    pattern: ($domain + "/*"),
                    custom_domain: true
                }
            ]
        else . end
        ' "${full_path}/wrangler.jsonc" > "$temp_file"
    
    mv "$temp_file" "${full_path}/wrangler.jsonc"
    
    log_success "✓ Wrangler domain configuration updated for $app_id"
}

# =============================================================================
# SSL CERTIFICATE AUTOMATION
# =============================================================================

configure_ssl_settings() {
    local environment="$1"
    
    log_info "🔒 Configuring SSL settings for $environment..."
    
    # Get SSL configuration from domain config
    local ssl_mode
    ssl_mode="$(jq -r ".environments.${environment}.ssl_mode" "$CONFIG_FILE")"
    
    local hsts_enabled
    hsts_enabled="$(jq -r ".environments.${environment}.hsts_enabled" "$CONFIG_FILE")"
    
    local always_https
    always_https="$(jq -r ".environments.${environment}.always_use_https" "$CONFIG_FILE")"
    
    # Configure zone-level SSL settings
    configure_zone_ssl_settings "$ssl_mode" "$always_https"
    
    # Configure HSTS if enabled
    if [[ "$hsts_enabled" == "true" ]]; then
        configure_hsts_settings
    fi
    
    # Configure security headers
    configure_security_headers
    
    # Setup SSL monitoring
    setup_ssl_monitoring
    
    log_success "SSL configuration completed for $environment"
}

configure_zone_ssl_settings() {
    local ssl_mode="$1"
    local always_https="$2"
    
    log_info "Configuring zone SSL settings..."
    
    # Configure SSL mode
    local ssl_settings
    ssl_settings="$(jq -n \
        --arg value "$ssl_mode" \
        '{value: $value}')"
    
    if curl -sf \
        -X PATCH \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$ssl_settings" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" > /dev/null; then
        log_success "✓ SSL mode configured: $ssl_mode"
    else
        log_error "Failed to configure SSL mode"
    fi
    
    # Configure Always Use HTTPS
    if [[ "$always_https" == "true" ]]; then
        local https_settings
        https_settings="$(jq -n '{value: "on"}')"
        
        if curl -sf \
            -X PATCH \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$https_settings" \
            "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/always_use_https" > /dev/null; then
            log_success "✓ Always Use HTTPS enabled"
        else
            log_error "Failed to enable Always Use HTTPS"
        fi
    fi
    
    # Configure minimum TLS version
    local tls_settings
    tls_settings="$(jq -n '{value: "1.2"}')"
    
    if curl -sf \
        -X PATCH \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$tls_settings" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/min_tls_version" > /dev/null; then
        log_success "✓ Minimum TLS version set to 1.2"
    else
        log_error "Failed to set minimum TLS version"
    fi
}

configure_hsts_settings() {
    log_info "Configuring HSTS settings..."
    
    # Get HSTS configuration
    local hsts_config
    hsts_config="$(jq '.ssl_configuration.security_headers.hsts' "$CONFIG_FILE")"
    
    local max_age
    max_age="$(echo "$hsts_config" | jq -r '.max_age')"
    
    local include_subdomains
    include_subdomains="$(echo "$hsts_config" | jq -r '.include_subdomains')"
    
    local preload
    preload="$(echo "$hsts_config" | jq -r '.preload')"
    
    # Configure HSTS via page rules or headers
    local hsts_header="max-age=$max_age"
    if [[ "$include_subdomains" == "true" ]]; then
        hsts_header="$hsts_header; includeSubDomains"
    fi
    if [[ "$preload" == "true" ]]; then
        hsts_header="$hsts_header; preload"
    fi
    
    # Create page rule for HSTS
    create_hsts_page_rule "$hsts_header"
    
    log_success "✓ HSTS configured: $hsts_header"
}

create_hsts_page_rule() {
    local hsts_header="$1"
    
    log_info "Creating HSTS page rule..."
    
    local page_rule_data
    page_rule_data="$(jq -n \
        --arg url "*.gangerdermatology.com/*" \
        --arg hsts "$hsts_header" \
        '{
            targets: [
                {
                    target: "url",
                    constraint: {
                        operator: "matches",
                        value: $url
                    }
                }
            ],
            actions: [
                {
                    id: "security_header",
                    value: {
                        "strict_transport_security": {
                            "enabled": true,
                            "max_age": 31536000,
                            "include_subdomains": true,
                            "preload": true
                        }
                    }
                }
            ],
            priority: 1,
            status: "active"
        }')"
    
    # Check for existing HSTS page rule
    local existing_rules
    existing_rules="$(curl -sf \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" | \
        jq -r '.result[] | select(.actions[].id == "security_header") | .id')"
    
    if [[ -n "$existing_rules" ]]; then
        log_info "Existing HSTS page rule found, updating..."
        local rule_id
        rule_id="$(echo "$existing_rules" | head -n1)"
        
        if curl -sf \
            -X PUT \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$page_rule_data" \
            "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules/$rule_id" > /dev/null; then
            log_success "✓ HSTS page rule updated"
        else
            log_error "Failed to update HSTS page rule"
        fi
    else
        if curl -sf \
            -X POST \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$page_rule_data" \
            "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" > /dev/null; then
            log_success "✓ HSTS page rule created"
        else
            log_error "Failed to create HSTS page rule"
        fi
    fi
}

configure_security_headers() {
    log_info "Configuring security headers..."
    
    # Configure security headers via Transform Rules API
    local transform_rule_data
    transform_rule_data="$(jq -n \
        '{
            rules: [
                {
                    action: "rewrite",
                    action_parameters: {
                        headers: {
                            "X-Frame-Options": {
                                "operation": "set",
                                "value": "DENY"
                            },
                            "X-Content-Type-Options": {
                                "operation": "set",
                                "value": "nosniff"
                            },
                            "X-XSS-Protection": {
                                "operation": "set",
                                "value": "1; mode=block"
                            },
                            "Referrer-Policy": {
                                "operation": "set",
                                "value": "strict-origin-when-cross-origin"
                            },
                            "Content-Security-Policy": {
                                "operation": "set",
                                "value": "default-src '\''self'\''; script-src '\''self'\'' '\''unsafe-inline'\'' '\''unsafe-eval'\''; style-src '\''self'\'' '\''unsafe-inline'\''; img-src '\''self'\'' data: https:; font-src '\''self'\'' data:; connect-src '\''self'\'' https:; frame-ancestors '\''none'\'';"
                            }
                        }
                    },
                    expression: "true",
                    description: "Security Headers for Ganger Platform",
                    enabled: true
                }
            ]
        }')"
    
    # Apply security headers via Transform Rules
    if curl -sf \
        -X PUT \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$transform_rule_data" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_response_headers_transform/entrypoint" > /dev/null; then
        log_success "✓ Security headers configured"
    else
        log_warning "Security headers configuration may need manual setup"
    fi
}

# =============================================================================
# ROUTING RULES AND OPTIMIZATION
# =============================================================================

configure_routing_rules() {
    local environment="$1"
    
    log_info "⚡ Configuring routing rules for $environment..."
    
    # Configure cache rules
    configure_cache_rules
    
    # Configure API routing
    configure_api_routing
    
    # Configure static asset optimization
    configure_static_assets
    
    # Configure HIPAA compliance rules
    configure_hipaa_routing
    
    log_success "Routing rules configuration completed"
}

configure_cache_rules() {
    log_info "Configuring cache rules..."
    
    local cache_rules_data
    cache_rules_data="$(jq -n \
        '{
            rules: [
                {
                    action: "set_cache_settings",
                    action_parameters: {
                        cache: false,
                        edge_cache_ttl: {
                            mode: "respect_origin"
                        }
                    },
                    expression: "http.request.uri.path matches \"^/api/\"",
                    description: "Bypass cache for API routes",
                    enabled: true
                },
                {
                    action: "set_cache_settings", 
                    action_parameters: {
                        cache: true,
                        edge_cache_ttl: {
                            mode: "override_origin",
                            value: 31536000
                        }
                    },
                    expression: "http.request.uri.path matches \"^/_next/static/\"",
                    description: "Cache static assets for 1 year",
                    enabled: true
                },
                {
                    action: "set_cache_settings",
                    action_parameters: {
                        cache: false
                    },
                    expression: "http.request.uri.path matches \"^/api/health\"",
                    description: "Bypass cache for health checks",
                    enabled: true
                }
            ]
        }')"
    
    # Apply cache rules
    if curl -sf \
        -X PUT \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$cache_rules_data" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_cache_settings/entrypoint" > /dev/null; then
        log_success "✓ Cache rules configured"
    else
        log_warning "Cache rules configuration may need manual setup"
    fi
}

configure_api_routing() {
    log_info "Configuring API routing rules..."
    
    # Configure rate limiting for API endpoints
    local rate_limit_data
    rate_limit_data="$(jq -n \
        '{
            rules: [
                {
                    action: "challenge",
                    ratelimit: {
                        characteristics: ["ip.src"],
                        period: 60,
                        requests_per_period: 1000
                    },
                    expression: "http.request.uri.path matches \"^/api/\"",
                    description: "Rate limit API endpoints - 1000 req/min",
                    enabled: true
                },
                {
                    action: "allow",
                    expression: "http.request.uri.path matches \"^/api/health\"",
                    description: "Allow health check endpoints",
                    enabled: true
                }
            ]
        }')"
    
    # Apply rate limiting rules
    if curl -sf \
        -X PUT \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$rate_limit_data" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_ratelimit/entrypoint" > /dev/null; then
        log_success "✓ API routing rules configured"
    else
        log_warning "API routing rules configuration may need manual setup"
    fi
}

configure_static_assets() {
    log_info "Configuring static asset optimization..."
    
    # Enable automatic minification
    local minify_settings
    minify_settings="$(jq -n '{value: "on"}')"
    
    for setting in "minify/css" "minify/html" "minify/js"; do
        if curl -sf \
            -X PATCH \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$minify_settings" \
            "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/$setting" > /dev/null; then
            log_success "✓ ${setting##*/} minification enabled"
        else
            log_warning "Failed to enable ${setting##*/} minification"
        fi
    done
    
    # Enable Brotli compression
    local brotli_settings
    brotli_settings="$(jq -n '{value: "on"}')"
    
    if curl -sf \
        -X PATCH \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$brotli_settings" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/brotli" > /dev/null; then
        log_success "✓ Brotli compression enabled"
    else
        log_warning "Failed to enable Brotli compression"
    fi
}

configure_hipaa_routing() {
    log_info "Configuring HIPAA compliance routing..."
    
    # Create firewall rules for HIPAA compliance
    local hipaa_rules_data
    hipaa_rules_data="$(jq -n \
        '{
            rules: [
                {
                    action: "block",
                    expression: "ip.geoip.country ne \"US\"",
                    description: "Block non-US traffic for HIPAA compliance",
                    enabled: true
                },
                {
                    action: "js_challenge",
                    expression: "cf.threat_score gt 10",
                    description: "Challenge suspicious traffic",
                    enabled: true
                },
                {
                    action: "allow",
                    expression: "http.request.uri.path matches \"^/api/health\"",
                    description: "Allow health checks",
                    enabled: true
                }
            ]
        }')"
    
    # Apply HIPAA firewall rules
    if curl -sf \
        -X PUT \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$hipaa_rules_data" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_firewall_custom/entrypoint" > /dev/null; then
        log_success "✓ HIPAA compliance rules configured"
    else
        log_warning "HIPAA compliance rules configuration may need manual setup"
    fi
}

# =============================================================================
# SSL MONITORING AND AUTOMATION
# =============================================================================

setup_ssl_monitoring() {
    log_info "📊 Setting up SSL monitoring..."
    
    # Create SSL monitoring configuration
    local ssl_monitor_config="${DOMAINS_DIR}/ssl-monitoring.json"
    
    cat > "$ssl_monitor_config" << 'EOF'
{
  "monitoring": {
    "ssl_expiry_check": {
      "enabled": true,
      "check_interval": "daily",
      "warning_threshold_days": 30,
      "critical_threshold_days": 7,
      "notification_channels": ["slack", "email"]
    },
    "certificate_transparency": {
      "enabled": true,
      "monitor_new_certs": true,
      "alert_on_unexpected": true
    },
    "ssl_configuration_drift": {
      "enabled": true,
      "check_interval": "hourly",
      "alert_on_changes": true
    },
    "tls_version_compliance": {
      "enabled": true,
      "minimum_version": "1.2",
      "preferred_version": "1.3"
    }
  },
  "automation": {
    "auto_renewal": {
      "enabled": true,
      "renewal_threshold_days": 30
    },
    "configuration_sync": {
      "enabled": true,
      "sync_interval": "6h"
    }
  }
}
EOF
    
    # Create SSL monitoring script
    create_ssl_monitoring_script
    
    log_success "SSL monitoring configuration created"
}

create_ssl_monitoring_script() {
    log_info "Creating SSL monitoring script..."
    
    cat > "${DOMAINS_DIR}/ssl-monitor.sh" << 'EOF'
#!/bin/bash

# SSL Certificate Monitoring Script
# Monitors SSL certificate expiry and configuration

set -euo pipefail

DOMAINS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$DOMAINS_DIR/domain-config.json"

check_ssl_expiry() {
    local domain="$1"
    
    echo "Checking SSL expiry for $domain..."
    
    # Get certificate information
    local cert_info
    cert_info="$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)"
    
    if [[ -z "$cert_info" ]]; then
        echo "WARNING: Could not retrieve certificate for $domain"
        return 1
    fi
    
    # Extract expiry date
    local expiry_date
    expiry_date="$(echo "$cert_info" | grep "notAfter=" | cut -d= -f2)"
    
    # Calculate days until expiry
    local expiry_epoch
    expiry_epoch="$(date -d "$expiry_date" +%s)"
    local current_epoch
    current_epoch="$(date +%s)"
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    echo "$domain: $days_until_expiry days until expiry"
    
    # Check thresholds
    if [[ $days_until_expiry -lt 7 ]]; then
        echo "CRITICAL: $domain certificate expires in $days_until_expiry days"
        return 2
    elif [[ $days_until_expiry -lt 30 ]]; then
        echo "WARNING: $domain certificate expires in $days_until_expiry days"
        return 1
    fi
    
    return 0
}

# Check all configured domains
if [[ -f "$CONFIG_FILE" ]]; then
    domains=($(jq -r '.environments.production.custom_domains | to_entries[] | .value' "$CONFIG_FILE"))
    
    for domain in "${domains[@]}"; do
        check_ssl_expiry "$domain"
    done
else
    echo "Domain configuration not found"
    exit 1
fi
EOF
    
    chmod +x "${DOMAINS_DIR}/ssl-monitor.sh"
    
    log_success "SSL monitoring script created"
}

# =============================================================================
# DOMAIN VALIDATION AND HEALTH CHECKS
# =============================================================================

validate_domain_configuration() {
    local environment="${1:-production}"
    
    log_info "🔍 Validating domain configuration for $environment..."
    
    local validation_results=()
    local failed_validations=0
    
    # Get all configured domains
    local domains=()
    mapfile -t domains < <(jq -r ".environments.${environment}.custom_domains | to_entries[] | .value" "$CONFIG_FILE")
    
    for domain in "${domains[@]}"; do
        log_info "Validating $domain..."
        
        # Test 1: DNS Resolution
        if nslookup "$domain" > /dev/null 2>&1; then
            validation_results+=("✓ $domain: DNS resolution")
        else
            validation_results+=("✗ $domain: DNS resolution FAILED")
            ((failed_validations++))
        fi
        
        # Test 2: HTTPS Accessibility
        if curl -sf --max-time 10 "https://$domain" > /dev/null 2>&1; then
            validation_results+=("✓ $domain: HTTPS accessibility")
        else
            validation_results+=("✗ $domain: HTTPS accessibility FAILED")
            ((failed_validations++))
        fi
        
        # Test 3: SSL Certificate
        if echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -text > /dev/null 2>&1; then
            validation_results+=("✓ $domain: SSL certificate")
        else
            validation_results+=("✗ $domain: SSL certificate FAILED")
            ((failed_validations++))
        fi
        
        # Test 4: Security Headers
        local headers
        headers="$(curl -sI --max-time 10 "https://$domain" 2>/dev/null || echo "")"
        if echo "$headers" | grep -q "Strict-Transport-Security\|X-Frame-Options"; then
            validation_results+=("✓ $domain: Security headers")
        else
            validation_results+=("✗ $domain: Security headers MISSING")
            ((failed_validations++))
        fi
    done
    
    # Display validation results
    echo
    log_info "🎯 Domain Validation Results:"
    printf '%s\n' "${validation_results[@]}"
    echo
    
    if [[ $failed_validations -eq 0 ]]; then
        log_success "All domain validations passed"
        return 0
    else
        log_error "$failed_validations validation(s) failed"
        return 1
    fi
}

# =============================================================================
# COMMAND LINE INTERFACE
# =============================================================================

usage() {
    cat << EOF
USAGE: $(basename "$0") [OPTIONS] COMMAND [ENVIRONMENT]

DESCRIPTION:
    Domain routing and SSL automation for Ganger Platform medical applications.

COMMANDS:
    setup [ENV]             Setup domain configuration for environment
    configure-ssl [ENV]     Configure SSL settings
    validate [ENV]          Validate domain configuration
    monitor                 Run SSL monitoring checks
    sync                    Sync domain configurations

ENVIRONMENTS:
    production             Production environment (default)
    staging                Staging environment
    development            Development environment

OPTIONS:
    -h, --help             Show this help message

EXAMPLES:
    $(basename "$0") setup production
    $(basename "$0") configure-ssl staging
    $(basename "$0") validate production
    $(basename "$0") monitor

EOF
}

main() {
    mkdir -p "$DOMAINS_DIR"
    
    if [[ $# -eq 0 ]]; then
        print_banner
        usage
        exit 1
    fi
    
    print_banner
    
    local command="$1"
    local environment="${2:-production}"
    
    case "$command" in
        setup)
            setup_domain_configuration "$environment"
            ;;
        configure-ssl)
            configure_ssl_settings "$environment"
            ;;
        validate)
            validate_domain_configuration "$environment"
            ;;
        monitor)
            "${DOMAINS_DIR}/ssl-monitor.sh"
            ;;
        sync)
            setup_environment_domains "$environment"
            configure_routing_rules "$environment"
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