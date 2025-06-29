#!/bin/bash

source .env

echo "Ganger Platform - Deployment Status Report"
echo "=========================================="
echo "Generated: $(date)"
echo ""

# Get all recent deployments
curl -s "https://api.vercel.com/v6/deployments?teamId=$VERCEL_TEAM_ID&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json
from datetime import datetime
from collections import defaultdict

data = json.load(sys.stdin)
deployments = data.get('deployments', [])

# Our 17 target apps
target_apps = [
    'ai-receptionist', 'batch-closeout', 'call-center-ops', 'checkin-kiosk',
    'clinical-staffing', 'compliance-training', 'component-showcase', 'config-dashboard',
    'eos-l10', 'handouts', 'integration-status', 'inventory', 'medication-auth',
    'pharma-scheduling', 'platform-dashboard', 'socials-reviews', 'staff'
]

# Track latest deployment for each app
app_status = {}

for d in deployments:
    name = d.get('name', '')
    state = d.get('state', 'UNKNOWN')
    url = d.get('url', '')
    created = d.get('created', 0)
    
    # Extract app name
    app_name = None
    if name.startswith('ganger-'):
        potential_app = name[7:]  # Remove 'ganger-' prefix
        if potential_app in target_apps:
            app_name = potential_app
    
    if app_name and (app_name not in app_status or created > app_status[app_name]['created']):
        app_status[app_name] = {
            'state': state,
            'url': url,
            'created': created,
            'name': name
        }

# Count statuses
ready_count = sum(1 for s in app_status.values() if s['state'] == 'READY')
building_count = sum(1 for s in app_status.values() if s['state'] == 'BUILDING')
error_count = sum(1 for s in app_status.values() if s['state'] == 'ERROR')
other_count = len(app_status) - ready_count - building_count - error_count

print(f'Summary: {ready_count}/17 apps successfully deployed')
print(f'         {building_count} building, {error_count} failed, {other_count} other')
print()

# Show deployed apps
print('✅ Successfully Deployed Apps:')
print('------------------------------')
for app in sorted(target_apps):
    if app in app_status and app_status[app]['state'] == 'READY':
        url = app_status[app]['url']
        print(f'{app}: https://{url}')

# Show building apps
building_apps = [app for app in target_apps if app in app_status and app_status[app]['state'] == 'BUILDING']
if building_apps:
    print()
    print('🔨 Currently Building:')
    print('---------------------')
    for app in building_apps:
        print(f'{app}')

# Show failed apps
failed_apps = [app for app in target_apps if app in app_status and app_status[app]['state'] == 'ERROR']
if failed_apps:
    print()
    print('❌ Failed Deployments:')
    print('--------------------')
    for app in failed_apps:
        print(f'{app}')

# Show missing apps
missing_apps = [app for app in target_apps if app not in app_status]
if missing_apps:
    print()
    print('⚠️  Not Found:')
    print('-------------')
    for app in missing_apps:
        print(f'{app}')
"

echo ""
echo "Deployment URLs saved to: deployment-urls.txt"

# Also save URLs to a file
curl -s "https://api.vercel.com/v6/deployments?teamId=$VERCEL_TEAM_ID&limit=100&state=READY" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json

data = json.load(sys.stdin)
deployments = data.get('deployments', [])

urls = {}
for d in deployments:
    name = d.get('name', '')
    url = d.get('url', '')
    if name.startswith('ganger-') and name not in urls:
        urls[name] = f'https://{url}'

with open('deployment-urls.txt', 'w') as f:
    f.write('Vercel Deployment URLs\\n')
    f.write('===================\\n\\n')
    for name, url in sorted(urls.items()):
        f.write(f'{name}: {url}\\n')
"