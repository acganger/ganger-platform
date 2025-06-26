#!/bin/bash

# Source environment variables
source .env

echo "Checking deployment status for all projects..."
echo "============================================="
echo ""

# Check all projects including both naming conventions
curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json, subprocess, time
from datetime import datetime

data = json.load(sys.stdin)
projects = data.get('projects', [])

# App names we care about
app_names = [
    'ai-receptionist', 'batch-closeout', 'call-center-ops', 'checkin-kiosk',
    'clinical-staffing', 'compliance-training', 'component-showcase', 'config-dashboard',
    'eos-l10', 'handouts', 'integration-status', 'inventory', 'medication-auth',
    'pharma-scheduling', 'platform-dashboard', 'socials-reviews', 'staff'
]

# Check each project
for project in sorted(projects, key=lambda x: x['name']):
    project_name = project['name']
    project_id = project['id']
    
    # Check if this project matches any of our apps
    matched_app = None
    for app in app_names:
        if app in project_name:
            matched_app = app
            break
    
    if not matched_app:
        continue
    
    # Get latest deployment
    cmd = f'curl -s \"https://api.vercel.com/v6/deployments?projectId={project_id}&teamId=$VERCEL_TEAM_ID&limit=1\" -H \"Authorization: Bearer $VERCEL_TOKEN\"'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        try:
            deploy_data = json.loads(result.stdout)
            deployments = deploy_data.get('deployments', [])
            
            if deployments:
                deployment = deployments[0]
                state = deployment.get('state', 'UNKNOWN')
                created = deployment.get('created', 0)
                url = deployment.get('url', 'N/A')
                
                # Calculate time ago
                if created:
                    created_dt = datetime.fromtimestamp(created / 1000)
                    now = datetime.now()
                    diff = now - created_dt
                    if diff.total_seconds() < 60:
                        time_ago = f'{int(diff.total_seconds())}s ago'
                    elif diff.total_seconds() < 3600:
                        time_ago = f'{int(diff.total_seconds() / 60)}m ago'
                    else:
                        time_ago = f'{int(diff.total_seconds() / 3600)}h ago'
                else:
                    time_ago = 'Unknown'
                
                # Format state with emoji
                state_emoji = {
                    'READY': '✅',
                    'ERROR': '❌', 
                    'BUILDING': '🔨',
                    'QUEUED': '⏳',
                    'CANCELED': '⚠️',
                    'INITIALIZING': '🚀'
                }.get(state, '❓')
                
                print(f'{state_emoji} {matched_app} ({project_name}): {state} - {time_ago}')
                
                # If building or error, show more details
                if state in ['BUILDING', 'ERROR']:
                    if state == 'ERROR':
                        error_msg = deployment.get('errorMessage', 'No error message')
                        print(f'   Error: {error_msg[:100]}')
                    else:
                        print(f'   URL: https://{url}')
            else:
                print(f'❓ {matched_app} ({project_name}): No deployments')
        except Exception as e:
            print(f'❓ {matched_app} ({project_name}): Error parsing data')
    
    time.sleep(0.1)  # Rate limiting

print('')
print('Legend: ✅ READY | ❌ ERROR | 🔨 BUILDING | ⏳ QUEUED | 🚀 INITIALIZING | ⚠️ CANCELED')
"