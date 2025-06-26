#!/bin/bash

source .env

echo "Monitoring deployment progress..."
echo "================================="
echo ""

while true; do
  clear
  echo "Deployment Status Monitor - $(date)"
  echo "================================="
  
  curl -s "https://api.vercel.com/v6/deployments?teamId=$VERCEL_TEAM_ID&limit=20" \
    -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json
from collections import Counter

data = json.load(sys.stdin)
deployments = data.get('deployments', [])

# Count states
states = Counter()
app_status = {}

for d in deployments:
    state = d.get('state', 'UNKNOWN')
    name = d.get('name', 'Unknown')
    states[state] += 1
    
    # Track unique app status (latest deployment only)
    if name not in app_status:
        app_status[name] = {
            'state': state,
            'url': d.get('url', 'N/A')
        }

# Display summary
print('\\nSummary:')
print(f'✅ READY: {states[\"READY\"]}')
print(f'🔨 BUILDING: {states[\"BUILDING\"]}')
print(f'⏳ QUEUED: {states[\"QUEUED\"]}')
print(f'❌ ERROR: {states[\"ERROR\"]}')
print(f'⚠️  CANCELED: {states[\"CANCELED\"]}')

# Show building apps
building = [name for name, info in app_status.items() if info['state'] == 'BUILDING']
if building:
    print('\\n🔨 Currently Building:')
    for app in building:
        print(f'   - {app}')

# Show ready apps
ready = [(name, info['url']) for name, info in app_status.items() if info['state'] == 'READY']
if ready:
    print('\\n✅ Successfully Deployed:')
    for app, url in ready:
        print(f'   - {app}: https://{url}')

# Show recent errors
errors = [name for name, info in app_status.items() if info['state'] == 'ERROR']
if errors and len(errors) <= 5:
    print('\\n❌ Recent Errors:')
    for app in errors[:5]:
        print(f'   - {app}')
"
  
  echo ""
  echo "Press Ctrl+C to exit. Refreshing in 30 seconds..."
  sleep 30
done