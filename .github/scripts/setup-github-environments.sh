#!/bin/bash

# =============================================================================
# GITHUB ENVIRONMENT SETUP SCRIPT
# =============================================================================
# Automated setup for GitHub environments and secrets
# Requires: gh CLI tool installed and authenticated
# Usage: ./setup-github-environments.sh
# =============================================================================

set -euo pipefail

readonly REPO="acganger/ganger-platform"
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

print_banner() {
    echo -e "${BLUE}"
    echo "==============================================================================="
    echo "  GANGER PLATFORM - GITHUB ENVIRONMENT SETUP"
    echo "  Automated CI/CD Environment Configuration"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================================="
    echo -e "${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed. Please install it first."
        exit 1
    fi
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
        exit 1
    fi
    
    # Check repository access
    if ! gh repo view "$REPO" &> /dev/null; then
        log_error "Cannot access repository: $REPO"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_environment() {
    local env_name="$1"
    local env_url="$2"
    local protection="$3"
    
    log_info "Creating environment: $env_name"
    
    # Create environment
    if gh api "repos/$REPO/environments/$env_name" --method PUT \
        --field "deployment_branch_policy[protected_branches]=$protection" \
        > /dev/null 2>&1; then
        log_success "Environment '$env_name' created successfully"
    else
        log_warning "Environment '$env_name' may already exist or failed to create"
    fi
    
    # Set environment URL
    if gh api "repos/$REPO/environments/$env_name" --method PUT \
        --field "url=$env_url" > /dev/null 2>&1; then
        log_success "Environment URL set for '$env_name'"
    fi
}

setup_production_protection() {
    log_info "Setting up production environment protection rules..."
    
    # Add required reviewers for production
    if gh api "repos/$REPO/environments/production" --method PUT \
        --field "protection_rules[0][type]=required_reviewers" \
        --field "protection_rules[0][required_reviewers][0][login]=acganger" \
        > /dev/null 2>&1; then
        log_success "Production protection rules configured"
    else
        log_warning "Failed to set production protection rules"
    fi
}

create_repository_secrets() {
    log_info "Setting up repository-level secrets..."
    
    # Check if secrets already exist
    local secrets=(
        "CLOUDFLARE_API_TOKEN"
        "CLOUDFLARE_ACCOUNT_ID"
        "CLOUDFLARE_ZONE_ID"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SLACK_WEBHOOK_URL"
    )
    
    for secret in "${secrets[@]}"; do
        if gh secret list | grep -q "$secret"; then
            log_success "Secret '$secret' already exists"
        else
            log_warning "Secret '$secret' not found - needs to be set manually"
            echo "  Run: gh secret set $secret --body \"<your_value>\""
        fi
    done
}

setup_branch_protection() {
    log_info "Setting up branch protection rules..."
    
    # Protect main branch
    if gh api "repos/$REPO/branches/main/protection" --method PUT \
        --field "required_status_checks[strict]=true" \
        --field "required_status_checks[contexts][]=quality-gate" \
        --field "enforce_admins=false" \
        --field "required_pull_request_reviews[required_approving_review_count]=1" \
        --field "required_pull_request_reviews[dismiss_stale_reviews]=true" \
        --field "restrictions=null" \
        > /dev/null 2>&1; then
        log_success "Main branch protection configured"
    else
        log_warning "Failed to set main branch protection"
    fi
    
    # Protect staging branch if it exists
    if gh api "repos/$REPO/branches/staging" > /dev/null 2>&1; then
        if gh api "repos/$REPO/branches/staging/protection" --method PUT \
            --field "required_status_checks[strict]=true" \
            --field "required_status_checks[contexts][]=quality-gate" \
            --field "enforce_admins=false" \
            --field "required_pull_request_reviews[required_approving_review_count]=0" \
            --field "restrictions=null" \
            > /dev/null 2>&1; then
            log_success "Staging branch protection configured"
        fi
    fi
}

display_manual_steps() {
    log_info "Manual configuration steps required:"
    echo
    echo -e "${YELLOW}1. Set Environment Secrets:${NC}"
    echo "   For staging environment:"
    echo "   gh secret set CLOUDFLARE_API_TOKEN --env staging --body \"<your_token>\""
    echo "   gh secret set CLOUDFLARE_ACCOUNT_ID --env staging --body \"<your_account_id>\""
    echo "   gh secret set SUPABASE_URL --env staging --body \"<your_supabase_url>\""
    echo "   gh secret set SUPABASE_ANON_KEY --env staging --body \"<your_anon_key>\""
    echo "   gh secret set SLACK_WEBHOOK_URL --env staging --body \"<your_webhook>\""
    echo
    echo "   For production environment (same secrets plus additional):"
    echo "   gh secret set SUPABASE_SERVICE_ROLE_KEY --env production --body \"<your_service_key>\""
    echo "   gh secret set STRIPE_PUBLISHABLE_KEY --env production --body \"<your_stripe_public>\""
    echo "   gh secret set STRIPE_SECRET_KEY --env production --body \"<your_stripe_secret>\""
    echo "   gh secret set TWILIO_ACCOUNT_SID --env production --body \"<your_twilio_sid>\""
    echo "   gh secret set TWILIO_AUTH_TOKEN --env production --body \"<your_twilio_token>\""
    echo
    echo -e "${YELLOW}2. Repository Settings:${NC}"
    echo "   - Enable Actions in repository settings"
    echo "   - Set default branch to 'main'"
    echo "   - Enable 'Allow GitHub Actions to create and approve pull requests'"
    echo
    echo -e "${YELLOW}3. Cloudflare Configuration:${NC}"
    echo "   - Ensure Cloudflare API token has Workers:Edit permissions"
    echo "   - Verify account ID is correct"
    echo "   - Check zone configuration for domain routing"
    echo
}

main() {
    print_banner
    
    check_prerequisites
    
    log_info "Setting up GitHub environments for Ganger Platform..."
    
    # Create staging environment
    create_environment "staging" "https://staff-staging.gangerdermatology.com" "false"
    
    # Create production environment
    create_environment "production" "https://staff.gangerdermatology.com" "true"
    
    # Setup production protection
    setup_production_protection
    
    # Setup repository secrets
    create_repository_secrets
    
    # Setup branch protection
    setup_branch_protection
    
    # Display manual steps
    display_manual_steps
    
    log_success "GitHub environment setup completed!"
    log_info "Please complete the manual configuration steps above."
}

main "$@"