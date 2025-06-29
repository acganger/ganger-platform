#!/bin/bash
# Sequential deployment script with status checking

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Sequential Deployment with Status Checking${NC}"
echo "============================================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
REPO_ID="996544644"

# Deployment order - helper first, then others
DEPLOYMENT_ORDER=(
  "deployment-helper:ganger-deployment-helper"
  "staff:ganger-staff"
  "inventory:ganger-inventory"
  "handouts:ganger-handouts"
  "medication-auth:ganger-medication-auth"
  "platform-dashboard:ganger-platform-dashboard"
  "component-showcase:ganger-component-showcase"
  "config-dashboard:ganger-config-dashboard"
  "compliance-training:ganger-compliance-training"
  "clinical-staffing:ganger-clinical-staffing"
  "integration-status:ganger-integration-status"
  "eos-l10:ganger-eos-l10"
  "batch-closeout:ganger-batch-closeout"
  "pharma-scheduling:ganger-pharma-scheduling"
  "socials-reviews:ganger-socials-reviews"
  "ai-receptionist:ganger-ai-receptionist"
  "call-center-ops:ganger-call-center-ops"
  "checkin-kiosk:ganger-checkin-kiosk"
  "checkout-slips:ganger-checkout-slips"
  "llm-demo:ganger-llm-demo"
)

# Function to check if project exists
check_project_exists() {
  local project_name=$1
  RESPONSE=$(curl -s "https://api.vercel.com/v9/projects/${project_name}?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
  
  if echo "$RESPONSE" | grep -q '"id"'; then
    return 0
  else
    return 1
  fi
}

# Function to check environment variables
check_env_vars() {
  local project_name=$1
  RESPONSE=$(curl -s "https://api.vercel.com/v9/projects/${project_name}/env?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
  
  # Check for essential vars
  local has_supabase_url=$(echo "$RESPONSE" | grep -c "NEXT_PUBLIC_SUPABASE_URL" || true)
  local has_supabase_anon=$(echo "$RESPONSE" | grep -c "NEXT_PUBLIC_SUPABASE_ANON_KEY" || true)
  local has_corepack=$(echo "$RESPONSE" | grep -c "ENABLE_EXPERIMENTAL_COREPACK" || true)
  
  echo "$has_supabase_url,$has_supabase_anon,$has_corepack"
}

# Function to trigger deployment
trigger_deployment() {
  local project_name=$1
  
  RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.vercel.com/v13/deployments?teamId=$TEAM_ID" \
    -d "{
      \"name\": \"$project_name\",
      \"project\": \"$project_name\",
      \"gitSource\": {
        \"type\": \"github\",
        \"repoId\": \"$REPO_ID\",
        \"ref\": \"main\"
      }
    }" 2>/dev/null)
  
  if echo "$RESPONSE" | grep -q '"id"'; then
    echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo ""
  else
    echo ""
  fi
}

# Function to check deployment status
check_deployment_status() {
  local deployment_id=$1
  
  RESPONSE=$(curl -s "https://api.vercel.com/v13/deployments/${deployment_id}?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
  
  echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('readyState', 'UNKNOWN'))" 2>/dev/null || echo "ERROR"
}

# Function to wait for deployment
wait_for_deployment() {
  local deployment_id=$1
  local app_name=$2
  local max_wait=600  # 10 minutes max
  local elapsed=0
  
  while [ $elapsed -lt $max_wait ]; do
    STATUS=$(check_deployment_status "$deployment_id")
    
    case "$STATUS" in
      "READY")
        echo -e "\n${GREEN}✓ Deployment successful!${NC}"
        return 0
        ;;
      "ERROR"|"CANCELED")
        echo -e "\n${RED}✗ Deployment failed: $STATUS${NC}"
        return 1
        ;;
      "BUILDING"|"QUEUED"|"INITIALIZING")
        echo -ne "\r⏳ Status: ${YELLOW}$STATUS${NC} (${elapsed}s)... "
        sleep 10
        elapsed=$((elapsed + 10))
        ;;
      *)
        echo -e "\n${YELLOW}⚠️  Unknown status: $STATUS${NC}"
        return 1
        ;;
    esac
  done
  
  echo -e "\n${RED}✗ Deployment timed out${NC}"
  return 1
}

# Main deployment loop
echo -e "${YELLOW}Starting sequential deployment...${NC}"
echo ""

# Create results file
echo "# Deployment Results - $(date)" > deployment-results.md
echo "" >> deployment-results.md
echo "| App | Project Exists | Env Vars | Deployment Status | Notes |" >> deployment-results.md
echo "|-----|----------------|----------|-------------------|-------|" >> deployment-results.md

for app_info in "${DEPLOYMENT_ORDER[@]}"; do
  IFS=':' read -r app_dir project_name <<< "$app_info"
  
  echo -e "\n${BLUE}Processing $app_dir...${NC}"
  
  # Check if project exists
  if check_project_exists "$project_name"; then
    project_exists="✅ Yes"
    echo "  ✓ Project exists"
    
    # Check environment variables
    env_check=$(check_env_vars "$project_name")
    IFS=',' read -r has_url has_anon has_corepack <<< "$env_check"
    
    env_status=""
    missing_vars=""
    
    if [ "$has_url" -eq 0 ]; then
      missing_vars="SUPABASE_URL"
    fi
    if [ "$has_anon" -eq 0 ]; then
      [ -n "$missing_vars" ] && missing_vars="$missing_vars, "
      missing_vars="${missing_vars}SUPABASE_ANON"
    fi
    if [ "$has_corepack" -eq 0 ]; then
      [ -n "$missing_vars" ] && missing_vars="$missing_vars, "
      missing_vars="${missing_vars}COREPACK"
    fi
    
    if [ -z "$missing_vars" ]; then
      env_status="✅ Complete"
      echo "  ✓ Environment variables configured"
    else
      env_status="⚠️ Missing"
      echo -e "  ${YELLOW}⚠️  Missing env vars: $missing_vars${NC}"
    fi
    
    # Trigger deployment
    echo -n "  Triggering deployment... "
    deployment_id=$(trigger_deployment "$project_name")
    
    if [ -n "$deployment_id" ]; then
      echo -e "${GREEN}✓${NC} [$deployment_id]"
      
      # Wait for deployment to complete
      if wait_for_deployment "$deployment_id" "$app_dir"; then
        deployment_status="✅ Success"
        notes="Deployed successfully"
      else
        deployment_status="❌ Failed"
        
        # Get error details
        ERROR_RESPONSE=$(curl -s "https://api.vercel.com/v13/deployments/${deployment_id}?teamId=${TEAM_ID}" \
          -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
        
        error_msg=$(echo "$ERROR_RESPONSE" | python3 -c "
import json,sys
data = json.load(sys.stdin)
if 'errorMessage' in data:
    print(data['errorMessage'][:50])
elif 'error' in data:
    print(data['error'].get('message', 'Unknown error')[:50])
else:
    print('Check build logs')
" 2>/dev/null || echo "Parse error")
        
        notes="Error: $error_msg"
      fi
    else
      deployment_status="❌ Failed"
      notes="Failed to trigger"
    fi
    
  else
    project_exists="❌ No"
    env_status="N/A"
    deployment_status="⏭️ Skipped"
    notes="Project not found"
    echo -e "  ${RED}✗ Project doesn't exist${NC}"
  fi
  
  # Update results file
  echo "| $app_dir | $project_exists | $env_status | $deployment_status | $notes |" >> deployment-results.md
  
  # If deployment-helper fails, ask before continuing
  if [ "$app_dir" = "deployment-helper" ] && [ "$deployment_status" != "✅ Success" ]; then
    echo -e "\n${YELLOW}⚠️  Deployment helper failed. Continue anyway? (y/n)${NC}"
    read -r response
    if [ "$response" != "y" ]; then
      echo "Stopping deployment sequence."
      exit 1
    fi
  fi
  
  # Wait between deployments to avoid overwhelming Vercel
  if [ "$app_dir" != "${DEPLOYMENT_ORDER[-1]%%:*}" ]; then
    echo -e "${YELLOW}Waiting 30 seconds before next deployment...${NC}"
    sleep 30
  fi
done

echo ""
echo -e "${GREEN}✅ Sequential deployment complete!${NC}"
echo ""
echo "Results saved to: deployment-results.md"
echo ""
echo "View in Vercel dashboard: https://vercel.com/ganger"