#!/bin/bash

source .env

PROJECT_NAME=${1:-"ganger-ai-receptionist"}
PROJECT_ID=${2:-"prj_rX2RWwl80vNGkLN6RAFgRaMtZb9z"}

echo "Getting deployment logs for $PROJECT_NAME..."

# Get latest deployment
DEPLOYMENT=$(curl -s "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&teamId=$VERCEL_TEAM_ID&limit=1" \
  -H "Authorization: Bearer $VERCEL_TOKEN")

DEPLOY_ID=$(echo "$DEPLOYMENT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['deployments'][0]['uid'] if data.get('deployments') else '')")

if [ -z "$DEPLOY_ID" ]; then
  echo "No deployment found"
  exit 1
fi

echo "Deployment ID: $DEPLOY_ID"
echo ""

# Try to get build logs
echo "Build output:"
curl -s "https://api.vercel.com/v2/deployments/$DEPLOY_ID/events?teamId=$VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)

if isinstance(data, list):
    events = data
else:
    events = data.get('events', [])

for event in events:
    if event.get('type') == 'stdout' or event.get('type') == 'stderr':
        text = event.get('text', '')
        if text:
            print(text)
"