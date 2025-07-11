#!/bin/bash

# Update Edge Config Routes for Ganger Platform
# This script updates the Edge Config with all app routes

VERCEL_TOKEN="${VERCEL_TOKEN:-RdwA23mHSvPcm9ptReM6zxjF}"
TEAM_ID="${VERCEL_TEAM_ID:-team_wpY7PcIsYQNnslNN39o7fWvS}"
EDGE_CONFIG_ID="ecfg_91hm0cikzr8dacngqec6thq5xmkm"

echo "🚀 Updating Edge Config routes..."

# Create the routes JSON
ROUTES_JSON=$(cat <<'EOF'
{
  "": "https://ganger-actions.vercel.app",
  "actions": "https://ganger-actions.vercel.app",
  "inventory": "https://ganger-inventory.vercel.app",
  "handouts": "https://ganger-handouts.vercel.app",
  "medication-auth": "https://ganger-medication-auth.vercel.app",
  "meds": "https://ganger-medication-auth.vercel.app",
  "kiosk": "https://ganger-checkin-kiosk.vercel.app",
  "checkin-kiosk": "https://ganger-checkin-kiosk.vercel.app",
  "l10": "https://ganger-eos-l10.vercel.app",
  "eos-l10": "https://ganger-eos-l10.vercel.app",
  "batch": "https://ganger-batch-closeout.vercel.app",
  "batch-closeout": "https://ganger-batch-closeout.vercel.app",
  "compliance": "https://ganger-compliance-training.vercel.app",
  "compliance-training": "https://ganger-compliance-training.vercel.app",
  "clinical-staffing": "https://ganger-clinical-staffing.vercel.app",
  "staffing": "https://ganger-clinical-staffing.vercel.app",
  "socials": "https://ganger-socials-reviews.vercel.app",
  "socials-reviews": "https://ganger-socials-reviews.vercel.app",
  "config": "https://ganger-config-dashboard.vercel.app",
  "config-dashboard": "https://ganger-config-dashboard.vercel.app",
  "status": "https://ganger-integration-status.vercel.app",
  "integration-status": "https://ganger-integration-status.vercel.app",
  "ai-receptionist": "https://ganger-ai-receptionist.vercel.app",
  "call-center": "https://ganger-call-center-ops.vercel.app",
  "call-center-ops": "https://ganger-call-center-ops.vercel.app",
  "pharma": "https://ganger-pharma-scheduling.vercel.app",
  "pharma-scheduling": "https://ganger-pharma-scheduling.vercel.app",
  "lunch": "https://ganger-pharma-scheduling.vercel.app",
  "reps": "https://ganger-pharma-scheduling.vercel.app",
  "components": "https://ganger-component-showcase.vercel.app",
  "component-showcase": "https://ganger-component-showcase.vercel.app",
  "showcase": "https://ganger-component-showcase.vercel.app",
  "platform": "https://ganger-platform-dashboard.vercel.app",
  "platform-dashboard": "https://ganger-platform-dashboard.vercel.app"
}
EOF
)

# Update using Edge Config API
echo "📝 Updating routes in Edge Config..."

# Since we need the Edge Config token, we'll output instructions
echo ""
echo "⚠️  Manual steps required:"
echo ""
echo "1. Go to: https://vercel.com/$TEAM_ID/stores/edge-config"
echo "2. Click on your Edge Config (ganger-platform-routes)"
echo "3. Click 'Edit' on the appUrls key"
echo "4. Replace the content with:"
echo ""
echo "$ROUTES_JSON"
echo ""
echo "5. Click 'Save'"
echo "6. Copy the connection string"
echo "7. Update EDGE_CONFIG_202507_1 in ganger-staff project settings"
echo ""
echo "Alternative: Use Vercel CLI"
echo "vercel env add EDGE_CONFIG_202507_1 production < connection-string.txt"