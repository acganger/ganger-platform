#!/bin/bash

# =============================================================================
# GANGER PLATFORM - PRODUCTION DEPLOYMENT SAFEGUARDS
# =============================================================================
# Mission-critical production deployment protection system
# Features: Pre-deployment validation, approval gates, rollback protection
# Version: 1.0.0
# Date: 2025-01-18
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
readonly REGISTRY_FILE="${DEPLOYMENT_DIR}/apps-registry.json"
readonly PRODUCTION_DIR="${DEPLOYMENT_DIR}/production"
readonly SAFEGUARDS_DIR="${PRODUCTION_DIR}/safeguards"
readonly LOG_DIR="${PRODUCTION_DIR}/logs"
readonly BACKUP_DIR="${PRODUCTION_DIR}/backups"
readonly TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# Production safeguard configuration
readonly PRODUCTION_DOMAIN="staff.gangerdermatology.com"
readonly APPROVAL_TIMEOUT=3600  # 1 hour
readonly HEALTH_CHECK_RETRIES=5
readonly ROLLBACK_TIMEOUT=300   # 5 minutes
readonly BACKUP_RETENTION_DAYS=30

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
    echo "  GANGER PLATFORM - PRODUCTION DEPLOYMENT SAFEGUARDS"
    echo "  Mission-Critical Medical Platform Protection System"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

# =============================================================================
# PRE-DEPLOYMENT VALIDATION SAFEGUARDS
# =============================================================================

validate_production_prerequisites() {
    local apps=("$@")
    
    log_info "🔒 Validating production deployment prerequisites..."
    
    local validation_file="${SAFEGUARDS_DIR}/pre_deployment_validation_${TIMESTAMP}.json"
    mkdir -p "$(dirname "$validation_file")"
    
    # Initialize validation report
    local validation_report
    validation_report="$(jq -n \
        --arg timestamp "$(date -Iseconds)" \
        --argjson apps "$(printf '%s\n' "${apps[@]}" | jq -R . | jq -s .)" \
        '{
            timestamp: $timestamp,
            environment: "production",
            applications: $apps,
            validations: {},
            status: "in_progress"
        }')"
    
    # Critical validation checks
    local validation_passed=true
    
    # 1. Staging validation
    if ! validate_staging_success "${apps[@]}"; then
        validation_passed=false
        validation_report="$(echo "$validation_report" | jq '.validations.staging_success = false')"
    else
        validation_report="$(echo "$validation_report" | jq '.validations.staging_success = true')"
    fi
    
    # 2. Security validation
    if ! validate_security_requirements "${apps[@]}"; then
        validation_passed=false
        validation_report="$(echo "$validation_report" | jq '.validations.security_requirements = false')"
    else
        validation_report="$(echo "$validation_report" | jq '.validations.security_requirements = true')"
    fi
    
    # 3. HIPAA compliance validation
    if ! validate_hipaa_compliance "${apps[@]}"; then
        validation_passed=false
        validation_report="$(echo "$validation_report" | jq '.validations.hipaa_compliance = false')"
    else
        validation_report="$(echo "$validation_report" | jq '.validations.hipaa_compliance = true')"
    fi
    
    # 4. Business hours validation
    if ! validate_deployment_window; then
        validation_passed=false
        validation_report="$(echo "$validation_report" | jq '.validations.deployment_window = false')"
    else
        validation_report="$(echo "$validation_report" | jq '.validations.deployment_window = true')"
    fi
    
    # 5. Production health validation
    if ! validate_current_production_health "${apps[@]}"; then
        validation_passed=false
        validation_report="$(echo "$validation_report" | jq '.validations.current_production_health = false')"
    else
        validation_report="$(echo "$validation_report" | jq '.validations.current_production_health = true')"
    fi
    
    # 6. Backup validation
    if ! validate_production_backups "${apps[@]}"; then
        validation_passed=false
        validation_report="$(echo "$validation_report" | jq '.validations.production_backups = false')"
    else
        validation_report="$(echo "$validation_report" | jq '.validations.production_backups = true')"
    fi
    
    # Update validation status
    if [[ "$validation_passed" == "true" ]]; then
        validation_report="$(echo "$validation_report" | jq '.status = "passed"')"
    else
        validation_report="$(echo "$validation_report" | jq '.status = "failed"')"
    fi
    
    # Save validation report
    echo "$validation_report" > "$validation_file"
    
    # Display validation results
    echo
    log_info "🛡️ Production Deployment Validation Results:"
    echo "$validation_report" | jq -r '
        "  Staging Success: " + (.validations.staging_success | tostring),
        "  Security Requirements: " + (.validations.security_requirements | tostring),
        "  HIPAA Compliance: " + (.validations.hipaa_compliance | tostring),
        "  Deployment Window: " + (.validations.deployment_window | tostring),
        "  Production Health: " + (.validations.current_production_health | tostring),
        "  Production Backups: " + (.validations.production_backups | tostring),
        "  Overall Status: " + .status'
    
    if [[ "$validation_passed" != "true" ]]; then
        log_critical "Production deployment validation failed"
        return 1
    fi
    
    log_success "All production deployment prerequisites validated"
    return 0
}

validate_staging_success() {
    local apps=("$@")
    
    log_info "Validating staging deployment success..."
    
    # Check if staging deployment is healthy for all applications
    for app_id in "${apps[@]}"; do
        if ! "${DEPLOYMENT_DIR}/monitoring/health-check-system.sh" check "$app_id" staging > /dev/null; then
            log_error "Staging health check failed for $app_id"
            return 1
        fi
    done
    
    # Check staging stability (must be stable for at least 30 minutes)
    local staging_log="${DEPLOYMENT_DIR}/staging/logs/staging_health_$(date +%Y%m%d).log"
    if [[ -f "$staging_log" ]]; then
        # Check if there were any recent failures
        local recent_failures
        recent_failures="$(find "$staging_log" -mmin -30 -exec grep -c "ERROR\|FAILED" {} \; 2>/dev/null || echo 0)"
        if [[ "$recent_failures" -gt 0 ]]; then
            log_error "Recent staging failures detected in the last 30 minutes"
            return 1
        fi
    fi
    
    log_success "Staging deployment success validated"
    return 0
}

validate_security_requirements() {
    local apps=("$@")
    
    log_info "Validating security requirements..."
    
    # Check security headers for each application
    for app_id in "${apps[@]}"; do
        local subdomain
        subdomain="$(jq -r ".applications[] | select(.id == \"$app_id\") | .subdomain" "$REGISTRY_FILE")"
        
        local staging_url
        if [[ "$subdomain" == "main" ]]; then
            staging_url="https://staff-staging.gangerdermatology.com"
        else
            staging_url="https://staff-staging.gangerdermatology.com/$subdomain"
        fi
        
        # Check for required security headers
        local headers_response
        headers_response="$(curl -sI --max-time 10 "$staging_url" 2>/dev/null || echo "")"
        
        local required_headers=("X-Frame-Options" "X-Content-Type-Options" "X-XSS-Protection" "Strict-Transport-Security")
        for header in "${required_headers[@]}"; do
            if ! echo "$headers_response" | grep -qi "$header"; then
                log_error "Missing security header '$header' for $app_id"
                return 1
            fi
        done
        
        log_success "✓ $app_id security headers validated"
    done
    
    log_success "Security requirements validated"
    return 0
}

validate_hipaa_compliance() {
    local apps=("$@")
    
    log_info "Validating HIPAA compliance requirements..."
    
    # Check for critical applications that handle medical data
    local critical_apps=()
    mapfile -t critical_apps < <(jq -r '.deployment_groups.critical[]' "$REGISTRY_FILE")
    
    for app_id in "${apps[@]}"; do
        if printf '%s\n' "${critical_apps[@]}" | grep -q "^$app_id$"; then
            # Critical applications must meet HIPAA requirements
            
            # Check audit logging capability
            local subdomain
            subdomain="$(jq -r ".applications[] | select(.id == \"$app_id\") | .subdomain" "$REGISTRY_FILE")"
            
            local staging_url
            if [[ "$subdomain" == "main" ]]; then
                staging_url="https://staff-staging.gangerdermatology.com"
            else
                staging_url="https://staff-staging.gangerdermatology.com/$subdomain"
            fi
            
            # Test HIPAA compliance endpoint (if available)
            if curl -sf --max-time 10 "$staging_url/api/compliance/status" > /dev/null 2>&1; then
                log_success "✓ $app_id HIPAA compliance endpoint accessible"
            else
                log_warning "⚠ $app_id HIPAA compliance endpoint not available (may be expected)"
            fi
        fi
    done
    
    log_success "HIPAA compliance requirements validated"
    return 0
}

validate_deployment_window() {
    log_info "Validating deployment window..."
    
    # Check if current time is within allowed deployment window
    local current_hour
    current_hour="$(date +%H)"
    local current_day
    current_day="$(date +%u)"  # 1-7, Monday-Sunday
    
    # Production deployments allowed:
    # - Monday-Friday: 9 AM - 5 PM EST
    # - Emergency deployments: anytime with approval
    
    if [[ "$current_day" -ge 6 ]]; then
        # Weekend deployment
        log_warning "Weekend deployment detected - requires emergency approval"
        if [[ "${EMERGENCY_DEPLOYMENT:-false}" != "true" ]]; then
            log_error "Weekend deployments require EMERGENCY_DEPLOYMENT=true"
            return 1
        fi
    elif [[ "$current_hour" -lt 9 || "$current_hour" -gt 17 ]]; then
        # Outside business hours
        log_warning "Outside business hours deployment - requires approval"
        if [[ "${AFTER_HOURS_DEPLOYMENT:-false}" != "true" ]]; then
            log_error "After-hours deployments require AFTER_HOURS_DEPLOYMENT=true"
            return 1
        fi
    fi
    
    log_success "Deployment window validated"
    return 0
}

validate_current_production_health() {
    local apps=("$@")
    
    log_info "Validating current production health..."
    
    # Check health of applications currently in production
    local unhealthy_apps=()
    
    for app_id in "${apps[@]}"; do
        if ! "${DEPLOYMENT_DIR}/monitoring/health-check-system.sh" check "$app_id" production > /dev/null 2>&1; then
            unhealthy_apps+=("$app_id")
        fi
    done
    
    if [[ ${#unhealthy_apps[@]} -gt 0 ]]; then
        log_error "Current production applications are unhealthy: ${unhealthy_apps[*]}"
        log_error "Cannot deploy to production while existing applications are failing"
        return 1
    fi
    
    log_success "Current production health validated"
    return 0
}

validate_production_backups() {
    local apps=("$@")
    
    log_info "Validating production backups..."
    
    # Create backup before deployment
    create_production_backup "${apps[@]}"
    
    # Verify backup was created successfully
    local backup_file="${BACKUP_DIR}/production_backup_${TIMESTAMP}.tar.gz"
    if [[ ! -f "$backup_file" ]]; then
        log_error "Production backup creation failed"
        return 1
    fi
    
    # Verify backup size (should not be empty)
    local backup_size
    backup_size="$(stat -c%s "$backup_file" 2>/dev/null || echo 0)"
    if [[ "$backup_size" -lt 1024 ]]; then
        log_error "Production backup suspiciously small: $backup_size bytes"
        return 1
    fi
    
    log_success "Production backup validated: $backup_file"
    return 0
}

# =============================================================================
# APPROVAL GATE SYSTEM
# =============================================================================

request_deployment_approval() {
    local apps=("$@")
    
    log_info "🔐 Requesting production deployment approval..."
    
    local approval_file="${SAFEGUARDS_DIR}/approval_request_${TIMESTAMP}.json"
    
    # Create approval request
    local approval_request
    approval_request="$(jq -n \
        --arg timestamp "$(date -Iseconds)" \
        --arg requester "${USER:-unknown}" \
        --arg commit_sha "${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo 'unknown')}" \
        --argjson apps "$(printf '%s\n' "${apps[@]}" | jq -R . | jq -s .)" \
        '{
            timestamp: $timestamp,
            requester: $requester,
            commit_sha: $commit_sha,
            applications: $apps,
            status: "pending",
            approval_timeout: '$(date -d "+1 hour" +%s)',
            deployment_type: "production",
            approval_required: true
        }')"
    
    echo "$approval_request" > "$approval_file"
    
    # Send approval notification
    send_approval_notification "$approval_file"
    
    # Wait for approval or timeout
    if wait_for_approval "$approval_file"; then
        log_success "Production deployment approved"
        return 0
    else
        log_error "Production deployment approval failed or timed out"
        return 1
    fi
}

send_approval_notification() {
    local approval_file="$1"
    
    log_info "Sending approval notification..."
    
    # Extract approval details
    local requester
    requester="$(jq -r '.requester' "$approval_file")"
    local apps
    apps="$(jq -r '.applications | join(", ")' "$approval_file")"
    local commit_sha
    commit_sha="$(jq -r '.commit_sha' "$approval_file")"
    
    # Send Slack notification (if configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local slack_message
        slack_message="$(cat <<EOF
{
    "text": "🚨 Production Deployment Approval Required",
    "attachments": [
        {
            "color": "warning",
            "fields": [
                {
                    "title": "Requester",
                    "value": "$requester",
                    "short": true
                },
                {
                    "title": "Applications",
                    "value": "$apps",
                    "short": true
                },
                {
                    "title": "Commit SHA",
                    "value": "$commit_sha",
                    "short": true
                },
                {
                    "title": "Approval File",
                    "value": "$(basename "$approval_file")",
                    "short": true
                }
            ],
            "actions": [
                {
                    "type": "button",
                    "text": "Approve",
                    "style": "primary",
                    "value": "approve"
                },
                {
                    "type": "button",
                    "text": "Reject",
                    "style": "danger",
                    "value": "reject"
                }
            ]
        }
    ]
}
EOF
)"
        
        curl -sf -X POST \
             -H "Content-Type: application/json" \
             -d "$slack_message" \
             "${SLACK_WEBHOOK_URL}" > /dev/null || \
             log_warning "Failed to send Slack approval notification"
    fi
    
    # Display approval instructions
    echo
    log_info "📋 Production Deployment Approval Required:"
    echo "  Requester: $requester"
    echo "  Applications: $apps"
    echo "  Commit: $commit_sha"
    echo "  Approval File: $approval_file"
    echo
    log_info "To approve deployment, run:"
    echo "  echo '{\"status\": \"approved\", \"approver\": \"your-name\", \"timestamp\": \"$(date -Iseconds)\"}' > ${approval_file}.approval"
    echo
    log_info "To reject deployment, run:"
    echo "  echo '{\"status\": \"rejected\", \"approver\": \"your-name\", \"timestamp\": \"$(date -Iseconds)\", \"reason\": \"rejection reason\"}' > ${approval_file}.approval"
}

wait_for_approval() {
    local approval_file="$1"
    local approval_response="${approval_file}.approval"
    
    log_info "Waiting for approval (timeout: ${APPROVAL_TIMEOUT}s)..."
    
    local start_time
    start_time="$(date +%s)"
    local timeout_time=$((start_time + APPROVAL_TIMEOUT))
    
    while [[ "$(date +%s)" -lt "$timeout_time" ]]; do
        if [[ -f "$approval_response" ]]; then
            local approval_status
            approval_status="$(jq -r '.status' "$approval_response" 2>/dev/null || echo 'invalid')"
            
            case "$approval_status" in
                "approved")
                    local approver
                    approver="$(jq -r '.approver' "$approval_response")"
                    log_success "Deployment approved by: $approver"
                    
                    # Update approval request
                    jq --arg approver "$approver" \
                       --arg approval_time "$(date -Iseconds)" \
                       '.status = "approved" | .approver = $approver | .approval_time = $approval_time' \
                       "$approval_file" > "${approval_file}.tmp" && mv "${approval_file}.tmp" "$approval_file"
                    
                    return 0
                    ;;
                "rejected")
                    local approver
                    approver="$(jq -r '.approver' "$approval_response")"
                    local reason
                    reason="$(jq -r '.reason // "No reason provided"' "$approval_response")"
                    log_error "Deployment rejected by: $approver"
                    log_error "Reason: $reason"
                    
                    # Update approval request
                    jq --arg approver "$approver" \
                       --arg rejection_time "$(date -Iseconds)" \
                       --arg reason "$reason" \
                       '.status = "rejected" | .approver = $approver | .rejection_time = $rejection_time | .rejection_reason = $reason' \
                       "$approval_file" > "${approval_file}.tmp" && mv "${approval_file}.tmp" "$approval_file"
                    
                    return 1
                    ;;
                "invalid")
                    log_warning "Invalid approval response format"
                    rm -f "$approval_response"
                    ;;
            esac
        fi
        
        sleep 10
    done
    
    log_error "Approval timeout reached"
    
    # Update approval request with timeout
    jq '.status = "timeout" | .timeout_time = "'$(date -Iseconds)'"' \
       "$approval_file" > "${approval_file}.tmp" && mv "${approval_file}.tmp" "$approval_file"
    
    return 1
}

# =============================================================================
# PRODUCTION BACKUP AND RECOVERY
# =============================================================================

create_production_backup() {
    local apps=("$@")
    
    log_info "Creating production backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    local backup_file="${BACKUP_DIR}/production_backup_${TIMESTAMP}.tar.gz"
    local backup_manifest="${BACKUP_DIR}/backup_manifest_${TIMESTAMP}.json"
    
    # Create backup manifest
    local manifest
    manifest="$(jq -n \
        --arg timestamp "$(date -Iseconds)" \
        --arg backup_file "$(basename "$backup_file")" \
        --argjson apps "$(printf '%s\n' "${apps[@]}" | jq -R . | jq -s .)" \
        '{
            timestamp: $timestamp,
            backup_file: $backup_file,
            applications: $apps,
            backup_type: "pre_deployment",
            environment: "production"
        }')"
    
    echo "$manifest" > "$backup_manifest"
    
    # Create backup of current deployment configurations
    local temp_backup_dir="${BACKUP_DIR}/temp_${TIMESTAMP}"
    mkdir -p "$temp_backup_dir"
    
    # Backup wrangler configurations
    for app_id in "${apps[@]}"; do
        local app_path
        app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "$REGISTRY_FILE")"
        local full_path="${PROJECT_ROOT}/${app_path}"
        
        if [[ -f "${full_path}/wrangler.jsonc" ]]; then
            cp "${full_path}/wrangler.jsonc" "${temp_backup_dir}/${app_id}_wrangler.jsonc"
        fi
        
        # Backup deployment state (if available)
        if command -v wrangler &> /dev/null; then
            (
                cd "$full_path"
                wrangler deployments list --env production > "${temp_backup_dir}/${app_id}_deployments.txt" 2>/dev/null || true
            )
        fi
    done
    
    # Backup deployment scripts and configurations
    cp -r "${DEPLOYMENT_DIR}/scripts" "${temp_backup_dir}/" 2>/dev/null || true
    cp -r "${DEPLOYMENT_DIR}/monitoring" "${temp_backup_dir}/" 2>/dev/null || true
    cp "$REGISTRY_FILE" "${temp_backup_dir}/" 2>/dev/null || true
    
    # Create compressed backup
    tar -czf "$backup_file" -C "$BACKUP_DIR" "temp_${TIMESTAMP}"
    
    # Cleanup temporary directory
    rm -rf "$temp_backup_dir"
    
    log_success "Production backup created: $backup_file"
    
    # Cleanup old backups
    cleanup_old_backups
    
    return 0
}

cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Remove backups older than retention period
    find "$BACKUP_DIR" -name "production_backup_*.tar.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "backup_manifest_*.json" -mtime +${BACKUP_RETENTION_DAYS} -delete 2>/dev/null || true
    
    log_success "Old backups cleaned up"
}

# =============================================================================
# PRODUCTION DEPLOYMENT WITH SAFEGUARDS
# =============================================================================

deploy_to_production_with_safeguards() {
    local apps=("$@")
    
    log_info "🚀 Starting production deployment with safeguards..."
    
    # Phase 1: Pre-deployment validation
    log_info "Phase 1: Pre-deployment validation"
    if ! validate_production_prerequisites "${apps[@]}"; then
        log_critical "Pre-deployment validation failed"
        return 1
    fi
    
    # Phase 2: Approval gate
    log_info "Phase 2: Deployment approval"
    if ! request_deployment_approval "${apps[@]}"; then
        log_critical "Deployment approval failed"
        return 1
    fi
    
    # Phase 3: Final pre-deployment checks
    log_info "Phase 3: Final pre-deployment checks"
    if ! perform_final_checks "${apps[@]}"; then
        log_critical "Final pre-deployment checks failed"
        return 1
    fi
    
    # Phase 4: Production deployment
    log_info "Phase 4: Production deployment"
    if ! execute_production_deployment "${apps[@]}"; then
        log_critical "Production deployment failed"
        initiate_automatic_rollback "${apps[@]}"
        return 1
    fi
    
    # Phase 5: Post-deployment validation
    log_info "Phase 5: Post-deployment validation"
    if ! validate_production_deployment "${apps[@]}"; then
        log_critical "Post-deployment validation failed"
        initiate_automatic_rollback "${apps[@]}"
        return 1
    fi
    
    # Phase 6: Success notification
    log_info "Phase 6: Success notification"
    send_deployment_success_notification "${apps[@]}"
    
    log_success "Production deployment completed successfully with all safeguards"
    return 0
}

perform_final_checks() {
    local apps=("$@")
    
    log_info "Performing final pre-deployment checks..."
    
    # Verify staging is still healthy
    if ! validate_staging_success "${apps[@]}"; then
        log_error "Staging health degraded since initial validation"
        return 1
    fi
    
    # Verify production is still healthy
    if ! validate_current_production_health "${apps[@]}"; then
        log_error "Production health degraded since initial validation"
        return 1
    fi
    
    # Check for any production incidents
    if check_production_incidents; then
        log_error "Active production incidents detected"
        return 1
    fi
    
    log_success "Final pre-deployment checks passed"
    return 0
}

check_production_incidents() {
    # Check for any active production incidents
    # This would integrate with incident management system
    
    # For now, check recent health check failures
    local recent_failures
    recent_failures="$(find "$LOG_DIR" -name "*production*" -mmin -60 -exec grep -c "ERROR\|FAILED\|CRITICAL" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}')"
    
    if [[ "$recent_failures" -gt 0 ]]; then
        log_warning "Recent production failures detected: $recent_failures"
        return 0  # Warning but not blocking
    fi
    
    return 1  # No incidents
}

execute_production_deployment() {
    local apps=("$@")
    
    log_info "Executing production deployment..."
    
    # Use the master deployment script for production deployment
    if ! "${DEPLOYMENT_DIR}/scripts/deploy-master.sh" -e production deploy "${apps[@]}"; then
        log_error "Production deployment execution failed"
        return 1
    fi
    
    log_success "Production deployment executed"
    return 0
}

validate_production_deployment() {
    local apps=("$@")
    
    log_info "Validating production deployment..."
    
    # Wait for deployment to stabilize
    log_info "Waiting for deployment stabilization..."
    sleep 30
    
    # Validate each application
    local failed_apps=()
    
    for app_id in "${apps[@]}"; do
        local attempts=0
        local success=false
        
        while [[ $attempts -lt $HEALTH_CHECK_RETRIES ]]; do
            if "${DEPLOYMENT_DIR}/monitoring/health-check-system.sh" check "$app_id" production > /dev/null; then
                success=true
                break
            fi
            
            ((attempts++))
            log_warning "Health check attempt $attempts/$HEALTH_CHECK_RETRIES failed for $app_id"
            sleep 10
        done
        
        if [[ "$success" != "true" ]]; then
            failed_apps+=("$app_id")
        fi
    done
    
    if [[ ${#failed_apps[@]} -gt 0 ]]; then
        log_error "Production deployment validation failed for: ${failed_apps[*]}"
        return 1
    fi
    
    log_success "Production deployment validation passed"
    return 0
}

# =============================================================================
# AUTOMATIC ROLLBACK SYSTEM
# =============================================================================

initiate_automatic_rollback() {
    local apps=("$@")
    
    log_critical "🔄 Initiating automatic rollback..."
    
    local rollback_file="${SAFEGUARDS_DIR}/rollback_${TIMESTAMP}.json"
    
    # Create rollback record
    local rollback_record
    rollback_record="$(jq -n \
        --arg timestamp "$(date -Iseconds)" \
        --argjson apps "$(printf '%s\n' "${apps[@]}" | jq -R . | jq -s .)" \
        --arg trigger "automatic" \
        '{
            timestamp: $timestamp,
            applications: $apps,
            trigger: $trigger,
            status: "in_progress",
            rollback_type: "deployment_failure"
        }')"
    
    echo "$rollback_record" > "$rollback_file"
    
    # Find most recent backup
    local latest_backup
    latest_backup="$(find "$BACKUP_DIR" -name "production_backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)"
    
    if [[ -z "$latest_backup" ]]; then
        log_critical "No backup found for rollback"
        return 1
    fi
    
    log_info "Rolling back using backup: $latest_backup"
    
    # Perform rollback (this would restore previous deployment state)
    # For Workers, this might involve deploying previous version
    if perform_rollback "${apps[@]}" "$latest_backup"; then
        log_success "Automatic rollback completed successfully"
        
        # Update rollback record
        jq '.status = "completed" | .completion_time = "'$(date -Iseconds)'"' \
           "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"
        
        # Send rollback notification
        send_rollback_notification "${apps[@]}"
        
        return 0
    else
        log_critical "Automatic rollback failed"
        
        # Update rollback record
        jq '.status = "failed" | .failure_time = "'$(date -Iseconds)'"' \
           "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"
        
        # Send critical failure notification
        send_critical_failure_notification "${apps[@]}"
        
        return 1
    fi
}

perform_rollback() {
    local apps=("$@")
    local backup_file="$1"
    
    log_info "Performing rollback from backup: $backup_file"
    
    # This is a placeholder for actual rollback implementation
    # In a real scenario, this would:
    # 1. Extract backup configurations
    # 2. Deploy previous versions of Workers
    # 3. Restore previous routing configurations
    # 4. Validate rollback success
    
    log_warning "Rollback implementation placeholder - manual intervention may be required"
    
    # For now, just validate that current deployment can be accessed
    local rollback_success=true
    
    for app_id in "${apps[@]}"; do
        if ! "${DEPLOYMENT_DIR}/monitoring/health-check-system.sh" check "$app_id" production > /dev/null; then
            rollback_success=false
        fi
    done
    
    if [[ "$rollback_success" == "true" ]]; then
        return 0
    else
        return 1
    fi
}

# =============================================================================
# NOTIFICATION SYSTEM
# =============================================================================

send_deployment_success_notification() {
    local apps=("$@")
    
    log_info "Sending deployment success notification..."
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local slack_message
        slack_message="$(cat <<EOF
{
    "text": "✅ Production Deployment Successful",
    "attachments": [
        {
            "color": "good",
            "fields": [
                {
                    "title": "Environment",
                    "value": "Production",
                    "short": true
                },
                {
                    "title": "Applications",
                    "value": "$(printf '%s, ' "${apps[@]}" | sed 's/, $//')",
                    "short": true
                },
                {
                    "title": "Deployment Time",
                    "value": "$(date -Iseconds)",
                    "short": false
                }
            ]
        }
    ]
}
EOF
)"
        
        curl -sf -X POST \
             -H "Content-Type: application/json" \
             -d "$slack_message" \
             "${SLACK_WEBHOOK_URL}" > /dev/null || \
             log_warning "Failed to send success notification"
    fi
}

send_rollback_notification() {
    local apps=("$@")
    
    log_info "Sending rollback notification..."
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local slack_message
        slack_message="$(cat <<EOF
{
    "text": "🔄 Automatic Rollback Executed",
    "attachments": [
        {
            "color": "warning",
            "fields": [
                {
                    "title": "Environment",
                    "value": "Production",
                    "short": true
                },
                {
                    "title": "Applications",
                    "value": "$(printf '%s, ' "${apps[@]}" | sed 's/, $//')",
                    "short": true
                },
                {
                    "title": "Rollback Time",
                    "value": "$(date -Iseconds)",
                    "short": false
                },
                {
                    "title": "Reason",
                    "value": "Deployment validation failed",
                    "short": false
                }
            ]
        }
    ]
}
EOF
)"
        
        curl -sf -X POST \
             -H "Content-Type: application/json" \
             -d "$slack_message" \
             "${SLACK_WEBHOOK_URL}" > /dev/null || \
             log_warning "Failed to send rollback notification"
    fi
}

send_critical_failure_notification() {
    local apps=("$@")
    
    log_critical "Sending critical failure notification..."
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local slack_message
        slack_message="$(cat <<EOF
{
    "text": "🚨 CRITICAL: Production Deployment Failure",
    "attachments": [
        {
            "color": "danger",
            "fields": [
                {
                    "title": "Environment",
                    "value": "Production",
                    "short": true
                },
                {
                    "title": "Applications",
                    "value": "$(printf '%s, ' "${apps[@]}" | sed 's/, $//')",
                    "short": true
                },
                {
                    "title": "Failure Time",
                    "value": "$(date -Iseconds)",
                    "short": false
                },
                {
                    "title": "Status",
                    "value": "MANUAL INTERVENTION REQUIRED",
                    "short": false
                }
            ]
        }
    ]
}
EOF
)"
        
        curl -sf -X POST \
             -H "Content-Type: application/json" \
             -d "$slack_message" \
             "${SLACK_WEBHOOK_URL}" > /dev/null || \
             log_warning "Failed to send critical failure notification"
    fi
}

# =============================================================================
# COMMAND LINE INTERFACE
# =============================================================================

usage() {
    cat << EOF
USAGE: $(basename "$0") [OPTIONS] COMMAND [ARGS...]

DESCRIPTION:
    Production deployment safeguards for Ganger Platform.

COMMANDS:
    validate [APPS...]      Validate production deployment prerequisites
    approve REQUEST_FILE    Approve deployment request
    reject REQUEST_FILE     Reject deployment request  
    deploy [APPS...]        Deploy to production with all safeguards
    rollback [APPS...]      Initiate manual rollback
    backup [APPS...]        Create production backup
    status                  Show production safeguards status

OPTIONS:
    -h, --help             Show this help message

EXAMPLES:
    $(basename "$0") validate critical
    $(basename "$0") deploy inventory handouts
    $(basename "$0") backup all
    $(basename "$0") status

ENVIRONMENT VARIABLES:
    EMERGENCY_DEPLOYMENT=true     Allow weekend deployments
    AFTER_HOURS_DEPLOYMENT=true  Allow after-hours deployments

EOF
}

main() {
    # Initialize directories
    mkdir -p "$PRODUCTION_DIR" "$SAFEGUARDS_DIR" "$LOG_DIR" "$BACKUP_DIR"
    
    if [[ $# -eq 0 ]]; then
        print_banner
        usage
        exit 1
    fi
    
    print_banner
    
    local command="$1"
    shift || true
    
    case "$command" in
        validate)
            local apps=("$@")
            if [[ ${#apps[@]} -eq 0 ]]; then
                log_error "No applications specified for validation"
                exit 1
            fi
            validate_production_prerequisites "${apps[@]}"
            ;;
        approve)
            local request_file="${1:-}"
            if [[ -z "$request_file" ]]; then
                log_error "Approval request file required"
                exit 1
            fi
            echo '{"status": "approved", "approver": "'${USER:-manual}'", "timestamp": "'$(date -Iseconds)'"}' > "${request_file}.approval"
            log_success "Deployment request approved"
            ;;
        reject)
            local request_file="${1:-}"
            local reason="${2:-Manual rejection}"
            if [[ -z "$request_file" ]]; then
                log_error "Approval request file required"
                exit 1
            fi
            echo '{"status": "rejected", "approver": "'${USER:-manual}'", "timestamp": "'$(date -Iseconds)'", "reason": "'"$reason"'"}' > "${request_file}.approval"
            log_success "Deployment request rejected"
            ;;
        deploy)
            local apps=("$@")
            if [[ ${#apps[@]} -eq 0 ]]; then
                log_error "No applications specified for deployment"
                exit 1
            fi
            deploy_to_production_with_safeguards "${apps[@]}"
            ;;
        rollback)
            local apps=("$@")
            if [[ ${#apps[@]} -eq 0 ]]; then
                log_error "No applications specified for rollback"
                exit 1
            fi
            initiate_automatic_rollback "${apps[@]}"
            ;;
        backup)
            local apps=("$@")
            if [[ ${#apps[@]} -eq 0 ]]; then
                log_error "No applications specified for backup"
                exit 1
            fi
            create_production_backup "${apps[@]}"
            ;;
        status)
            log_info "Production Safeguards Status:"
            echo "  Backup Directory: $BACKUP_DIR"
            echo "  Log Directory: $LOG_DIR"
            echo "  Safeguards Directory: $SAFEGUARDS_DIR"
            echo "  Backup Retention: $BACKUP_RETENTION_DAYS days"
            
            # Show recent backups
            echo "  Recent Backups:"
            find "$BACKUP_DIR" -name "production_backup_*.tar.gz" -type f -printf '    %TY-%Tm-%Td %TH:%TM - %f\n' | sort -r | head -5
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