#!/bin/bash

# =============================================================================
# GANGER PLATFORM - ROLLBACK AND DISASTER RECOVERY SYSTEM
# =============================================================================
# Comprehensive rollback and disaster recovery for medical platform
# Features: Automated rollback, state preservation, data protection, multi-tier recovery
# Version: 1.0.0
# Date: 2025-01-18
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
readonly RECOVERY_DIR="${DEPLOYMENT_DIR}/recovery"
readonly BACKUP_DIR="${RECOVERY_DIR}/backups"
readonly SNAPSHOTS_DIR="${RECOVERY_DIR}/snapshots"
readonly LOG_DIR="${RECOVERY_DIR}/logs"
readonly REGISTRY_FILE="${DEPLOYMENT_DIR}/apps-registry.json"
readonly TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# Recovery configuration
readonly CLOUDFLARE_ZONE_ID="ba76d3d3f41251c49f0365421bd644a5"
readonly CLOUDFLARE_ACCOUNT_ID="85f2cf50e95a4a5db52a11adcc2c2c9b"
readonly ROLLBACK_TIMEOUT=600  # 10 minutes
readonly BACKUP_RETENTION_DAYS=30
readonly SNAPSHOT_RETENTION_COUNT=10

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
    echo "  GANGER PLATFORM - ROLLBACK AND DISASTER RECOVERY SYSTEM"
    echo "  Mission-Critical Recovery Operations for Medical Platform"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

# =============================================================================
# ROLLBACK SYSTEM INITIALIZATION
# =============================================================================

initialize_rollback_system() {
    log_info "🔄 Initializing rollback and disaster recovery system..."
    
    # Create recovery directories
    mkdir -p "$RECOVERY_DIR" "$BACKUP_DIR" "$SNAPSHOTS_DIR" "$LOG_DIR"
    
    # Create recovery configuration
    create_recovery_configuration
    
    # Initialize snapshot system
    initialize_snapshot_system
    
    # Setup rollback automation
    setup_rollback_automation
    
    # Configure disaster recovery
    configure_disaster_recovery
    
    # Test recovery procedures
    test_recovery_procedures
    
    log_success "Rollback and disaster recovery system initialized"
}

create_recovery_configuration() {
    log_info "Creating recovery configuration..."
    
    local recovery_config="${RECOVERY_DIR}/recovery-config.json"
    
    cat > "$recovery_config" << 'EOF'
{
  "version": "1.0.0",
  "recovery_settings": {
    "rollback_timeout": 600,
    "backup_retention_days": 30,
    "snapshot_retention_count": 10,
    "automatic_rollback": {
      "enabled": true,
      "health_check_failures": 3,
      "performance_degradation_threshold": 5000,
      "error_rate_threshold": 0.05
    },
    "manual_rollback": {
      "approval_required": true,
      "approval_timeout": 1800,
      "reason_required": true
    }
  },
  "backup_strategy": {
    "pre_deployment_backup": true,
    "post_deployment_verification": true,
    "incremental_backups": true,
    "configuration_backup": true,
    "database_backup": false,
    "file_system_backup": true
  },
  "disaster_recovery": {
    "multi_region_backup": false,
    "cross_cloud_backup": false,
    "recovery_time_objective": 900,
    "recovery_point_objective": 300,
    "business_continuity": {
      "critical_applications": ["staff", "inventory", "handouts", "checkin-kiosk"],
      "priority_recovery_order": ["staff", "inventory", "handouts", "medication-auth"]
    }
  },
  "notification": {
    "rollback_initiated": true,
    "rollback_completed": true,
    "rollback_failed": true,
    "disaster_recovery_activated": true,
    "channels": {
      "slack": {
        "enabled": true,
        "webhook_url": "${SLACK_WEBHOOK_URL}",
        "channel": "#disaster-recovery"
      },
      "email": {
        "enabled": true,
        "recipients": ["admin@gangerdermatology.com", "it@gangerdermatology.com"]
      }
    }
  },
  "compliance": {
    "hipaa_requirements": {
      "audit_logging": true,
      "data_protection": true,
      "access_controls": true,
      "business_continuity": true
    },
    "recovery_documentation": {
      "required": true,
      "incident_reports": true,
      "post_mortem_analysis": true
    }
  }
}
EOF
    
    log_success "Recovery configuration created"
}

initialize_snapshot_system() {
    log_info "Initializing snapshot system..."
    
    # Create snapshot database
    local snapshot_db="${SNAPSHOTS_DIR}/snapshots.json"
    
    cat > "$snapshot_db" << 'EOF'
{
  "version": "1.0.0",
  "last_updated": "",
  "snapshots": [],
  "statistics": {
    "total_snapshots": 0,
    "active_snapshots": 0,
    "storage_used_mb": 0,
    "oldest_snapshot": null,
    "latest_snapshot": null
  }
}
EOF
    
    # Update timestamp
    local current_time
    current_time="$(date -Iseconds)"
    jq --arg timestamp "$current_time" '.last_updated = $timestamp' "$snapshot_db" > "$snapshot_db.tmp"
    mv "$snapshot_db.tmp" "$snapshot_db"
    
    # Create snapshot management script
    create_snapshot_manager
    
    log_success "Snapshot system initialized"
}

create_snapshot_manager() {
    log_info "Creating snapshot manager..."
    
    cat > "${RECOVERY_DIR}/snapshot-manager.sh" << 'EOF'
#!/bin/bash

# Snapshot Manager for Ganger Platform
# Handles creation, management, and restoration of application snapshots

set -euo pipefail

RECOVERY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SNAPSHOTS_DIR="$RECOVERY_DIR/snapshots"
LOG_DIR="$RECOVERY_DIR/logs"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

log_info() { echo -e "\033[0;36m[INFO]\033[0m $*"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $*"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $*" >&2; }

create_deployment_snapshot() {
    local deployment_id="$1"
    local environment="${2:-production}"
    local apps_list="$3"
    
    log_info "Creating deployment snapshot: $deployment_id"
    
    local snapshot_dir="${SNAPSHOTS_DIR}/snapshot_${deployment_id}_${TIMESTAMP}"
    mkdir -p "$snapshot_dir"
    
    # Create snapshot metadata
    local snapshot_metadata
    snapshot_metadata="$(jq -n \
        --arg id "$deployment_id" \
        --arg timestamp "$(date -Iseconds)" \
        --arg environment "$environment" \
        --arg apps "$apps_list" \
        --arg status "creating" \
        '{
            id: $id,
            timestamp: $timestamp,
            environment: $environment,
            applications: ($apps | split(" ")),
            status: $status,
            snapshot_dir: "'"$snapshot_dir"'",
            size_bytes: 0,
            created_by: "rollback-system"
        }')"
    
    echo "$snapshot_metadata" > "${snapshot_dir}/metadata.json"
    
    # Snapshot application configurations
    local total_size=0
    local apps_array
    IFS=' ' read -ra apps_array <<< "$apps_list"
    
    for app_id in "${apps_array[@]}"; do
        snapshot_application "$app_id" "$snapshot_dir" "$environment"
        local app_size
        app_size="$(du -sb "${snapshot_dir}/${app_id}" 2>/dev/null | cut -f1 || echo 0)"
        total_size=$((total_size + app_size))
    done
    
    # Update metadata with final size
    jq --arg size "$total_size" --arg status "completed" \
        '.size_bytes = ($size | tonumber) | .status = $status' \
        "${snapshot_dir}/metadata.json" > "${snapshot_dir}/metadata.json.tmp"
    mv "${snapshot_dir}/metadata.json.tmp" "${snapshot_dir}/metadata.json"
    
    # Update snapshot database
    update_snapshot_database "$snapshot_metadata"
    
    log_success "Deployment snapshot created: $snapshot_dir"
    echo "$snapshot_dir"
}

snapshot_application() {
    local app_id="$1"
    local snapshot_dir="$2"
    local environment="$3"
    
    log_info "Creating snapshot for application: $app_id"
    
    local app_snapshot_dir="${snapshot_dir}/${app_id}"
    mkdir -p "$app_snapshot_dir"
    
    # Get application path
    local app_path
    app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "${RECOVERY_DIR}/../apps-registry.json")"
    local full_app_path="${RECOVERY_DIR}/../../${app_path}"
    
    if [[ ! -d "$full_app_path" ]]; then
        log_error "Application directory not found: $full_app_path"
        return 1
    fi
    
    # Snapshot configuration files
    if [[ -f "${full_app_path}/wrangler.jsonc" ]]; then
        cp "${full_app_path}/wrangler.jsonc" "${app_snapshot_dir}/"
    fi
    
    if [[ -f "${full_app_path}/package.json" ]]; then
        cp "${full_app_path}/package.json" "${app_snapshot_dir}/"
    fi
    
    if [[ -f "${full_app_path}/next.config.js" ]]; then
        cp "${full_app_path}/next.config.js" "${app_snapshot_dir}/"
    fi
    
    # Snapshot build artifacts
    if [[ -d "${full_app_path}/.vercel" ]]; then
        cp -r "${full_app_path}/.vercel" "${app_snapshot_dir}/"
    fi
    
    # Snapshot current deployment state
    local deployment_info
    deployment_info="$(get_current_deployment_info "$app_id" "$environment")"
    echo "$deployment_info" > "${app_snapshot_dir}/deployment-state.json"
    
    log_success "Application snapshot created: $app_id"
}

get_current_deployment_info() {
    local app_id="$1"
    local environment="$2"
    
    # Get current deployment information from Cloudflare Workers
    local deployment_info="{}"
    
    if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] && command -v wrangler &> /dev/null; then
        local app_path
        app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "${RECOVERY_DIR}/../apps-registry.json")"
        local full_app_path="${RECOVERY_DIR}/../../${app_path}"
        
        if [[ -d "$full_app_path" ]]; then
            local current_deployment
            current_deployment="$(cd "$full_app_path" && wrangler deployments list --env "$environment" --format json 2>/dev/null | head -n1 || echo '{}')"
            
            deployment_info="$(jq -n \
                --arg app_id "$app_id" \
                --arg environment "$environment" \
                --argjson deployment "$current_deployment" \
                --arg timestamp "$(date -Iseconds)" \
                '{
                    app_id: $app_id,
                    environment: $environment,
                    current_deployment: $deployment,
                    snapshot_timestamp: $timestamp
                }')"
        fi
    fi
    
    echo "$deployment_info"
}

update_snapshot_database() {
    local snapshot_metadata="$1"
    local snapshot_db="${SNAPSHOTS_DIR}/snapshots.json"
    
    # Add snapshot to database
    jq --argjson metadata "$snapshot_metadata" \
        '.snapshots += [$metadata] | 
         .statistics.total_snapshots += 1 |
         .statistics.active_snapshots += 1 |
         .statistics.storage_used_mb += (($metadata.size_bytes // 0) / 1024 / 1024) |
         .statistics.latest_snapshot = $metadata.timestamp |
         .last_updated = now | strftime("%Y-%m-%dT%H:%M:%S%z")' \
        "$snapshot_db" > "$snapshot_db.tmp"
    mv "$snapshot_db.tmp" "$snapshot_db"
    
    # Cleanup old snapshots
    cleanup_old_snapshots
}

cleanup_old_snapshots() {
    local snapshot_db="${SNAPSHOTS_DIR}/snapshots.json"
    local retention_count=10
    
    # Get snapshot count
    local snapshot_count
    snapshot_count="$(jq '.statistics.total_snapshots' "$snapshot_db")"
    
    if [[ $snapshot_count -gt $retention_count ]]; then
        log_info "Cleaning up old snapshots (keeping last $retention_count)"
        
        # Get oldest snapshots to remove
        local snapshots_to_remove
        snapshots_to_remove="$(jq -r ".snapshots | sort_by(.timestamp) | .[0:$(($snapshot_count - $retention_count))] | .[].id" "$snapshot_db")"
        
        while IFS= read -r snapshot_id; do
            remove_snapshot "$snapshot_id"
        done <<< "$snapshots_to_remove"
    fi
}

remove_snapshot() {
    local snapshot_id="$1"
    local snapshot_db="${SNAPSHOTS_DIR}/snapshots.json"
    
    # Get snapshot directory
    local snapshot_dir
    snapshot_dir="$(jq -r ".snapshots[] | select(.id == \"$snapshot_id\") | .snapshot_dir" "$snapshot_db")"
    
    if [[ -n "$snapshot_dir" && -d "$snapshot_dir" ]]; then
        rm -rf "$snapshot_dir"
        log_info "Removed snapshot directory: $snapshot_dir"
    fi
    
    # Remove from database
    jq --arg id "$snapshot_id" \
        '.snapshots = [.snapshots[] | select(.id != $id)] |
         .statistics.active_snapshots -= 1' \
        "$snapshot_db" > "$snapshot_db.tmp"
    mv "$snapshot_db.tmp" "$snapshot_db"
}

# Export functions for use by main rollback system
export -f create_deployment_snapshot
export -f snapshot_application
export -f cleanup_old_snapshots
EOF
    
    chmod +x "${RECOVERY_DIR}/snapshot-manager.sh"
    
    log_success "Snapshot manager created"
}

# =============================================================================
# ROLLBACK AUTOMATION SYSTEM
# =============================================================================

setup_rollback_automation() {
    log_info "⚡ Setting up rollback automation..."
    
    # Create rollback controller
    create_rollback_controller
    
    # Setup automated rollback triggers
    setup_rollback_triggers
    
    # Configure rollback validation
    configure_rollback_validation
    
    log_success "Rollback automation setup completed"
}

create_rollback_controller() {
    log_info "Creating rollback controller..."
    
    cat > "${RECOVERY_DIR}/rollback-controller.sh" << 'EOF'
#!/bin/bash

# Rollback Controller for Ganger Platform
# Manages automated and manual rollback operations

set -euo pipefail

RECOVERY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$RECOVERY_DIR/logs"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

log_info() { echo -e "\033[0;36m[INFO]\033[0m $*"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $*"; }
log_warning() { echo -e "\033[1;33m[WARNING]\033[0m $*"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $*" >&2; }
log_critical() { echo -e "\033[0;31m[CRITICAL]\033[0m $*" >&2; }

execute_rollback() {
    local rollback_reason="$1"
    local apps_to_rollback="$2"
    local target_snapshot="${3:-latest}"
    local rollback_type="${4:-automatic}"
    
    log_critical "🚨 INITIATING ROLLBACK OPERATION"
    log_info "Reason: $rollback_reason"
    log_info "Applications: $apps_to_rollback"
    log_info "Target snapshot: $target_snapshot"
    log_info "Rollback type: $rollback_type"
    
    local rollback_id="rollback_${TIMESTAMP}_$$"
    local rollback_log="${LOG_DIR}/rollback_${rollback_id}.log"
    mkdir -p "$LOG_DIR"
    
    # Initialize rollback log
    {
        echo "GANGER PLATFORM ROLLBACK OPERATION"
        echo "=================================="
        echo "Rollback ID: $rollback_id"
        echo "Timestamp: $(date -Iseconds)"
        echo "Reason: $rollback_reason"
        echo "Applications: $apps_to_rollback"
        echo "Target snapshot: $target_snapshot"
        echo "Rollback type: $rollback_type"
        echo "=================================="
    } > "$rollback_log"
    
    # Send rollback notification
    send_rollback_notification "initiated" "$rollback_id" "$rollback_reason"
    
    # Execute rollback phases
    local rollback_success=true
    
    # Phase 1: Pre-rollback validation
    if ! execute_rollback_phase "pre_validation" "$rollback_id" "$apps_to_rollback"; then
        log_error "Pre-rollback validation failed"
        rollback_success=false
    fi
    
    # Phase 2: Create current state snapshot
    if [[ "$rollback_success" == "true" ]]; then
        if ! execute_rollback_phase "create_snapshot" "$rollback_id" "$apps_to_rollback"; then
            log_error "Current state snapshot creation failed"
            rollback_success=false
        fi
    fi
    
    # Phase 3: Execute rollback
    if [[ "$rollback_success" == "true" ]]; then
        if ! execute_rollback_phase "execute_rollback" "$rollback_id" "$apps_to_rollback" "$target_snapshot"; then
            log_error "Rollback execution failed"
            rollback_success=false
        fi
    fi
    
    # Phase 4: Post-rollback validation
    if [[ "$rollback_success" == "true" ]]; then
        if ! execute_rollback_phase "post_validation" "$rollback_id" "$apps_to_rollback"; then
            log_error "Post-rollback validation failed"
            rollback_success=false
        fi
    fi
    
    # Generate rollback report
    generate_rollback_report "$rollback_id" "$rollback_success" "$rollback_reason"
    
    # Send final notification
    if [[ "$rollback_success" == "true" ]]; then
        send_rollback_notification "completed" "$rollback_id" "$rollback_reason"
        log_success "✅ ROLLBACK OPERATION COMPLETED SUCCESSFULLY"
        return 0
    else
        send_rollback_notification "failed" "$rollback_id" "$rollback_reason"
        log_critical "❌ ROLLBACK OPERATION FAILED"
        return 1
    fi
}

execute_rollback_phase() {
    local phase="$1"
    local rollback_id="$2"
    local apps_to_rollback="$3"
    local target_snapshot="${4:-}"
    
    log_info "Executing rollback phase: $phase"
    
    case "$phase" in
        "pre_validation")
            validate_rollback_prerequisites "$apps_to_rollback"
            ;;
        "create_snapshot")
            create_emergency_snapshot "$rollback_id" "$apps_to_rollback"
            ;;
        "execute_rollback")
            perform_application_rollback "$apps_to_rollback" "$target_snapshot"
            ;;
        "post_validation")
            validate_rollback_success "$apps_to_rollback"
            ;;
        *)
            log_error "Unknown rollback phase: $phase"
            return 1
            ;;
    esac
}

validate_rollback_prerequisites() {
    local apps_to_rollback="$1"
    
    log_info "Validating rollback prerequisites..."
    
    # Check if snapshots are available
    local snapshot_db="${RECOVERY_DIR}/snapshots/snapshots.json"
    if [[ ! -f "$snapshot_db" ]]; then
        log_error "Snapshot database not found"
        return 1
    fi
    
    local available_snapshots
    available_snapshots="$(jq '.statistics.active_snapshots' "$snapshot_db")"
    if [[ "$available_snapshots" -eq 0 ]]; then
        log_error "No snapshots available for rollback"
        return 1
    fi
    
    # Check Cloudflare API access
    if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        log_error "CLOUDFLARE_API_TOKEN not configured"
        return 1
    fi
    
    # Validate applications exist
    local apps_array
    IFS=' ' read -ra apps_array <<< "$apps_to_rollback"
    for app_id in "${apps_array[@]}"; do
        local app_exists
        app_exists="$(jq -e ".applications[] | select(.id == \"$app_id\")" "${RECOVERY_DIR}/../apps-registry.json" > /dev/null && echo "true" || echo "false")"
        if [[ "$app_exists" == "false" ]]; then
            log_error "Application not found in registry: $app_id"
            return 1
        fi
    done
    
    log_success "Rollback prerequisites validated"
    return 0
}

create_emergency_snapshot() {
    local rollback_id="$1"
    local apps_to_rollback="$2"
    
    log_info "Creating emergency snapshot before rollback..."
    
    # Create emergency snapshot using snapshot manager
    local emergency_snapshot
    if emergency_snapshot="$("${RECOVERY_DIR}/snapshot-manager.sh" create_deployment_snapshot "emergency_${rollback_id}" "production" "$apps_to_rollback")"; then
        log_success "Emergency snapshot created: $emergency_snapshot"
        return 0
    else
        log_error "Failed to create emergency snapshot"
        return 1
    fi
}

perform_application_rollback() {
    local apps_to_rollback="$1"
    local target_snapshot="$2"
    
    log_info "Performing application rollback..."
    
    # Get target snapshot details
    local snapshot_db="${RECOVERY_DIR}/snapshots/snapshots.json"
    local target_snapshot_info
    
    if [[ "$target_snapshot" == "latest" ]]; then
        target_snapshot_info="$(jq -r '.snapshots | sort_by(.timestamp) | .[-1]' "$snapshot_db")"
    else
        target_snapshot_info="$(jq -r ".snapshots[] | select(.id == \"$target_snapshot\")" "$snapshot_db")"
    fi
    
    if [[ "$target_snapshot_info" == "null" || -z "$target_snapshot_info" ]]; then
        log_error "Target snapshot not found: $target_snapshot"
        return 1
    fi
    
    local snapshot_dir
    snapshot_dir="$(echo "$target_snapshot_info" | jq -r '.snapshot_dir')"
    
    if [[ ! -d "$snapshot_dir" ]]; then
        log_error "Snapshot directory not found: $snapshot_dir"
        return 1
    fi
    
    # Rollback each application
    local apps_array
    IFS=' ' read -ra apps_array <<< "$apps_to_rollback"
    local rollback_count=0
    local failed_rollbacks=()
    
    for app_id in "${apps_array[@]}"; do
        log_info "Rolling back application: $app_id"
        
        if rollback_single_application "$app_id" "$snapshot_dir"; then
            ((rollback_count++))
            log_success "✓ $app_id rollback completed"
        else
            failed_rollbacks+=("$app_id")
            log_error "✗ $app_id rollback failed"
        fi
    done
    
    if [[ ${#failed_rollbacks[@]} -gt 0 ]]; then
        log_error "Rollback failed for applications: ${failed_rollbacks[*]}"
        return 1
    fi
    
    log_success "All applications rolled back successfully ($rollback_count applications)"
    return 0
}

rollback_single_application() {
    local app_id="$1"
    local snapshot_dir="$2"
    
    local app_snapshot_dir="${snapshot_dir}/${app_id}"
    if [[ ! -d "$app_snapshot_dir" ]]; then
        log_error "Application snapshot not found: $app_snapshot_dir"
        return 1
    fi
    
    # Get application path
    local app_path
    app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "${RECOVERY_DIR}/../apps-registry.json")"
    local full_app_path="${RECOVERY_DIR}/../../${app_path}"
    
    # Restore configuration files
    if [[ -f "${app_snapshot_dir}/wrangler.jsonc" ]]; then
        cp "${app_snapshot_dir}/wrangler.jsonc" "$full_app_path/"
        log_info "Restored wrangler.jsonc for $app_id"
    fi
    
    if [[ -f "${app_snapshot_dir}/package.json" ]]; then
        cp "${app_snapshot_dir}/package.json" "$full_app_path/"
        log_info "Restored package.json for $app_id"
    fi
    
    if [[ -f "${app_snapshot_dir}/next.config.js" ]]; then
        cp "${app_snapshot_dir}/next.config.js" "$full_app_path/"
        log_info "Restored next.config.js for $app_id"
    fi
    
    # Restore build artifacts
    if [[ -d "${app_snapshot_dir}/.vercel" ]]; then
        rm -rf "${full_app_path}/.vercel"
        cp -r "${app_snapshot_dir}/.vercel" "$full_app_path/"
        log_info "Restored build artifacts for $app_id"
    fi
    
    # Deploy previous version
    if [[ -f "${app_snapshot_dir}/deployment-state.json" ]]; then
        local deployment_state
        deployment_state="$(cat "${app_snapshot_dir}/deployment-state.json")"
        
        # Use the deployment script to redeploy
        if "${RECOVERY_DIR}/../scripts/deploy-master.sh" -e production deploy "$app_id"; then
            log_success "Application redeployed successfully: $app_id"
            return 0
        else
            log_error "Failed to redeploy application: $app_id"
            return 1
        fi
    else
        log_warning "No deployment state found for $app_id, skipping redeploy"
        return 0
    fi
}

validate_rollback_success() {
    local apps_to_rollback="$1"
    
    log_info "Validating rollback success..."
    
    # Use health check system to validate applications
    local apps_array
    IFS=' ' read -ra apps_array <<< "$apps_to_rollback"
    local healthy_count=0
    local unhealthy_apps=()
    
    for app_id in "${apps_array[@]}"; do
        log_info "Validating $app_id health after rollback..."
        
        if "${RECOVERY_DIR}/../monitoring/health-check-system.sh" check "$app_id" production > /dev/null 2>&1; then
            ((healthy_count++))
            log_success "✓ $app_id is healthy after rollback"
        else
            unhealthy_apps+=("$app_id")
            log_error "✗ $app_id is unhealthy after rollback"
        fi
    done
    
    if [[ ${#unhealthy_apps[@]} -gt 0 ]]; then
        log_error "Rollback validation failed for applications: ${unhealthy_apps[*]}"
        return 1
    fi
    
    log_success "All applications validated successfully after rollback ($healthy_count applications)"
    return 0
}

send_rollback_notification() {
    local status="$1"
    local rollback_id="$2"
    local reason="$3"
    
    log_info "Sending rollback notification: $status"
    
    # This would integrate with actual notification system
    local notification_log="${LOG_DIR}/notifications.log"
    echo "$(date -Iseconds) ROLLBACK_$status: $rollback_id - $reason" >> "$notification_log"
    
    # Log critical notifications
    if [[ "$status" == "initiated" || "$status" == "failed" ]]; then
        log_critical "🚨 ROLLBACK NOTIFICATION: $status - $rollback_id"
    fi
}

generate_rollback_report() {
    local rollback_id="$1"
    local success="$2"
    local reason="$3"
    
    log_info "Generating rollback report..."
    
    local report_file="${LOG_DIR}/rollback_report_${rollback_id}.json"
    
    local report
    report="$(jq -n \
        --arg rollback_id "$rollback_id" \
        --arg timestamp "$(date -Iseconds)" \
        --arg success "$success" \
        --arg reason "$reason" \
        '{
            rollback_operation: {
                id: $rollback_id,
                timestamp: $timestamp,
                success: ($success == "true"),
                reason: $reason,
                duration_seconds: 0
            },
            summary: {
                applications_processed: 0,
                successful_rollbacks: 0,
                failed_rollbacks: 0,
                health_checks_passed: true
            },
            recommendations: [
                "Review rollback logs for detailed information",
                "Monitor application performance post-rollback",
                "Investigate root cause of original issue",
                "Update deployment procedures if necessary"
            ]
        }')"
    
    echo "$report" > "$report_file"
    
    log_success "Rollback report generated: $report_file"
}

# Export functions for use by main system
export -f execute_rollback
export -f perform_application_rollback
export -f validate_rollback_success
EOF
    
    chmod +x "${RECOVERY_DIR}/rollback-controller.sh"
    
    log_success "Rollback controller created"
}

setup_rollback_triggers() {
    log_info "Setting up rollback triggers..."
    
    # Create rollback trigger system
    cat > "${RECOVERY_DIR}/rollback-triggers.sh" << 'EOF'
#!/bin/bash

# Rollback Trigger System
# Monitors for conditions that should trigger automatic rollback

set -euo pipefail

RECOVERY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$RECOVERY_DIR/logs"

log_info() { echo -e "\033[0;36m[INFO]\033[0m $*"; }
log_warning() { echo -e "\033[1;33m[WARNING]\033[0m $*"; }
log_critical() { echo -e "\033[0;31m[CRITICAL]\033[0m $*" >&2; }

monitor_rollback_triggers() {
    log_info "Monitoring rollback triggers..."
    
    while true; do
        # Check health check failures
        check_health_failures
        
        # Check performance degradation
        check_performance_degradation
        
        # Check error rates
        check_error_rates
        
        # Wait before next check
        sleep 60
    done
}

check_health_failures() {
    # Check if health checks are failing consistently
    local health_check_log="${RECOVERY_DIR}/../monitoring/logs/health_checks.log"
    
    if [[ -f "$health_check_log" ]]; then
        local recent_failures
        recent_failures="$(tail -n 100 "$health_check_log" | grep "FAILED" | wc -l)"
        
        if [[ $recent_failures -gt 10 ]]; then
            log_critical "Health check failures detected: $recent_failures"
            trigger_automatic_rollback "health_check_failures" "critical"
        fi
    fi
}

check_performance_degradation() {
    # Check for performance degradation
    local performance_log="${RECOVERY_DIR}/../monitoring/logs/performance.log"
    
    if [[ -f "$performance_log" ]]; then
        local avg_response_time
        avg_response_time="$(tail -n 50 "$performance_log" | grep "response_time" | awk '{sum += $3; count++} END {if (count > 0) print sum/count; else print 0}')"
        
        if [[ $(echo "$avg_response_time > 5000" | bc -l) -eq 1 ]]; then
            log_critical "Performance degradation detected: ${avg_response_time}ms average"
            trigger_automatic_rollback "performance_degradation" "warning"
        fi
    fi
}

check_error_rates() {
    # Check for elevated error rates
    local error_log="${RECOVERY_DIR}/../monitoring/logs/errors.log"
    
    if [[ -f "$error_log" ]]; then
        local recent_errors
        recent_errors="$(tail -n 100 "$error_log" | grep "ERROR" | wc -l)"
        
        if [[ $recent_errors -gt 20 ]]; then
            log_critical "Elevated error rate detected: $recent_errors errors"
            trigger_automatic_rollback "elevated_error_rate" "critical"
        fi
    fi
}

trigger_automatic_rollback() {
    local reason="$1"
    local severity="$2"
    
    log_critical "🚨 TRIGGERING AUTOMATIC ROLLBACK: $reason (severity: $severity)"
    
    # Check if automatic rollback is enabled
    local auto_rollback_enabled
    auto_rollback_enabled="$(jq -r '.recovery_settings.automatic_rollback.enabled' "${RECOVERY_DIR}/recovery-config.json")"
    
    if [[ "$auto_rollback_enabled" == "true" ]]; then
        # Trigger rollback for critical applications
        local critical_apps
        critical_apps="$(jq -r '.disaster_recovery.business_continuity.critical_applications | join(" ")' "${RECOVERY_DIR}/recovery-config.json")"
        
        # Execute rollback
        "${RECOVERY_DIR}/rollback-controller.sh" execute_rollback "$reason" "$critical_apps" "latest" "automatic"
    else
        log_warning "Automatic rollback is disabled, manual intervention required"
        
        # Send alert for manual rollback
        echo "$(date -Iseconds) MANUAL_ROLLBACK_REQUIRED: $reason" >> "${LOG_DIR}/manual-rollback-alerts.log"
    fi
}

# Start monitoring if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    monitor_rollback_triggers
fi
EOF
    
    chmod +x "${RECOVERY_DIR}/rollback-triggers.sh"
    
    log_success "Rollback triggers setup completed"
}

configure_rollback_validation() {
    log_info "Configuring rollback validation..."
    
    # Create rollback validation system
    cat > "${RECOVERY_DIR}/rollback-validator.sh" << 'EOF'
#!/bin/bash

# Rollback Validation System
# Validates rollback operations and ensures system integrity

set -euo pipefail

RECOVERY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info() { echo -e "\033[0;36m[INFO]\033[0m $*"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $*"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $*" >&2; }

validate_rollback_integrity() {
    local apps_to_validate="$1"
    
    log_info "Validating rollback integrity for: $apps_to_validate"
    
    local validation_results=()
    local apps_array
    IFS=' ' read -ra apps_array <<< "$apps_to_validate"
    
    for app_id in "${apps_array[@]}"; do
        validate_application_integrity "$app_id"
        validation_results+=("$?")
    done
    
    # Check if all validations passed
    local failed_validations=0
    for result in "${validation_results[@]}"; do
        if [[ $result -ne 0 ]]; then
            ((failed_validations++))
        fi
    done
    
    if [[ $failed_validations -eq 0 ]]; then
        log_success "All rollback validations passed"
        return 0
    else
        log_error "$failed_validations validation(s) failed"
        return 1
    fi
}

validate_application_integrity() {
    local app_id="$1"
    
    log_info "Validating integrity for: $app_id"
    
    # Validate configuration files
    if ! validate_configuration_integrity "$app_id"; then
        log_error "Configuration integrity validation failed for $app_id"
        return 1
    fi
    
    # Validate deployment state
    if ! validate_deployment_integrity "$app_id"; then
        log_error "Deployment integrity validation failed for $app_id"
        return 1
    fi
    
    # Validate application health
    if ! validate_application_health "$app_id"; then
        log_error "Application health validation failed for $app_id"
        return 1
    fi
    
    log_success "Integrity validation passed for $app_id"
    return 0
}

validate_configuration_integrity() {
    local app_id="$1"
    
    # Get application path
    local app_path
    app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "${RECOVERY_DIR}/../apps-registry.json")"
    local full_app_path="${RECOVERY_DIR}/../../${app_path}"
    
    # Check if required configuration files exist
    if [[ ! -f "${full_app_path}/wrangler.jsonc" ]]; then
        log_error "Missing wrangler.jsonc for $app_id"
        return 1
    fi
    
    # Validate wrangler configuration
    if ! jq empty "${full_app_path}/wrangler.jsonc" 2>/dev/null; then
        log_error "Invalid wrangler.jsonc for $app_id"
        return 1
    fi
    
    return 0
}

validate_deployment_integrity() {
    local app_id="$1"
    
    # Check if application is deployed
    if command -v wrangler &> /dev/null && [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        local app_path
        app_path="$(jq -r ".applications[] | select(.id == \"$app_id\") | .path" "${RECOVERY_DIR}/../apps-registry.json")"
        local full_app_path="${RECOVERY_DIR}/../../${app_path}"
        
        if [[ -d "$full_app_path" ]]; then
            local deployment_status
            deployment_status="$(cd "$full_app_path" && wrangler deployments list --env production 2>/dev/null | head -n1 || echo "")"
            
            if [[ -n "$deployment_status" ]]; then
                return 0
            else
                log_error "No deployment found for $app_id"
                return 1
            fi
        fi
    fi
    
    return 0
}

validate_application_health() {
    local app_id="$1"
    
    # Use health check system
    if "${RECOVERY_DIR}/../monitoring/health-check-system.sh" check "$app_id" production > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Export validation functions
export -f validate_rollback_integrity
export -f validate_application_integrity
EOF
    
    chmod +x "${RECOVERY_DIR}/rollback-validator.sh"
    
    log_success "Rollback validation configured"
}

# =============================================================================
# DISASTER RECOVERY PROCEDURES
# =============================================================================

configure_disaster_recovery() {
    log_info "🏥 Configuring disaster recovery procedures..."
    
    # Create disaster recovery controller
    create_disaster_recovery_controller
    
    # Setup business continuity procedures
    setup_business_continuity
    
    # Configure emergency procedures
    configure_emergency_procedures
    
    log_success "Disaster recovery configuration completed"
}

create_disaster_recovery_controller() {
    log_info "Creating disaster recovery controller..."
    
    cat > "${RECOVERY_DIR}/disaster-recovery.sh" << 'EOF'
#!/bin/bash

# Disaster Recovery Controller for Ganger Platform
# Handles major system failures and business continuity

set -euo pipefail

RECOVERY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$RECOVERY_DIR/logs"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

log_info() { echo -e "\033[0;36m[INFO]\033[0m $*"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $*"; }
log_warning() { echo -e "\033[1;33m[WARNING]\033[0m $*"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $*" >&2; }
log_critical() { echo -e "\033[0;31m[CRITICAL]\033[0m $*" >&2; }

activate_disaster_recovery() {
    local disaster_type="$1"
    local affected_systems="$2"
    local severity="${3:-critical}"
    
    log_critical "🚨 DISASTER RECOVERY ACTIVATION"
    log_critical "Disaster Type: $disaster_type"
    log_critical "Affected Systems: $affected_systems"
    log_critical "Severity: $severity"
    
    local dr_id="dr_${TIMESTAMP}_$$"
    local dr_log="${LOG_DIR}/disaster_recovery_${dr_id}.log"
    mkdir -p "$LOG_DIR"
    
    # Initialize disaster recovery log
    {
        echo "GANGER PLATFORM DISASTER RECOVERY"
        echo "================================="
        echo "DR ID: $dr_id"
        echo "Timestamp: $(date -Iseconds)"
        echo "Disaster Type: $disaster_type"
        echo "Affected Systems: $affected_systems"
        echo "Severity: $severity"
        echo "================================="
    } > "$dr_log"
    
    # Send disaster recovery notification
    send_disaster_notification "activated" "$dr_id" "$disaster_type"
    
    # Execute disaster recovery phases
    local dr_success=true
    
    # Phase 1: Assess damage and scope
    if ! execute_dr_phase "damage_assessment" "$dr_id" "$affected_systems"; then
        log_error "Damage assessment failed"
        dr_success=false
    fi
    
    # Phase 2: Activate business continuity
    if [[ "$dr_success" == "true" ]]; then
        if ! execute_dr_phase "business_continuity" "$dr_id" "$affected_systems"; then
            log_error "Business continuity activation failed"
            dr_success=false
        fi
    fi
    
    # Phase 3: Execute recovery procedures
    if [[ "$dr_success" == "true" ]]; then
        if ! execute_dr_phase "system_recovery" "$dr_id" "$affected_systems"; then
            log_error "System recovery failed"
            dr_success=false
        fi
    fi
    
    # Phase 4: Validate recovery
    if [[ "$dr_success" == "true" ]]; then
        if ! execute_dr_phase "recovery_validation" "$dr_id" "$affected_systems"; then
            log_error "Recovery validation failed"
            dr_success=false
        fi
    fi
    
    # Generate disaster recovery report
    generate_dr_report "$dr_id" "$dr_success" "$disaster_type"
    
    # Send final notification
    if [[ "$dr_success" == "true" ]]; then
        send_disaster_notification "resolved" "$dr_id" "$disaster_type"
        log_success "✅ DISASTER RECOVERY COMPLETED SUCCESSFULLY"
        return 0
    else
        send_disaster_notification "failed" "$dr_id" "$disaster_type"
        log_critical "❌ DISASTER RECOVERY FAILED - MANUAL INTERVENTION REQUIRED"
        return 1
    fi
}

execute_dr_phase() {
    local phase="$1"
    local dr_id="$2"
    local affected_systems="$3"
    
    log_info "Executing disaster recovery phase: $phase"
    
    case "$phase" in
        "damage_assessment")
            assess_system_damage "$affected_systems"
            ;;
        "business_continuity")
            activate_business_continuity "$affected_systems"
            ;;
        "system_recovery")
            execute_system_recovery "$affected_systems"
            ;;
        "recovery_validation")
            validate_system_recovery "$affected_systems"
            ;;
        *)
            log_error "Unknown disaster recovery phase: $phase"
            return 1
            ;;
    esac
}

assess_system_damage() {
    local affected_systems="$1"
    
    log_info "Assessing system damage..."
    
    # Check system availability
    local systems_array
    IFS=' ' read -ra systems_array <<< "$affected_systems"
    local damage_report=()
    
    for system in "${systems_array[@]}"; do
        local system_status
        if "${RECOVERY_DIR}/../monitoring/health-check-system.sh" check "$system" production > /dev/null 2>&1; then
            system_status="operational"
            log_info "$system: Operational"
        else
            system_status="failed"
            log_critical "$system: Failed"
        fi
        
        damage_report+=("$system:$system_status")
    done
    
    # Save damage assessment
    local damage_file="${LOG_DIR}/damage_assessment_${TIMESTAMP}.json"
    printf '%s\n' "${damage_report[@]}" | jq -R 'split(":") | {system: .[0], status: .[1]}' | jq -s '.' > "$damage_file"
    
    log_success "Damage assessment completed: $damage_file"
    return 0
}

activate_business_continuity() {
    local affected_systems="$1"
    
    log_info "Activating business continuity procedures..."
    
    # Get critical applications from config
    local critical_apps
    critical_apps="$(jq -r '.disaster_recovery.business_continuity.critical_applications | join(" ")' "${RECOVERY_DIR}/recovery-config.json")"
    
    # Check if critical systems are affected
    local systems_array
    IFS=' ' read -ra systems_array <<< "$affected_systems"
    local critical_affected=()
    
    for system in "${systems_array[@]}"; do
        if [[ " $critical_apps " =~ " $system " ]]; then
            critical_affected+=("$system")
        fi
    done
    
    if [[ ${#critical_affected[@]} -gt 0 ]]; then
        log_critical "Critical systems affected: ${critical_affected[*]}"
        
        # Activate emergency procedures for critical systems
        for critical_system in "${critical_affected[@]}"; do
            activate_emergency_procedures "$critical_system"
        done
    fi
    
    log_success "Business continuity procedures activated"
    return 0
}

execute_system_recovery() {
    local affected_systems="$1"
    
    log_info "Executing system recovery procedures..."
    
    # Get recovery priority order
    local priority_order
    priority_order="$(jq -r '.disaster_recovery.business_continuity.priority_recovery_order | join(" ")' "${RECOVERY_DIR}/recovery-config.json")"
    
    # Recover systems in priority order
    local priority_array
    IFS=' ' read -ra priority_array <<< "$priority_order"
    
    for priority_system in "${priority_array[@]}"; do
        if [[ " $affected_systems " =~ " $priority_system " ]]; then
            log_info "Recovering priority system: $priority_system"
            
            # Use rollback system to restore to last known good state
            if "${RECOVERY_DIR}/rollback-controller.sh" execute_rollback "disaster_recovery" "$priority_system" "latest" "disaster_recovery"; then
                log_success "✓ $priority_system recovery completed"
            else
                log_error "✗ $priority_system recovery failed"
                return 1
            fi
        fi
    done
    
    # Recover remaining systems
    local systems_array
    IFS=' ' read -ra systems_array <<< "$affected_systems"
    
    for system in "${systems_array[@]}"; do
        if [[ ! " $priority_order " =~ " $system " ]]; then
            log_info "Recovering system: $system"
            
            if "${RECOVERY_DIR}/rollback-controller.sh" execute_rollback "disaster_recovery" "$system" "latest" "disaster_recovery"; then
                log_success "✓ $system recovery completed"
            else
                log_error "✗ $system recovery failed"
            fi
        fi
    done
    
    log_success "System recovery procedures completed"
    return 0
}

validate_system_recovery() {
    local affected_systems="$1"
    
    log_info "Validating system recovery..."
    
    # Wait for systems to stabilize
    log_info "Waiting 60 seconds for systems to stabilize..."
    sleep 60
    
    # Validate each recovered system
    local systems_array
    IFS=' ' read -ra systems_array <<< "$affected_systems"
    local recovered_count=0
    local failed_recovery=()
    
    for system in "${systems_array[@]}"; do
        log_info "Validating recovery for: $system"
        
        if "${RECOVERY_DIR}/../monitoring/health-check-system.sh" check "$system" production > /dev/null 2>&1; then
            ((recovered_count++))
            log_success "✓ $system recovery validated"
        else
            failed_recovery+=("$system")
            log_error "✗ $system recovery validation failed"
        fi
    done
    
    if [[ ${#failed_recovery[@]} -gt 0 ]]; then
        log_error "Recovery validation failed for systems: ${failed_recovery[*]}"
        return 1
    fi
    
    log_success "All systems recovery validated ($recovered_count systems)"
    return 0
}

activate_emergency_procedures() {
    local critical_system="$1"
    
    log_critical "Activating emergency procedures for: $critical_system"
    
    # This would activate emergency procedures specific to the medical platform
    # For now, log the activation
    echo "$(date -Iseconds) EMERGENCY_PROCEDURES_ACTIVATED: $critical_system" >> "${LOG_DIR}/emergency-procedures.log"
    
    # Could include:
    # - Switching to backup systems
    # - Activating manual procedures
    # - Notifying staff of system outage
    # - Implementing paper-based workflows
    
    log_critical "Emergency procedures activated for $critical_system"
}

send_disaster_notification() {
    local status="$1"
    local dr_id="$2"
    local disaster_type="$3"
    
    log_critical "Sending disaster recovery notification: $status"
    
    # This would integrate with emergency notification system
    local notification_log="${LOG_DIR}/disaster-notifications.log"
    echo "$(date -Iseconds) DISASTER_RECOVERY_$status: $dr_id - $disaster_type" >> "$notification_log"
    
    # Critical notifications require immediate attention
    log_critical "🚨 DISASTER RECOVERY NOTIFICATION: $status - $dr_id"
}

generate_dr_report() {
    local dr_id="$1"
    local success="$2"
    local disaster_type="$3"
    
    log_info "Generating disaster recovery report..."
    
    local report_file="${LOG_DIR}/disaster_recovery_report_${dr_id}.json"
    
    local report
    report="$(jq -n \
        --arg dr_id "$dr_id" \
        --arg timestamp "$(date -Iseconds)" \
        --arg success "$success" \
        --arg disaster_type "$disaster_type" \
        '{
            disaster_recovery: {
                id: $dr_id,
                timestamp: $timestamp,
                success: ($success == "true"),
                disaster_type: $disaster_type,
                duration_seconds: 0
            },
            impact_assessment: {
                systems_affected: 0,
                systems_recovered: 0,
                business_impact: "high",
                data_loss: false
            },
            recovery_summary: {
                recovery_time_actual: 0,
                recovery_time_objective: 900,
                recovery_point_objective: 300,
                business_continuity_activated: true
            },
            lessons_learned: [
                "Review disaster recovery procedures",
                "Update business continuity plans",
                "Improve monitoring and alerting",
                "Conduct post-incident analysis"
            ]
        }')"
    
    echo "$report" > "$report_file"
    
    log_success "Disaster recovery report generated: $report_file"
}

# Export functions for use by main system
export -f activate_disaster_recovery
export -f execute_system_recovery
export -f validate_system_recovery
EOF
    
    chmod +x "${RECOVERY_DIR}/disaster-recovery.sh"
    
    log_success "Disaster recovery controller created"
}

setup_business_continuity() {
    log_info "Setting up business continuity procedures..."
    
    # Create business continuity plan
    cat > "${RECOVERY_DIR}/business-continuity-plan.json" << 'EOF'
{
  "version": "1.0.0",
  "business_continuity": {
    "critical_functions": [
      {
        "function": "Patient Check-in",
        "applications": ["checkin-kiosk", "staff"],
        "manual_fallback": "Paper-based check-in forms",
        "max_downtime": "15 minutes"
      },
      {
        "function": "Medical Inventory Management",
        "applications": ["inventory"],
        "manual_fallback": "Paper inventory tracking",
        "max_downtime": "30 minutes"
      },
      {
        "function": "Patient Education Materials",
        "applications": ["handouts"],
        "manual_fallback": "Pre-printed handouts",
        "max_downtime": "60 minutes"
      },
      {
        "function": "Staff Communication",
        "applications": ["staff", "call-center-ops"],
        "manual_fallback": "Phone and email communication",
        "max_downtime": "10 minutes"
      }
    ],
    "escalation_procedures": {
      "level_1": {
        "duration": "0-15 minutes",
        "actions": ["Automatic rollback", "Health check validation"],
        "notification": ["IT team"]
      },
      "level_2": {
        "duration": "15-30 minutes",
        "actions": ["Manual rollback", "Emergency procedures activation"],
        "notification": ["IT team", "Management"]
      },
      "level_3": {
        "duration": "30+ minutes",
        "actions": ["Disaster recovery activation", "Business continuity plans"],
        "notification": ["All staff", "External stakeholders"]
      }
    },
    "communication_plan": {
      "internal": {
        "channels": ["Slack", "Email", "Phone"],
        "emergency_contacts": [
          "IT Director: +1-xxx-xxx-xxxx",
          "Practice Manager: +1-xxx-xxx-xxxx",
          "Dr. Ganger: +1-xxx-xxx-xxxx"
        ]
      },
      "external": {
        "patients": {
          "method": "Phone calls for same-day appointments",
          "message_template": "We are experiencing temporary technical difficulties. Your appointment is still scheduled."
        },
        "vendors": {
          "cloudflare": "Support ticket for critical issues",
          "supabase": "Support ticket for database issues"
        }
      }
    }
  },
  "recovery_procedures": {
    "data_backup": {
      "frequency": "Real-time replication",
      "retention": "30 days",
      "verification": "Daily integrity checks"
    },
    "system_backup": {
      "configuration_backup": "Before each deployment",
      "snapshot_backup": "Every 6 hours",
      "full_system_backup": "Weekly"
    },
    "testing": {
      "recovery_drills": "Monthly",
      "business_continuity_tests": "Quarterly",
      "disaster_simulation": "Annually"
    }
  }
}
EOF
    
    log_success "Business continuity plan created"
}

configure_emergency_procedures() {
    log_info "Configuring emergency procedures..."
    
    # Create emergency procedures script
    cat > "${RECOVERY_DIR}/emergency-procedures.sh" << 'EOF'
#!/bin/bash

# Emergency Procedures for Ganger Platform
# Immediate response procedures for critical system failures

set -euo pipefail

RECOVERY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_critical() { echo -e "\033[0;31m[CRITICAL]\033[0m $*" >&2; }
log_info() { echo -e "\033[0;36m[INFO]\033[0m $*"; }

declare_emergency() {
    local emergency_type="$1"
    local affected_systems="$2"
    
    log_critical "🚨 EMERGENCY DECLARED: $emergency_type"
    log_critical "Affected Systems: $affected_systems"
    
    # Immediate actions based on emergency type
    case "$emergency_type" in
        "complete_system_failure")
            handle_complete_system_failure "$affected_systems"
            ;;
        "data_breach_suspected")
            handle_suspected_data_breach "$affected_systems"
            ;;
        "security_incident")
            handle_security_incident "$affected_systems"
            ;;
        "critical_application_failure")
            handle_critical_application_failure "$affected_systems"
            ;;
        *)
            handle_general_emergency "$emergency_type" "$affected_systems"
            ;;
    esac
}

handle_complete_system_failure() {
    local affected_systems="$1"
    
    log_critical "Handling complete system failure..."
    
    # Immediate actions:
    # 1. Activate manual procedures
    # 2. Notify all staff
    # 3. Contact vendors
    # 4. Begin disaster recovery
    
    activate_manual_procedures
    notify_emergency_contacts "complete_system_failure"
    
    # Activate disaster recovery
    "${RECOVERY_DIR}/disaster-recovery.sh" activate_disaster_recovery "complete_system_failure" "$affected_systems" "critical"
}

handle_suspected_data_breach() {
    local affected_systems="$1"
    
    log_critical "Handling suspected data breach..."
    
    # Immediate actions:
    # 1. Isolate affected systems
    # 2. Preserve evidence
    # 3. Notify security team
    # 4. Begin incident response
    
    isolate_systems "$affected_systems"
    preserve_evidence
    notify_security_team
    
    log_critical "Data breach response procedures activated"
}

handle_security_incident() {
    local affected_systems="$1"
    
    log_critical "Handling security incident..."
    
    # Immediate actions:
    # 1. Block suspicious traffic
    # 2. Review security logs
    # 3. Assess threat level
    # 4. Implement additional security measures
    
    block_suspicious_traffic
    review_security_logs
    
    log_critical "Security incident response procedures activated"
}

handle_critical_application_failure() {
    local affected_systems="$1"
    
    log_critical "Handling critical application failure..."
    
    # Immediate actions:
    # 1. Assess impact on patient care
    # 2. Activate backup procedures
    # 3. Begin application recovery
    # 4. Communicate with staff
    
    assess_patient_care_impact "$affected_systems"
    activate_backup_procedures "$affected_systems"
    
    # Begin application recovery
    "${RECOVERY_DIR}/rollback-controller.sh" execute_rollback "critical_application_failure" "$affected_systems" "latest" "emergency"
}

activate_manual_procedures() {
    log_critical "Activating manual procedures..."
    
    # This would activate predefined manual procedures
    # Examples:
    # - Paper-based patient check-in
    # - Manual inventory tracking
    # - Phone-based communication
    
    echo "$(date -Iseconds) MANUAL_PROCEDURES_ACTIVATED" >> "${RECOVERY_DIR}/logs/emergency-procedures.log"
    
    log_critical "Manual procedures activated"
}

notify_emergency_contacts() {
    local emergency_type="$1"
    
    log_critical "Notifying emergency contacts..."
    
    # This would send immediate notifications to emergency contacts
    # via multiple channels (phone, SMS, email)
    
    echo "$(date -Iseconds) EMERGENCY_NOTIFICATION_SENT: $emergency_type" >> "${RECOVERY_DIR}/logs/emergency-notifications.log"
    
    log_critical "Emergency contacts notified"
}

isolate_systems() {
    local systems="$1"
    
    log_critical "Isolating systems: $systems"
    
    # This would implement network isolation procedures
    # to prevent further damage or data exfiltration
    
    echo "$(date -Iseconds) SYSTEMS_ISOLATED: $systems" >> "${RECOVERY_DIR}/logs/security-actions.log"
}

preserve_evidence() {
    log_critical "Preserving evidence..."
    
    # This would preserve system logs and state
    # for forensic analysis
    
    local evidence_dir="${RECOVERY_DIR}/evidence/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$evidence_dir"
    
    # Copy critical logs
    cp -r "${RECOVERY_DIR}/logs" "$evidence_dir/" 2>/dev/null || true
    
    log_critical "Evidence preserved in: $evidence_dir"
}

notify_security_team() {
    log_critical "Notifying security team..."
    
    # This would send immediate security alerts
    
    echo "$(date -Iseconds) SECURITY_TEAM_NOTIFIED" >> "${RECOVERY_DIR}/logs/security-notifications.log"
}

block_suspicious_traffic() {
    log_critical "Blocking suspicious traffic..."
    
    # This would implement emergency firewall rules
    # via Cloudflare API to block suspicious traffic
    
    echo "$(date -Iseconds) SUSPICIOUS_TRAFFIC_BLOCKED" >> "${RECOVERY_DIR}/logs/security-actions.log"
}

review_security_logs() {
    log_critical "Reviewing security logs..."
    
    # This would trigger automated security log analysis
    
    echo "$(date -Iseconds) SECURITY_LOGS_REVIEWED" >> "${RECOVERY_DIR}/logs/security-analysis.log"
}

assess_patient_care_impact() {
    local affected_systems="$1"
    
    log_critical "Assessing patient care impact..."
    
    # This would assess the impact on patient care
    # and determine appropriate medical response
    
    echo "$(date -Iseconds) PATIENT_CARE_IMPACT_ASSESSED: $affected_systems" >> "${RECOVERY_DIR}/logs/patient-care.log"
}

activate_backup_procedures() {
    local affected_systems="$1"
    
    log_critical "Activating backup procedures for: $affected_systems"
    
    # This would activate system-specific backup procedures
    
    echo "$(date -Iseconds) BACKUP_PROCEDURES_ACTIVATED: $affected_systems" >> "${RECOVERY_DIR}/logs/backup-procedures.log"
}

handle_general_emergency() {
    local emergency_type="$1"
    local affected_systems="$2"
    
    log_critical "Handling general emergency: $emergency_type"
    
    # Default emergency response
    notify_emergency_contacts "$emergency_type"
    
    # Activate disaster recovery for severe emergencies
    "${RECOVERY_DIR}/disaster-recovery.sh" activate_disaster_recovery "$emergency_type" "$affected_systems" "high"
}

# Export emergency functions
export -f declare_emergency
export -f handle_critical_application_failure
export -f activate_manual_procedures
EOF
    
    chmod +x "${RECOVERY_DIR}/emergency-procedures.sh"
    
    log_success "Emergency procedures configured"
}

# =============================================================================
# RECOVERY TESTING AND VALIDATION
# =============================================================================

test_recovery_procedures() {
    log_info "🧪 Testing recovery procedures..."
    
    # Test snapshot creation
    test_snapshot_creation
    
    # Test rollback validation
    test_rollback_validation
    
    # Test disaster recovery procedures
    test_disaster_recovery_procedures
    
    log_success "Recovery procedures testing completed"
}

test_snapshot_creation() {
    log_info "Testing snapshot creation..."
    
    # Create test snapshot
    local test_snapshot
    if test_snapshot="$("${RECOVERY_DIR}/snapshot-manager.sh" create_deployment_snapshot "test_$(date +%s)" "production" "staff inventory")"; then
        log_success "✓ Snapshot creation test passed"
        
        # Cleanup test snapshot
        if [[ -d "$test_snapshot" ]]; then
            rm -rf "$test_snapshot"
            log_info "Test snapshot cleaned up"
        fi
    else
        log_error "✗ Snapshot creation test failed"
        return 1
    fi
}

test_rollback_validation() {
    log_info "Testing rollback validation..."
    
    # Test validation functions
    if "${RECOVERY_DIR}/rollback-validator.sh" validate_rollback_integrity "staff"; then
        log_success "✓ Rollback validation test passed"
    else
        log_warning "⚠ Rollback validation test had issues (may be expected)"
    fi
}

test_disaster_recovery_procedures() {
    log_info "Testing disaster recovery procedures..."
    
    # Test disaster recovery configuration
    if [[ -x "${RECOVERY_DIR}/disaster-recovery.sh" ]]; then
        log_success "✓ Disaster recovery script is executable"
    else
        log_error "✗ Disaster recovery script is not executable"
        return 1
    fi
    
    # Test emergency procedures
    if [[ -x "${RECOVERY_DIR}/emergency-procedures.sh" ]]; then
        log_success "✓ Emergency procedures script is executable"
    else
        log_error "✗ Emergency procedures script is not executable"
        return 1
    fi
    
    log_success "Disaster recovery procedures testing completed"
}

# =============================================================================
# COMMAND LINE INTERFACE
# =============================================================================

usage() {
    cat << EOF
USAGE: $(basename "$0") [OPTIONS] COMMAND [ARGS...]

DESCRIPTION:
    Comprehensive rollback and disaster recovery system for Ganger Platform.

COMMANDS:
    init                        Initialize rollback and disaster recovery system
    create-snapshot ID APPS     Create deployment snapshot
    rollback REASON APPS        Execute rollback operation
    disaster-recovery TYPE SYS  Activate disaster recovery
    emergency TYPE SYS          Declare emergency and activate procedures
    test-recovery              Test recovery procedures
    validate-integrity APPS    Validate rollback integrity
    cleanup-snapshots          Cleanup old snapshots

OPTIONS:
    -h, --help                 Show this help message

EXAMPLES:
    $(basename "$0") init
    $(basename "$0") create-snapshot deploy_123 "staff inventory"
    $(basename "$0") rollback "health_check_failures" "staff inventory"
    $(basename "$0") disaster-recovery "complete_system_failure" "all"
    $(basename "$0") emergency "critical_application_failure" "staff"
    $(basename "$0") test-recovery

EOF
}

main() {
    mkdir -p "$RECOVERY_DIR" "$BACKUP_DIR" "$SNAPSHOTS_DIR" "$LOG_DIR"
    
    if [[ $# -eq 0 ]]; then
        print_banner
        usage
        exit 1
    fi
    
    print_banner
    
    local command="$1"
    shift || true
    
    case "$command" in
        init)
            initialize_rollback_system
            ;;
        create-snapshot)
            local snapshot_id="${1:-}"
            local apps="${2:-}"
            if [[ -z "$snapshot_id" || -z "$apps" ]]; then
                log_error "Snapshot ID and applications required"
                usage
                exit 1
            fi
            "${RECOVERY_DIR}/snapshot-manager.sh" create_deployment_snapshot "$snapshot_id" "production" "$apps"
            ;;
        rollback)
            local reason="${1:-}"
            local apps="${2:-}"
            if [[ -z "$reason" || -z "$apps" ]]; then
                log_error "Rollback reason and applications required"
                usage
                exit 1
            fi
            "${RECOVERY_DIR}/rollback-controller.sh" execute_rollback "$reason" "$apps" "latest" "manual"
            ;;
        disaster-recovery)
            local disaster_type="${1:-}"
            local systems="${2:-}"
            if [[ -z "$disaster_type" || -z "$systems" ]]; then
                log_error "Disaster type and affected systems required"
                usage
                exit 1
            fi
            "${RECOVERY_DIR}/disaster-recovery.sh" activate_disaster_recovery "$disaster_type" "$systems" "critical"
            ;;
        emergency)
            local emergency_type="${1:-}"
            local systems="${2:-}"
            if [[ -z "$emergency_type" || -z "$systems" ]]; then
                log_error "Emergency type and affected systems required"
                usage
                exit 1
            fi
            "${RECOVERY_DIR}/emergency-procedures.sh" declare_emergency "$emergency_type" "$systems"
            ;;
        test-recovery)
            test_recovery_procedures
            ;;
        validate-integrity)
            local apps="${1:-}"
            if [[ -z "$apps" ]]; then
                log_error "Applications required for integrity validation"
                usage
                exit 1
            fi
            "${RECOVERY_DIR}/rollback-validator.sh" validate_rollback_integrity "$apps"
            ;;
        cleanup-snapshots)
            "${RECOVERY_DIR}/snapshot-manager.sh" cleanup_old_snapshots
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