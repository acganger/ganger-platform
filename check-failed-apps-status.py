#!/usr/bin/env python3
import subprocess
import json
import os
import time

# Get environment variables
team_id = os.environ.get('VERCEL_TEAM_ID')
token = os.environ.get('VERCEL_TOKEN')

# The 7 failed apps
failed_apps = [
    ('ganger-batch-closeout', 'batch-closeout'),
    ('ganger-eos-l10', 'eos-l10'),
    ('ganger-handouts', 'handouts'),
    ('ganger-integration-status', 'integration-status'),
    ('ganger-pharma-scheduling', 'pharma-scheduling'),
    ('ganger-socials-reviews', 'socials-reviews'),
    ('ganger-staff', 'staff')
]

print("Checking deployment status for failed apps...")
print("=" * 50)

for project_name, app_name in failed_apps:
    # Get latest deployment
    cmd = f'curl -s "https://api.vercel.com/v6/deployments?teamId={team_id}&limit=5" -H "Authorization: Bearer {token}"'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        data = json.loads(result.stdout)
        deployments = data.get('deployments', [])
        
        # Find deployment for this project
        found = False
        for d in deployments:
            if d.get('name') == project_name:
                state = d.get('state', 'UNKNOWN')
                created = d.get('created', 0)
                url = d.get('url', '')
                
                # Calculate time ago
                if created:
                    from datetime import datetime
                    created_dt = datetime.fromtimestamp(created / 1000)
                    now = datetime.now()
                    diff = now - created_dt
                    minutes = int(diff.total_seconds() / 60)
                    time_ago = f"{minutes}m ago"
                else:
                    time_ago = "Unknown"
                
                # Status emoji
                emoji = {
                    'READY': '✅',
                    'ERROR': '❌',
                    'BUILDING': '🔨',
                    'QUEUED': '⏳',
                    'INITIALIZING': '🚀'
                }.get(state, '❓')
                
                print(f"{emoji} {app_name}: {state} ({time_ago})")
                if state == 'READY':
                    print(f"   URL: https://{url}")
                found = True
                break
        
        if not found:
            print(f"❓ {app_name}: No recent deployment found")
    
    time.sleep(0.5)  # Rate limiting

print("\nNote: Only showing deployments from the last few minutes")