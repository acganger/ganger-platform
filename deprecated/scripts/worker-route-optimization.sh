#!/bin/bash
# Worker Route Optimization Script
# Resolves worker routing conflicts for staff.gangerdermatology.com

set -euo pipefail

# Configuration
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-68d0160c9915efebbbecfddfd48cddab}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"
ZONE_ID="ba76d3d3f41251c49f0365421bd644a5"

if [[ -z "$API_TOKEN" ]]; then
    echo "❌ ERROR: CLOUDFLARE_API_TOKEN environment variable is required"
    exit 1
fi

echo "🔧 Starting Worker Route Optimization..."
echo "📍 Account ID: $ACCOUNT_ID"
echo "🌐 Zone ID: $ZONE_ID"
echo ""

# Helper function for API calls
cf_api() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    
    if [[ -n "$data" ]]; then
        curl -s -X "$method" \
            "https://api.cloudflare.com/client/v4/$endpoint" \
            -H "Authorization: Bearer $API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X "$method" \
            "https://api.cloudflare.com/client/v4/$endpoint" \
            -H "Authorization: Bearer $API_TOKEN"
    fi
}

# Function to get worker routes
get_worker_routes() {
    local script_name="$1"
    cf_api "GET" "accounts/$ACCOUNT_ID/workers/scripts/$script_name/routes"
}

# Function to delete worker route
delete_worker_route() {
    local script_name="$1"
    local route_id="$2"
    
    echo "🗑️  Deleting route $route_id from worker $script_name"
    local result=$(cf_api "DELETE" "accounts/$ACCOUNT_ID/workers/scripts/$script_name/routes/$route_id")
    
    if echo "$result" | jq -e '.success' > /dev/null; then
        echo "✅ Successfully deleted route $route_id"
    else
        echo "❌ Failed to delete route $route_id"
        echo "$result" | jq -r '.errors[]?.message // "Unknown error"'
        return 1
    fi
}

# Function to add worker route
add_worker_route() {
    local script_name="$1"
    local pattern="$2"
    local zone_name="$3"
    
    echo "➕ Adding route $pattern to worker $script_name"
    
    local data=$(cat <<EOF
{
    "pattern": "$pattern",
    "zone_name": "$zone_name"
}
EOF
)
    
    local result=$(cf_api "POST" "accounts/$ACCOUNT_ID/workers/scripts/$script_name/routes" "$data")
    
    if echo "$result" | jq -e '.success' > /dev/null; then
        echo "✅ Successfully added route $pattern"
    else
        echo "❌ Failed to add route $pattern"
        echo "$result" | jq -r '.errors[]?.message // "Unknown error"'
        return 1
    fi
}

# Function to analyze current conflicts
analyze_conflicts() {
    echo "🔍 Analyzing current worker route conflicts..."
    echo ""
    
    # List all workers with routes to staff.gangerdermatology.com
    local conflicting_workers=(
        "ganger-platform-production-production"
        "ganger-compliance-staff-production"
        "ganger-dashboard-staff-production"
        "ganger-eos-l10-v2"
        "ganger-socials-staff-production"
        "ganger-staffing-staff-production"
    )
    
    for worker in "${conflicting_workers[@]}"; do
        echo "📋 Worker: $worker"
        get_worker_routes "$worker" | jq -r '.result[]? | "  Route: \(.pattern) (ID: \(.id))"' 2>/dev/null || echo "  No routes found"
        echo ""
    done
}

# Function to implement Option A: Single Worker Architecture
implement_single_worker() {
    echo "🏗️  Implementing Option A: Single Worker Architecture"
    echo ""
    
    # Keep only ganger-platform-production-production with staff.gangerdermatology.com/*
    # Remove routes from other workers
    
    local workers_to_clean=(
        "ganger-compliance-staff-production"
        "ganger-dashboard-staff-production"
        "ganger-eos-l10-v2"
        "ganger-socials-staff-production"
        "ganger-staffing-staff-production"
    )
    
    for worker in "${workers_to_clean[@]}"; do
        echo "🧹 Cleaning routes from $worker..."
        
        # Get routes for this worker that match staff.gangerdermatology.com
        local routes=$(get_worker_routes "$worker" | jq -r '.result[]? | select(.pattern | contains("staff.gangerdermatology.com")) | .id' 2>/dev/null)
        
        while IFS= read -r route_id; do
            if [[ -n "$route_id" && "$route_id" != "null" ]]; then
                delete_worker_route "$worker" "$route_id"
            fi
        done <<< "$routes"
        
        echo ""
    done
    
    echo "✅ Single worker architecture implemented"
    echo "📍 All staff.gangerdermatology.com traffic now routes through ganger-platform-production-production"
}

# Function to implement Option B: Remove Wildcard, Keep Specific Routes
implement_specific_routes() {
    echo "🏗️  Implementing Option B: Specific Routes Only"
    echo ""
    
    # Remove wildcard route from ganger-platform-production-production
    echo "🧹 Removing wildcard route from ganger-platform-production-production..."
    
    local routes=$(get_worker_routes "ganger-platform-production-production" | \
        jq -r '.result[]? | select(.pattern == "staff.gangerdermatology.com/*") | .id' 2>/dev/null)
    
    while IFS= read -r route_id; do
        if [[ -n "$route_id" && "$route_id" != "null" ]]; then
            delete_worker_route "ganger-platform-production-production" "$route_id"
        fi
    done <<< "$routes"
    
    echo "✅ Wildcard route removed"
    echo "📍 Specific path routes maintained for each worker"
}

# Function to verify routing after changes
verify_routing() {
    echo "🔍 Verifying updated routing configuration..."
    echo ""
    
    # Check all workers for staff.gangerdermatology.com routes
    cf_api "GET" "accounts/$ACCOUNT_ID/workers/scripts" | \
        jq -r '.result[] | select(.deployment_id != null) | .id' | \
        while read script_id; do
            local staff_routes=$(get_worker_routes "$script_id" | \
                jq -r '.result[]? | select(.pattern | contains("staff.gangerdermatology.com")) | .pattern' 2>/dev/null)
            
            if [[ -n "$staff_routes" ]]; then
                echo "Worker: $script_id"
                echo "$staff_routes" | sed 's/^/  Route: /'
                echo ""
            fi
        done
}

# Main execution
echo "🔍 STEP 1: Current conflict analysis"
analyze_conflicts

echo "🤔 STEP 2: Architecture choice"
echo ""
echo "Choose routing architecture:"
echo "  A) Single Worker (consolidate all routes to ganger-platform-production-production)"
echo "  B) Specific Routes (remove wildcard, keep path-specific workers)"
echo "  V) Verify current state only"
echo ""

# For automation, default to Option A (single worker)
CHOICE="${1:-A}"

case "$CHOICE" in
    "A"|"a")
        echo "🏗️  Selected: Option A - Single Worker Architecture"
        implement_single_worker
        ;;
    "B"|"b")
        echo "🏗️  Selected: Option B - Specific Routes Only"
        implement_specific_routes
        ;;
    "V"|"v")
        echo "🔍 Selected: Verification only"
        ;;
    *)
        echo "❌ Invalid choice. Use A, B, or V"
        exit 1
        ;;
esac

echo ""
echo "🔍 STEP 3: Final verification"
verify_routing

echo ""
echo "✅ Worker route optimization completed!"
echo ""
echo "📊 Summary:"
echo "  - Analyzed routing conflicts for staff.gangerdermatology.com"
echo "  - Applied selected architecture ($CHOICE)"
echo "  - Verified final routing configuration"
echo ""
echo "🧪 Test endpoints:"
echo "  - https://staff.gangerdermatology.com/"
echo "  - https://staff.gangerdermatology.com/compliance/"
echo "  - https://staff.gangerdermatology.com/dashboard/"
echo "  - https://staff.gangerdermatology.com/l10/"
echo "  - https://staff.gangerdermatology.com/socials/"
echo "  - https://staff.gangerdermatology.com/staffing/"
echo ""