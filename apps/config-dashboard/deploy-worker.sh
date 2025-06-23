#!/bin/bash

# Deploy config-dashboard worker using Cloudflare API
API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"
WORKER_NAME="config-dashboard-staging"

echo "🚀 Deploying config-dashboard worker to staging..."

# Create the deployment payload
cat > deployment.json << 'EOF'
{
  "main": {
    "name": "worker.js",
    "content": "",
    "type": "esm"
  },
  "bindings": [
    {
      "type": "r2_bucket",
      "name": "CONFIG_DASHBOARD_BUCKET",
      "bucket_name": "config-dashboard-staging"
    }
  ],
  "compatibility_date": "2024-01-01",
  "compatibility_flags": []
}
EOF

# Read and base64 encode the worker script
WORKER_CONTENT=$(cat worker.js | base64 -w 0)

# Update the deployment payload with the worker content
jq --arg content "$WORKER_CONTENT" '.main.content = $content' deployment.json > deployment_final.json

echo "📦 Uploading worker script..."

# Deploy the worker
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @deployment_final.json

echo ""
echo "✅ Worker deployment complete!"

# Clean up temporary files
rm -f deployment.json deployment_final.json worker.js.b64

echo "🌐 Worker should be available at: https://$WORKER_NAME.$ACCOUNT_ID.workers.dev"