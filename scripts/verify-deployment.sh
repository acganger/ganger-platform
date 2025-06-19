#!/bin/bash
# Deployment Verification Script

echo "🔍 Ganger Platform - Deployment Verification"
echo "==========================================="
echo

# Check which Workers are handling specific routes
check_route() {
    local route=$1
    local expected_worker=$2
    
    echo "Checking route: $route"
    
    # Get headers to see which Worker is handling the request
    response=$(curl -s -I "https://staff.gangerdermatology.com$route" | grep -i "cf-worker\|cf-ray\|status")
    status=$(curl -s -o /dev/null -w "%{http_code}" "https://staff.gangerdermatology.com$route")
    
    echo "  Status: $status"
    
    # Try to determine which worker by checking response patterns
    if [ "$status" = "200" ] || [ "$status" = "302" ]; then
        echo "  ✅ Route is accessible"
    else
        echo "  ❌ Route returns error status"
    fi
    
    echo "  Expected Worker: $expected_worker"
    echo
}

echo "=== DEDICATED WORKER ROUTES ==="
check_route "/l10" "ganger-eos-l10-v2"
check_route "/l10/rocks" "ganger-eos-l10-v2"
check_route "/compliance" "ganger-compliance-staff-production"
check_route "/compliance/dashboard" "ganger-compliance-staff-production"
check_route "/staffing" "ganger-staffing-staff-production"
check_route "/staffing/analytics" "ganger-staffing-staff-production"
check_route "/socials" "ganger-socials-staff-production"
check_route "/socials/dashboard" "ganger-socials-staff-production"

echo "=== STAFF PORTAL ROUTER ROUTES ==="
check_route "/" "staff-portal-router-production"
check_route "/dashboard" "staff-portal-router-production"
check_route "/kiosk/dashboard" "staff-portal-router-production"
check_route "/config/apps" "staff-portal-router-production"

echo "=== CHECKING WORKER DEPLOYMENTS ==="
echo "To see actual Worker assignments:"
echo "1. Visit: https://dash.cloudflare.com/68d0160c9915efebbbecfddfd48cddab/workers/overview"
echo "2. Check each Worker's routes"
echo
echo "Known Workers that should have routes:"
echo "- ganger-eos-l10-v2 (or ganger-l10-staff-v3)"
echo "- ganger-compliance-staff-production"
echo "- ganger-staffing-staff-production"
echo "- ganger-socials-staff-production"
echo "- staff-portal-router-production"