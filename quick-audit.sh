#!/bin/bash
# Quick Vercel project audit

echo "📊 Quick Vercel Audit"
echo "===================="

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Expected projects
EXPECTED=(
  "ganger-ai-receptionist"
  "ganger-batch-closeout"
  "ganger-call-center-ops"
  "ganger-checkin-kiosk"
  "ganger-checkout-slips"
  "ganger-clinical-staffing"
  "ganger-compliance-training"
  "ganger-component-showcase"
  "ganger-config-dashboard"
  "ganger-deployment-helper"
  "ganger-eos-l10"
  "ganger-handouts"
  "ganger-integration-status"
  "ganger-inventory"
  "ganger-llm-demo"
  "ganger-medication-auth"
  "ganger-pharma-scheduling"
  "ganger-platform-dashboard"
  "ganger-socials-reviews"
  "ganger-staff"
)

# Get all projects
echo "Fetching projects..."
PROJECTS=$(curl -s "https://api.vercel.com/v9/projects?teamId=${TEAM_ID}&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -c "
import json,sys
data = json.load(sys.stdin)
projects = sorted([p['name'] for p in data.get('projects', [])])
for p in projects:
    print(p)
")

# Count
TOTAL=$(echo "$PROJECTS" | wc -l)
echo "Total projects: $TOTAL"
echo ""

# Check for missing expected projects
echo "Missing expected projects:"
missing_count=0
for exp in "${EXPECTED[@]}"; do
  if ! echo "$PROJECTS" | grep -q "^$exp$"; then
    echo "  ❌ $exp"
    ((missing_count++))
  fi
done

if [ $missing_count -eq 0 ]; then
  echo "  ✅ None - all 20 expected projects exist!"
fi

# Check for extra projects
echo ""
echo "Extra/deprecated projects:"
extra_count=0
while IFS= read -r project; do
  is_expected=false
  for exp in "${EXPECTED[@]}"; do
    if [ "$project" = "$exp" ]; then
      is_expected=true
      break
    fi
  done
  
  if [ "$is_expected" = false ] && [ -n "$project" ]; then
    echo "  ⚠️  $project"
    ((extra_count++))
  fi
done <<< "$PROJECTS"

if [ $extra_count -eq 0 ]; then
  echo "  ✅ None - only expected projects exist!"
fi

echo ""
echo "Summary:"
echo "  Expected: 20"
echo "  Found: $TOTAL"
echo "  Missing: $missing_count"
echo "  Extra: $extra_count"