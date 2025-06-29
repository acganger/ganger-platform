#!/bin/bash

# Cloudflare API credentials
API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"

# Array of workers to delete
WORKERS=(
  "config-dashboard-production"
  "config-dashboard-staging"
  "ganger-ai-receptionist-prod"
  "ganger-ai-receptionist-production"
  "ganger-batch-closeout"
  "ganger-batch-closeout-production"
  "ganger-call-center-production"
  "ganger-checkin-kiosk-production"
  "ganger-checkin-kiosk-staging"
  "ganger-compliance-staff-production"
  "ganger-component-showcase-production"
  "ganger-config-dashboard-production"
  "ganger-eos-l10-prod"
  "ganger-eos-l10-production"
  "ganger-eos-l10-v2"
  "ganger-handouts-production"
  "ganger-handouts-staging"
  "ganger-inventory-production"
  "ganger-inventory-staging"
  "ganger-kiosk-patient-production"
  "ganger-lunch-production"
  "ganger-lunch-staging"
  "ganger-medication-auth-production"
  "ganger-medication-auth-staging"
  "ganger-pharma-scheduling-production"
  "ganger-pharma-scheduling-staging"
  "ganger-platform-status-production"
  "ganger-social-reviews-production"
  "ganger-socials-staff-production"
  "ganger-staff-production"
  "ganger-staff-staging"
  "ganger-staffing-staff-production"
  "handouts-ganger"
  "inventory-ganger"
  "l10-staging"
  "pharma-scheduling-ganger"
  "staff-production"
  "staff-staging"
)

echo "🧹 Starting cleanup of old Cloudflare Workers..."
echo "Total workers to delete: ${#WORKERS[@]}"
echo ""

# Counter for tracking progress
deleted=0
failed=0

# Delete each worker
for worker in "${WORKERS[@]}"; do
  echo -n "Deleting $worker... "
  
  response=$(curl -s -X DELETE \
    "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$worker" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")
  
  # Check if the deletion was successful
  if echo "$response" | grep -q '"success":true'; then
    echo "✅ Deleted"
    ((deleted++))
  else
    # Extract error message if available
    error=$(echo "$response" | grep -o '"message":"[^"]*"' | sed 's/"message":"//g' | sed 's/"//g')
    if [ -z "$error" ]; then
      error="Unknown error"
    fi
    echo "❌ Failed: $error"
    ((failed++))
  fi
done

echo ""
echo "🎯 Cleanup Summary:"
echo "✅ Successfully deleted: $deleted workers"
echo "❌ Failed to delete: $failed workers"
echo ""
echo "✨ Cleanup complete!"