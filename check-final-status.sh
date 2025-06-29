#!/bin/bash
# Quick final status check

echo "📊 Final Deployment Status Check"
echo "================================"
echo ""

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# All 20 projects
PROJECTS=(
  "ganger-deployment-helper"
  "ganger-staff"
  "ganger-inventory"
  "ganger-handouts"
  "ganger-medication-auth"
  "ganger-platform-dashboard"
  "ganger-component-showcase"
  "ganger-config-dashboard"
  "ganger-compliance-training"
  "ganger-clinical-staffing"
  "ganger-integration-status"
  "ganger-eos-l10"
  "ganger-batch-closeout"
  "ganger-pharma-scheduling"
  "ganger-socials-reviews"
  "ganger-ai-receptionist"
  "ganger-call-center-ops"
  "ganger-checkin-kiosk"
  "ganger-checkout-slips"
  "ganger-llm-demo"
)

ready_count=0
failed_count=0
building_count=0

# Check each project's latest deployment
for project in "${PROJECTS[@]}"; do
  # Get latest deployment
  RESPONSE=$(curl -s "https://api.vercel.com/v6/deployments?projectId=${project}&teamId=${TEAM_ID}&limit=1" \
    -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
  
  if echo "$RESPONSE" | grep -q '"deployments"'; then
    STATUS_INFO=$(echo "$RESPONSE" | python3 -c "
import json,sys
from datetime import datetime
data = json.load(sys.stdin)
if data.get('deployments'):
    d = data['deployments'][0]
    state = d.get('state', 'UNKNOWN')
    url = d.get('url', '')
    created = d.get('created', 0)
    if created:
        dt = datetime.fromtimestamp(created/1000)
        time_str = dt.strftime('%H:%M')
    else:
        time_str = 'Unknown'
    print(f'{state}|{url}|{time_str}')
else:
    print('NO_DEPLOY||')
" 2>/dev/null || echo "ERROR||")
    
    IFS='|' read -r STATE URL TIME <<< "$STATUS_INFO"
    
    # Format project name
    app_name=${project#ganger-}
    app_name=${app_name//-/ }
    
    case "$STATE" in
      "READY")
        echo "✅ ${app_name}: READY (${TIME}) - https://${URL}"
        ((ready_count++))
        ;;
      "ERROR"|"CANCELED")
        echo "❌ ${app_name}: $STATE (${TIME})"
        ((failed_count++))
        ;;
      "BUILDING"|"QUEUED"|"INITIALIZING")
        echo "🔄 ${app_name}: $STATE (${TIME})"
        ((building_count++))
        ;;
      *)
        echo "❓ ${app_name}: $STATE"
        ((failed_count++))
        ;;
    esac
  else
    echo "❌ ${project}: No deployments found"
    ((failed_count++))
  fi
done

echo ""
echo "========================================"
echo "📊 SUMMARY:"
echo "  ✅ Ready: $ready_count/20"
echo "  🔄 Building: $building_count/20"
echo "  ❌ Failed: $failed_count/20"
echo "========================================"

# Create final report
cat > FINAL_DEPLOYMENT_STATUS.md << EOF
# Final Deployment Status - $(date)

## Summary
- **Total Apps**: 20
- **Successfully Deployed**: $ready_count
- **Currently Building**: $building_count
- **Failed**: $failed_count

## Deployment Details

| App | Status | Time | URL |
|-----|--------|------|-----|
EOF

# Add details for each app
for project in "${PROJECTS[@]}"; do
  RESPONSE=$(curl -s "https://api.vercel.com/v6/deployments?projectId=${project}&teamId=${TEAM_ID}&limit=1" \
    -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
  
  if echo "$RESPONSE" | grep -q '"deployments"'; then
    STATUS_INFO=$(echo "$RESPONSE" | python3 -c "
import json,sys
from datetime import datetime
data = json.load(sys.stdin)
if data.get('deployments'):
    d = data['deployments'][0]
    state = d.get('state', 'UNKNOWN')
    url = d.get('url', '-')
    created = d.get('created', 0)
    if created:
        dt = datetime.fromtimestamp(created/1000)
        time_str = dt.strftime('%Y-%m-%d %H:%M:%S')
    else:
        time_str = '-'
    if state == 'READY':
        status_icon = '✅'
        url_text = f'[View](https://{url})'
    elif state in ['ERROR', 'CANCELED']:
        status_icon = '❌'
        url_text = '-'
    elif state in ['BUILDING', 'QUEUED', 'INITIALIZING']:
        status_icon = '🔄'
        url_text = 'Building...'
    else:
        status_icon = '❓'
        url_text = '-'
    print(f'{status_icon} {state}|{time_str}|{url_text}')
else:
    print('❌ NO_DEPLOY|-|-')
" 2>/dev/null || echo "❌ ERROR|-|-")
    
    IFS='|' read -r STATUS TIME URL_TEXT <<< "$STATUS_INFO"
    app_name=${project#ganger-}
    
    echo "| **$app_name** | $STATUS | $TIME | $URL_TEXT |" >> FINAL_DEPLOYMENT_STATUS.md
  fi
done

echo "" >> FINAL_DEPLOYMENT_STATUS.md
echo "## Notes" >> FINAL_DEPLOYMENT_STATUS.md
echo "- All apps configured with pnpm package manager" >> FINAL_DEPLOYMENT_STATUS.md
echo "- Environment variables set for all projects" >> FINAL_DEPLOYMENT_STATUS.md
echo "- Using monorepo structure with shared packages" >> FINAL_DEPLOYMENT_STATUS.md
echo "" >> FINAL_DEPLOYMENT_STATUS.md
echo "Generated at: $(date)" >> FINAL_DEPLOYMENT_STATUS.md

echo ""
echo "📄 Full report saved to: FINAL_DEPLOYMENT_STATUS.md"

# If not all are ready, provide next steps
if [ $ready_count -lt 20 ]; then
  echo ""
  echo "⚠️  Not all apps deployed successfully."
  echo ""
  echo "Next steps:"
  echo "1. Check build logs for failed apps in Vercel dashboard"
  echo "2. Common issues to check:"
  echo "   - TypeScript errors in development apps"
  echo "   - Missing dependencies"
  echo "   - Build command issues"
  echo "3. Re-deploy failed apps individually"
fi