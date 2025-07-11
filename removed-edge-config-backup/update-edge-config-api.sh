#!/bin/bash

# Script to update Edge Config using Vercel API
# Based on expert recommendations for automated Edge Config management

# Load environment variables
source .env 2>/dev/null || true

# Configuration
VERCEL_TOKEN="${VERCEL_TOKEN:-$1}"
TEAM_ID="${VERCEL_TEAM_ID:-team_wpY7PcIsYQNnslNN39o7fWvS}"
EDGE_CONFIG_ID="ecfg_a1cpzdoogkmshw6hed5qhxcgd5m8"

if [ -z "$VERCEL_TOKEN" ]; then
    echo "Error: VERCEL_TOKEN is required"
    echo "Usage: $0 <VERCEL_TOKEN>"
    exit 1
fi

# App URL mappings - update these as apps are deployed
APP_URLS='{
  "appUrls": {
    "/actions": "https://ganger-actions.vercel.app",
    "/inventory": "https://inventory-ganger.vercel.app",
    "/handouts": "https://handouts-ganger.vercel.app",
    "/l10": "https://eos-l10-ganger.vercel.app",
    "/batch": "https://batch-closeout-ganger.vercel.app",
    "/compliance": "https://compliance-training-ganger.vercel.app",
    "/clinical-staffing": "https://clinical-staffing-ganger.vercel.app",
    "/config": "https://config-dashboard-ganger.vercel.app",
    "/status": "https://integration-status-ganger.vercel.app",
    "/ai-receptionist": "https://ai-receptionist-ganger.vercel.app",
    "/call-center": "https://call-center-ops-ganger.vercel.app",
    "/medication-auth": "https://medication-auth-ganger.vercel.app",
    "/pharma": "https://pharma-scheduling-ganger.vercel.app",
    "/lunch": "https://pharma-scheduling-ganger.vercel.app",
    "/kiosk": "https://checkin-kiosk-ganger.vercel.app",
    "/socials": "https://socials-reviews-ganger.vercel.app",
    "/purchasing": "https://ai-purchasing-agent-ganger.vercel.app",
    "/showcase": "https://component-showcase-ganger.vercel.app",
    "/platform": "https://platform-dashboard-ganger.vercel.app"
  }
}'

echo "Updating Edge Config via Vercel API..."
echo "Edge Config ID: $EDGE_CONFIG_ID"
echo "Team ID: $TEAM_ID"

# Update Edge Config using Vercel API
# Note: The exact API endpoint may vary - check Vercel's latest API docs
RESPONSE=$(curl -s -X PATCH \
  "https://api.vercel.com/v1/edge-config/$EDGE_CONFIG_ID/items?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$APP_URLS")

# Check if update was successful
if echo "$RESPONSE" | grep -q "error"; then
    echo "Error updating Edge Config:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 1
else
    echo "Successfully updated Edge Config!"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi

# Optional: Verify the update by reading back the config
echo -e "\nVerifying Edge Config update..."
VERIFY_RESPONSE=$(curl -s -X GET \
  "https://api.vercel.com/v1/edge-config/$EDGE_CONFIG_ID/item/appUrls?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN")

echo "Current Edge Config appUrls:"
echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"