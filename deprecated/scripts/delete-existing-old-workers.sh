#!/bin/bash

# Cloudflare API credentials
API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"

# Array of workers to delete (filtered to only those that exist)
WORKERS=(
  "ganger-batch-closeout-prod"
  "ganger-batch-closeout-staging"
  "ganger-component-showcase-staging"
  "ganger-eos-l10-staging"
  "ganger-handouts-patient"
  "ganger-handouts-staff"
  "ganger-integration-status"
  "ganger-integration-status-prod"
  "ganger-kiosk-admin"
  "ganger-kiosk-patient"
  "ganger-l10-production"
  "ganger-l10-staff"
  "ganger-l10-staff-staging"
  "ganger-l10-staff-v3"
  "ganger-medication-auth-prod"
  "ganger-meds-patient"
  "ganger-meds-staff"
  "ganger-pharma-scheduling-prod"
  "ganger-platform-production-production"
  "ganger-socials-reviews-production"
  "ganger-staff-portal-production"
  "integration-status"
  "integration-status-production"
  "integration-status-staging"
  "inventory-management-staging"
  "medication-auth"
  "medication-auth-production"
  "medication-auth-staging"
)

# Workers we want to keep
KEEP_WORKERS=(
  "ganger-medical-production"
  "staff-portal-router-production"
  "ganger-business-production"
  "staff-portal-router"
)

echo "🧹 Starting cleanup of old Cloudflare Workers..."
echo "Total workers to delete: ${#WORKERS[@]}"
echo ""
echo "⚠️  The following workers will be KEPT:"
for worker in "${KEEP_WORKERS[@]}"; do
  echo "   ✅ $worker"
done
echo ""

# Counter for tracking progress
deleted=0
failed=0
skipped=0

# Delete each worker
for worker in "${WORKERS[@]}"; do
  # Check if this worker is in the keep list
  if [[ " ${KEEP_WORKERS[@]} " =~ " ${worker} " ]]; then
    echo "⏭️  Skipping $worker (in keep list)"
    ((skipped++))
    continue
  fi
  
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
echo "⏭️  Skipped (in keep list): $skipped workers"
echo ""
echo "✨ Cleanup complete!"