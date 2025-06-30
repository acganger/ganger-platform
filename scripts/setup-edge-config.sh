#!/bin/bash

# Script to create Vercel Edge Config with app URL mappings
# This will be run manually via Vercel dashboard since CLI requires auth

echo "📋 Vercel Edge Config Setup Instructions"
echo "========================================"
echo ""
echo "1. Go to: https://vercel.com/team_wpY7PcIsYQNnslNN39o7fWvS/stores"
echo ""
echo "2. Click 'Create Edge Config Store'"
echo ""
echo "3. Name it: 'ganger-platform-app-urls'"
echo ""
echo "4. Add the following JSON data:"
echo ""
cat << 'EOF'
{
  "appUrls": {
    "inventory": "https://ganger-inventory-anand-gangers-projects.vercel.app",
    "handouts": "https://ganger-handouts-anand-gangers-projects.vercel.app",
    "l10": "https://ganger-eos-l10-anand-gangers-projects.vercel.app",
    "eos-l10": "https://ganger-eos-l10-anand-gangers-projects.vercel.app",
    "batch": "https://ganger-batch-closeout-anand-gangers-projects.vercel.app",
    "batch-closeout": "https://ganger-batch-closeout-anand-gangers-projects.vercel.app",
    "compliance": "https://ganger-compliance-training-anand-gangers-projects.vercel.app",
    "compliance-training": "https://ganger-compliance-training-anand-gangers-projects.vercel.app",
    "clinical-staffing": "https://ganger-clinical-staffing-anand-gangers-projects.vercel.app",
    "config": "https://ganger-config-dashboard-anand-gangers-projects.vercel.app",
    "config-dashboard": "https://ganger-config-dashboard-anand-gangers-projects.vercel.app",
    "status": "https://ganger-integration-status-anand-gangers-projects.vercel.app",
    "integration-status": "https://ganger-integration-status-anand-gangers-projects.vercel.app",
    "ai-receptionist": "https://ganger-ai-receptionist-anand-gangers-projects.vercel.app",
    "call-center": "https://ganger-call-center-ops-anand-gangers-projects.vercel.app",
    "call-center-ops": "https://ganger-call-center-ops-anand-gangers-projects.vercel.app",
    "medication-auth": "https://ganger-medication-auth-anand-gangers-projects.vercel.app",
    "pharma": "https://ganger-pharma-scheduling-anand-gangers-projects.vercel.app",
    "pharma-scheduling": "https://ganger-pharma-scheduling-anand-gangers-projects.vercel.app",
    "lunch": "https://ganger-pharma-scheduling-anand-gangers-projects.vercel.app",
    "kiosk": "https://ganger-checkin-kiosk-anand-gangers-projects.vercel.app",
    "checkin-kiosk": "https://ganger-checkin-kiosk-anand-gangers-projects.vercel.app",
    "socials": "https://ganger-socials-reviews-anand-gangers-projects.vercel.app",
    "socials-reviews": "https://ganger-socials-reviews-anand-gangers-projects.vercel.app",
    "component-showcase": "https://ganger-component-showcase-anand-gangers-projects.vercel.app",
    "platform-dashboard": "https://ganger-platform-dashboard-anand-gangers-projects.vercel.app"
  }
}
EOF
echo ""
echo "5. Click 'Create'"
echo ""
echo "6. Copy the Edge Config connection string"
echo ""
echo "7. Add to Staff app's environment variables in Vercel:"
echo "   EDGE_CONFIG=<your-connection-string>"
echo ""
echo "Note: These URLs will be updated to production domains once apps are deployed with basePath"