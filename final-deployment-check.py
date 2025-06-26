#!/usr/bin/env python3
import subprocess
import json
import os
from collections import defaultdict

# Get environment variables
team_id = os.environ.get('VERCEL_TEAM_ID')
token = os.environ.get('VERCEL_TOKEN')

# Get all READY deployments
cmd = f'curl -s "https://api.vercel.com/v6/deployments?teamId={team_id}&limit=100&state=READY" -H "Authorization: Bearer {token}"'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
data = json.loads(result.stdout)
deployments = data.get('deployments', [])

# Our 17 target apps
target_apps = [
    'ai-receptionist', 'batch-closeout', 'call-center-ops', 'checkin-kiosk',
    'clinical-staffing', 'compliance-training', 'component-showcase', 'config-dashboard',
    'eos-l10', 'handouts', 'integration-status', 'inventory', 'medication-auth',
    'pharma-scheduling', 'platform-dashboard', 'socials-reviews', 'staff'
]

# Track deployed apps
deployed = set()
deployment_urls = {}

for d in deployments:
    name = d.get('name', '')
    url = d.get('url', '')
    
    if name.startswith('ganger-'):
        app_name = name[7:]  # Remove 'ganger-' prefix
        if app_name in target_apps and app_name not in deployed:
            deployed.add(app_name)
            deployment_urls[app_name] = f'https://{url}'

print("Final Deployment Status")
print("=" * 50)
print(f"\n✅ Successfully Deployed: {len(deployed)}/17\n")

# Show deployed apps
for app in sorted(target_apps):
    if app in deployed:
        print(f"✅ {app}: {deployment_urls[app]}")
    else:
        print(f"❌ {app}: Not deployed")

# Summary of previously failed apps
previously_failed = ['batch-closeout', 'eos-l10', 'handouts', 'integration-status', 
                    'pharma-scheduling', 'socials-reviews', 'staff']

print(f"\nPreviously Failed Apps Status:")
print("-" * 30)
for app in previously_failed:
    if app in deployed:
        print(f"✅ {app}: NOW DEPLOYED!")
    else:
        print(f"❌ {app}: Still not deployed")