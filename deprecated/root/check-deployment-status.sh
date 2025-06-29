#!/bin/bash
# Check current deployment status for all apps

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 Checking Deployment Status for All Apps${NC}"
echo "=========================================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# All apps with their expected Vercel project names
declare -A APPS=(
  ["ai-receptionist"]="ganger-ai-receptionist"
  ["batch-closeout"]="ganger-batch-closeout"
  ["call-center-ops"]="ganger-call-center-ops"
  ["checkin-kiosk"]="ganger-checkin-kiosk"
  ["checkout-slips"]="ganger-checkout-slips"
  ["clinical-staffing"]="ganger-clinical-staffing"
  ["compliance-training"]="ganger-compliance-training"
  ["component-showcase"]="ganger-component-showcase"
  ["config-dashboard"]="ganger-config-dashboard"
  ["deployment-helper"]="ganger-deployment-helper"
  ["eos-l10"]="ganger-eos-l10"
  ["handouts"]="ganger-handouts"
  ["integration-status"]="ganger-integration-status"
  ["inventory"]="ganger-inventory"
  ["llm-demo"]="ganger-llm-demo"
  ["medication-auth"]="ganger-medication-auth"
  ["pharma-scheduling"]="ganger-pharma-scheduling"
  ["platform-dashboard"]="ganger-platform-dashboard"
  ["socials-reviews"]="ganger-socials-reviews"
  ["staff"]="ganger-staff"
)

# Create updated status table
cat > DEPLOYMENT_STATUS_CURRENT.md << 'EOF'
# Ganger Platform - Current Deployment Status

**Last Updated**: $(date)
**Checking**: Project existence, environment variables, and deployment status

## Deployment Status Table

| App Name | Project Exists | Essential Env Vars | Latest Deploy | Status | Issues/Notes |
|----------|----------------|-------------------|---------------|--------|--------------|
EOF

echo "" >> DEPLOYMENT_STATUS_CURRENT.md
echo "Checking each app..."
echo ""

# Sort apps alphabetically
sorted_apps=($(for key in "${!APPS[@]}"; do echo "$key"; done | sort))

for app_dir in "${sorted_apps[@]}"; do
  project_name="${APPS[$app_dir]}"
  echo -ne "Checking $app_dir... "
  
  # Check if project exists
  PROJECT_RESPONSE=$(curl -s "https://api.vercel.com/v9/projects/${project_name}?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
  
  if echo "$PROJECT_RESPONSE" | grep -q '"id"'; then
    project_exists="✅"
    
    # Check environment variables
    ENV_RESPONSE=$(curl -s "https://api.vercel.com/v9/projects/${project_name}/env?teamId=${TEAM_ID}" \
      -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
    
    # Count essential variables
    env_vars=""
    missing_vars=""
    
    if echo "$ENV_RESPONSE" | grep -q "NEXT_PUBLIC_SUPABASE_URL"; then
      env_vars="${env_vars}S"
    else
      missing_vars="${missing_vars}SUPABASE_URL "
    fi
    
    if echo "$ENV_RESPONSE" | grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
      env_vars="${env_vars}A"
    else
      missing_vars="${missing_vars}SUPABASE_ANON "
    fi
    
    if echo "$ENV_RESPONSE" | grep -q "ENABLE_EXPERIMENTAL_COREPACK"; then
      env_vars="${env_vars}C"
    else
      missing_vars="${missing_vars}COREPACK "
    fi
    
    if [ -z "$missing_vars" ]; then
      env_status="✅ Complete"
    else
      env_status="⚠️ Missing"
    fi
    
    # Get latest deployment
    DEPLOYMENTS_RESPONSE=$(curl -s "https://api.vercel.com/v6/deployments?projectId=${project_name}&teamId=${TEAM_ID}&limit=1" \
      -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
    
    if echo "$DEPLOYMENTS_RESPONSE" | grep -q '"deployments"'; then
      latest_state=$(echo "$DEPLOYMENTS_RESPONSE" | python3 -c "
import json,sys
data = json.load(sys.stdin)
if data.get('deployments'):
    d = data['deployments'][0]
    state = d.get('state', 'UNKNOWN')
    created = d.get('created', 0)
    from datetime import datetime
    if created:
        dt = datetime.fromtimestamp(created/1000)
        time_str = dt.strftime('%m/%d %H:%M')
    else:
        time_str = 'Unknown'
    print(f'{state}|{time_str}')
else:
    print('NO_DEPLOYS|Never')
" 2>/dev/null || echo "ERROR|Parse failed")
      
      IFS='|' read -r deploy_state deploy_time <<< "$latest_state"
      
      case "$deploy_state" in
        "READY")
          status="✅ Ready"
          ;;
        "ERROR"|"CANCELED")
          status="❌ Failed"
          ;;
        "BUILDING"|"QUEUED"|"INITIALIZING")
          status="🔄 Building"
          ;;
        "NO_DEPLOYS")
          status="⏸️ Never"
          deploy_time="-"
          ;;
        *)
          status="❓ Unknown"
          ;;
      esac
    else
      deploy_time="-"
      status="⏸️ Never"
    fi
    
    # Determine issues/notes
    if [ "$status" = "❌ Failed" ]; then
      issues="Check build logs"
    elif [ -n "$missing_vars" ]; then
      issues="Missing: $missing_vars"
    else
      issues="-"
    fi
    
    echo -e "${GREEN}✓${NC}"
  else
    project_exists="❌"
    env_status="N/A"
    deploy_time="N/A"
    status="N/A"
    issues="Project not found in Vercel"
    echo -e "${RED}✗${NC}"
  fi
  
  # Add to table
  echo "| **$app_dir** | $project_exists | $env_status | $deploy_time | $status | $issues |" >> DEPLOYMENT_STATUS_CURRENT.md
done

# Add summary
cat >> DEPLOYMENT_STATUS_CURRENT.md << 'EOF'

## Summary

### Legend:
- **Project Exists**: ✅ = Found in Vercel, ❌ = Not found
- **Essential Env Vars**: 
  - ✅ Complete = Has SUPABASE_URL, SUPABASE_ANON_KEY, and COREPACK
  - ⚠️ Missing = Missing one or more essential variables
- **Status**: 
  - ✅ Ready = Successfully deployed
  - ❌ Failed = Deployment failed
  - 🔄 Building = Currently deploying
  - ⏸️ Never = No deployments yet

### Quick Actions Needed:

1. **Create Missing Projects**:
   Check which apps show "❌" in Project Exists column

2. **Add Missing Environment Variables**:
   For apps with "⚠️ Missing" in env vars, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ENABLE_EXPERIMENTAL_COREPACK=1`

3. **Check Failed Builds**:
   For apps with "❌ Failed" status, check build logs in Vercel dashboard

### Deployment Strategy:
Run `./sequential-deploy.sh` to deploy apps one by one, starting with deployment-helper.
EOF

echo ""
echo -e "${GREEN}✅ Status check complete!${NC}"
echo ""
echo "Results saved to: DEPLOYMENT_STATUS_CURRENT.md"
echo ""
echo "To deploy sequentially, run: ./sequential-deploy.sh"