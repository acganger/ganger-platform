#!/bin/bash

# Production worker deployment using form data
API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"
WORKER_NAME="config-dashboard-production"
ZONE_ID="ba76d3d3f41251c49f0365421bd644a5"

echo "🚀 Deploying config-dashboard worker to production..."

# Create metadata file
cat > metadata.json << 'EOF'
{
  "body_part": "script",
  "bindings": [
    {
      "type": "r2_bucket",
      "name": "CONFIG_DASHBOARD_BUCKET",
      "bucket_name": "configdashboard"
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
  -F "script=@worker-service.js;type=application/javascript"

echo ""
echo "✅ Worker deployment complete!"

echo "🌐 Setting up custom domain route..."

# Create custom domain route
curl -X POST \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "pattern": "config.gangerdermatology.com/*",
    "script": "'$WORKER_NAME'"
  }'

echo ""
echo "✅ Production deployment complete!"
echo "🌐 Available at: https://config.gangerdermatology.com"

# Clean up
rm -f metadata.json