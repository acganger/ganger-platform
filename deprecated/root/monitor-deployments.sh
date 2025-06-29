#\!/bin/bash
# Monitor deployment status

echo "📊 Monitoring Deployment Status"
echo "=============================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Deployment IDs from the fast deployment
declare -A DEPLOYMENTS=(
  ["deployment-helper"]="dpl_7rh6PLrNJtoxJAPSY1T6XwayM5W5"
  ["staff"]="dpl_DFGSDMTaUZBpVna4Qe1ds9yMs8Qr"
  ["inventory"]="dpl_2Y17wtsXbXoDiycBYe3yrhE8NboY"
  ["handouts"]="dpl_keQ35j3odxEf7Z6fnQpZ9CdYwwXe"
  ["medication-auth"]="dpl_GovJCB7huChiDsdehkEAzNhEKxsA"
  ["platform-dashboard"]="dpl_D8YxRzX6UXpdd7vbjAMaqqLEwR7g"
  ["component-showcase"]="dpl_4u1ghuLNfdJvHp9rWAzrm64aRaDb"
  ["config-dashboard"]="dpl_2ViG48Ny2rav1oHB9b4PkRyivAno"
  ["compliance-training"]="dpl_AZh3cey6LviUx734JrfmW7CDFC1H"
  ["clinical-staffing"]="dpl_514aoMU7S3MMgWnuQXbasJTXEUit"
  ["integration-status"]="dpl_2TRk1914JD9QroLKMuC4Pk9KDzv7"
  ["eos-l10"]="dpl_X4s3iJn51TgogQxFMKxsXBPfaQkt"
  ["batch-closeout"]="dpl_4CshjSnFwJrJWXU154WvsyVeBebc"
  ["pharma-scheduling"]="dpl_HEtvSUXHS7tp2oDNGyVG5n7CG6dd"
  ["socials-reviews"]="dpl_BScbF8cBeKccBcESShkP7qrdLJ9U"
  ["ai-receptionist"]="dpl_3JnBRoB4XyBFfDzwYj2qruJcskev"
  ["call-center-ops"]="dpl_oMHx4ybvY4ncpFVX7Vs26DUhDW68"
  ["checkin-kiosk"]="dpl_G1LvVgrpJTjkBMTJSbYkZqjhRqic"
  ["checkout-slips"]="dpl_2eaL6sSBESua1b8zTrzyPb3C5TvK"
  ["llm-demo"]="dpl_H1Uv6akAyzNZbfwJJXW2AHtp1nae"
)

# Check status
check_all_status() {
  local ready_count=0
  local failed_count=0
  local building_count=0
  
  echo ""
  echo "Status at $(date '+%H:%M:%S'):"
  echo ""
  
  for app in "${\!DEPLOYMENTS[@]}"; do
    dep_id="${DEPLOYMENTS[$app]}"
    
    RESPONSE=$(curl -s "https://api.vercel.com/v13/deployments/${dep_id}?teamId=${TEAM_ID}" \
      -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
    
    STATE=$(echo "$RESPONSE"  < /dev/null |  python3 -c "
import json,sys
try:
    data = json.load(sys.stdin)
    print(data.get('readyState', 'UNKNOWN'))
except:
    print('ERROR')
" 2>/dev/null || echo "ERROR")
    
    URL=$(echo "$RESPONSE" | python3 -c "
import json,sys
try:
    data = json.load(sys.stdin)
    print(data.get('url', ''))
except:
    print('')
" 2>/dev/null || echo "")
    
    case "$STATE" in
      "READY")
        echo "  ✅ $app: READY - https://$URL"
        ((ready_count++))
        ;;
      "ERROR"|"CANCELED")
        echo "  ❌ $app: $STATE"
        ((failed_count++))
        ;;
      "BUILDING"|"QUEUED"|"INITIALIZING")
        echo "  🔄 $app: $STATE"
        ((building_count++))
        ;;
      *)
        echo "  ❓ $app: $STATE"
        ;;
    esac
  done
  
  echo ""
  echo "Summary: ✅ Ready: $ready_count | 🔄 Building: $building_count | ❌ Failed: $failed_count"
  
  # Return 0 if all are done (ready or failed), 1 if still building
  if [ $building_count -eq 0 ]; then
    return 0
  else
    return 1
  fi
}

# Monitor loop
max_wait=1800  # 30 minutes
elapsed=0
interval=30

while [ $elapsed -lt $max_wait ]; do
  check_all_status
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All deployments completed\!"
    break
  fi
  
  echo ""
  echo "Checking again in $interval seconds..."
  sleep $interval
  elapsed=$((elapsed + interval))
done

# Final report
echo ""
echo "========================================"
echo "📝 FINAL DEPLOYMENT REPORT"
echo "========================================"
check_all_status

# Save final report
cat > FINAL_DEPLOYMENT_REPORT.md << EOFREPORT
# Final Deployment Report - $(date)

## Deployment Status for All 20 Apps

| App | Status | URL |
|-----|--------|-----|
EOFREPORT

for app in "${\!DEPLOYMENTS[@]}"; do
  dep_id="${DEPLOYMENTS[$app]}"
  
  RESPONSE=$(curl -s "https://api.vercel.com/v13/deployments/${dep_id}?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" 2>/dev/null)
  
  STATE=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('readyState', 'UNKNOWN'))" 2>/dev/null || echo "ERROR")
  URL=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('url', ''))" 2>/dev/null || echo "")
  
  if [ "$STATE" = "READY" ]; then
    echo "| **$app** | ✅ Ready | https://$URL |" >> FINAL_DEPLOYMENT_REPORT.md
  else
    echo "| **$app** | ❌ $STATE | - |" >> FINAL_DEPLOYMENT_REPORT.md
  fi
done

echo "" >> FINAL_DEPLOYMENT_REPORT.md
echo "Generated at: $(date)" >> FINAL_DEPLOYMENT_REPORT.md

echo ""
echo "Final report saved to: FINAL_DEPLOYMENT_REPORT.md"
