#!/bin/bash

# Monitor all 20 Ganger Platform deployments
# Updates every 60 seconds until all are complete

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# All 20 apps
APPS=(
    "ai-receptionist"
    "batch-closeout"
    "call-center-ops"
    "checkin-kiosk"
    "checkout-slips"
    "clinical-staffing"
    "compliance-training"
    "component-showcase"
    "config-dashboard"
    "deployment-helper"
    "eos-l10"
    "handouts"
    "integration-status"
    "inventory"
    "llm-demo"
    "medication-auth"
    "pharma-scheduling"
    "platform-dashboard"
    "socials-reviews"
    "staff"
)

# Check environment
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ VERCEL_TOKEN not set${NC}"
    exit 1
fi

VERCEL_TEAM_ID="${VERCEL_TEAM_ID:-team_wpY7PcIsYQNnslNN39o7fWvS}"

check_deployments() {
    clear
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}     Ganger Platform Deployment Monitor - $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""

    local completed=0
    local building=0
    local failed=0
    local queued=0
    local not_found=0

    # Get all deployments
    local response=$(curl -s "https://api.vercel.com/v6/deployments?teamId=$VERCEL_TEAM_ID&limit=100" \
        -H "Authorization: Bearer $VERCEL_TOKEN")

    echo -e "${YELLOW}App Name                    Status          State           Duration${NC}"
    echo "──────────────────────────────────────────────────────────────────────"

    for app in "${APPS[@]}"; do
        local project_name="ganger-$app"
        
        # Find the latest deployment for this project
        local deployment_info=$(echo "$response" | python3 -c "
import json, sys
from datetime import datetime

data = json.load(sys.stdin)
project_name = '$project_name'

# Find all deployments for this project
project_deployments = [d for d in data.get('deployments', []) if d.get('name', '') == project_name]

if not project_deployments:
    print('NOT_FOUND|N/A|N/A|N/A')
else:
    # Get the most recent deployment
    latest = sorted(project_deployments, key=lambda x: x.get('createdAt', 0), reverse=True)[0]
    
    state = latest.get('state', 'UNKNOWN')
    ready_state = latest.get('readyState', 'UNKNOWN')
    created = latest.get('createdAt', 0)
    
    # Calculate duration
    if created:
        duration = int((datetime.now().timestamp() * 1000 - created) / 1000)
        if duration < 60:
            duration_str = f'{duration}s'
        else:
            duration_str = f'{duration // 60}m {duration % 60}s'
    else:
        duration_str = 'N/A'
    
    print(f'{state}|{ready_state}|{duration_str}|{created}')
")

        IFS='|' read -r state ready_state duration created <<< "$deployment_info"

        # Format output based on state
        if [ "$state" = "NOT_FOUND" ]; then
            printf "%-27s ${YELLOW}⏳ Not deployed${NC}    %-15s %s\n" "$app" "-" "-"
            ((not_found++))
        elif [ "$state" = "READY" ]; then
            printf "%-27s ${GREEN}✅ Complete${NC}        %-15s %s\n" "$app" "$ready_state" "$duration"
            ((completed++))
        elif [ "$state" = "ERROR" ] || [ "$state" = "FAILED" ]; then
            printf "%-27s ${RED}❌ Failed${NC}          %-15s %s\n" "$app" "$ready_state" "$duration"
            ((failed++))
        elif [ "$state" = "BUILDING" ] || [ "$state" = "DEPLOYING" ]; then
            printf "%-27s ${YELLOW}🔨 Building${NC}        %-15s %s\n" "$app" "$ready_state" "$duration"
            ((building++))
        elif [ "$state" = "QUEUED" ] || [ "$state" = "INITIALIZING" ]; then
            printf "%-27s ${BLUE}⏱️  Queued${NC}          %-15s %s\n" "$app" "$ready_state" "$duration"
            ((queued++))
        else
            printf "%-27s ${YELLOW}❓ %s${NC}         %-15s %s\n" "$app" "$state" "$ready_state" "$duration"
        fi
    done

    echo ""
    echo "──────────────────────────────────────────────────────────────────────"
    echo -e "${GREEN}Summary:${NC}"
    echo -e "  ✅ Completed: $completed/20"
    echo -e "  🔨 Building:  $building"
    echo -e "  ⏱️  Queued:    $queued"
    echo -e "  ❌ Failed:    $failed"
    echo -e "  ⏳ Not found: $not_found"
    echo ""

    # Check if all are complete
    if [ $completed -eq 20 ]; then
        echo -e "${GREEN}🎉 ALL DEPLOYMENTS COMPLETE! 🎉${NC}"
        echo ""
        echo "All 20 apps have been successfully deployed."
        return 0
    elif [ $failed -gt 0 ]; then
        echo -e "${RED}⚠️  Some deployments have failed. Check the Vercel dashboard for details.${NC}"
    else
        local remaining=$((20 - completed))
        echo -e "${YELLOW}⏳ Waiting for $remaining deployments to complete...${NC}"
    fi

    return 1
}

# Main monitoring loop
echo -e "${BLUE}Starting deployment monitor...${NC}"
echo "Will check every 60 seconds until all deployments are complete."
echo ""

while true; do
    if check_deployments; then
        # All deployments complete
        break
    fi
    
    echo ""
    echo "Next check in 60 seconds... (Press Ctrl+C to stop)"
    sleep 60
done

echo ""
echo -e "${GREEN}Monitoring complete!${NC}"
echo "Check https://vercel.com/ganger for full deployment details."