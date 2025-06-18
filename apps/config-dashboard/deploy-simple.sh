#!/bin/bash

# Simple worker deployment using form data
API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"
WORKER_NAME="config-dashboard-staging"

echo "🚀 Deploying config-dashboard worker to staging..."

# Create metadata file
cat > metadata.json << 'EOF'
{
  "body_part": "script",
  "bindings": [
    {
      "type": "r2_bucket",
      "name": "CONFIG_DASHBOARD_BUCKET",
      "bucket_name": "config-dashboard-staging"
    }
  ],
  "compatibility_date": "2024-01-01"
}
EOF

echo "📦 Uploading worker script..."

# Deploy using multipart form data
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "metadata=@metadata.json;type=application/json" \
  -F "script=@worker.js;type=application/javascript"

echo ""
echo "✅ Worker deployment complete!"

# Clean up
rm -f metadata.json

echo "🌐 Worker should be available at: https://$WORKER_NAME.$ACCOUNT_ID.workers.dev"