#!/usr/bin/env python3
import subprocess
import json
import os
from collections import defaultdict

# Get environment variables
team_id = os.environ.get('VERCEL_TEAM_ID')
token = os.environ.get('VERCEL_TOKEN')

# Our 17 apps
target_apps = [
    'ai-receptionist', 'batch-closeout', 'call-center-ops', 'checkin-kiosk',
    'clinical-staffing', 'compliance-training', 'component-showcase', 'config-dashboard',
    'eos-l10', 'handouts', 'integration-status', 'inventory', 'medication-auth',
    'pharma-scheduling', 'platform-dashboard', 'socials-reviews', 'staff'
]

# Get all READY deployments
cmd = f'curl -s "https://api.vercel.com/v6/deployments?teamId={team_id}&limit=100&state=READY" -H "Authorization: Bearer {token}"'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
data = json.loads(result.stdout)
deployments = data.get('deployments', [])

# Track which apps are deployed
deployed_apps = defaultdict(list)
for d in deployments:
    name = d.get('name', '')
    url = d.get('url', '')
    # Direct name matching
    if name.startswith('ganger-'):
        app_name = name.replace('ganger-', '')
        if app_name in target_apps:
            deployed_apps[app_name].append(f'https://{url}')

print("Deployment Status for 17 Apps")
print("=" * 50)
print()

# Check each app
deployed_count = 0
for app in sorted(target_apps):
    if app in deployed_apps:
        print(f"✅ {app}: {deployed_apps[app][0]}")
        deployed_count += 1
    else:
        print(f"❌ {app}: Not deployed")

print()
print(f"Summary: {deployed_count}/17 apps successfully deployed")

# Show URLs for deployed apps
if deployed_count > 0:
    print("\nDeployed App URLs:")
    print("-" * 50)
    for app in sorted(deployed_apps.keys()):
        print(f"{app}: {deployed_apps[app][0]}")