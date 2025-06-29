#!/bin/bash

# Source environment variables
source .env

# Get all projects and their latest deployment status
echo "Checking deployment status for all apps..."
echo "=========================================="

# Get all projects
PROJECTS=$(curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); projects = data.get('projects', []); print(json.dumps(projects))")

# Parse and check each project
echo "$PROJECTS" | python3 -c "
import sys, json, subprocess, time

projects = json.load(sys.stdin)
app_names = [
    'ai-receptionist', 'batch-closeout', 'call-center-ops', 'checkin-kiosk',
    'clinical-staffing', 'compliance-training', 'component-showcase', 'config-dashboard',
    'eos-l10', 'handouts', 'integration-status', 'inventory', 'medication-auth',
    'pharma-scheduling', 'platform-dashboard', 'socials-reviews', 'staff'
]

# Create a map of app names to project info
project_map = {}
for p in projects:
    name = p['name']
    # Extract app name from project name
    for app in app_names:
        if app in name:
            project_map[app] = p
            break

# Check deployments for each app
for app in sorted(app_names):
    if app not in project_map:
        print(f'❓ {app}: No project found')
        continue
    
    project = project_map[app]
    project_id = project['id']
    
    # Get latest deployment
    cmd = f'curl -s \"https://api.vercel.com/v9/projects/{project_id}/deployments?teamId=$VERCEL_TEAM_ID&limit=1\" -H \"Authorization: Bearer $VERCEL_TOKEN\"'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        try:
            data = json.loads(result.stdout)
            deployments = data.get('deployments', [])
            
            if deployments:
                deployment = deployments[0]
                state = deployment['state']
                created = deployment['created']
                url = deployment.get('url', 'N/A')
                
                # Format state with emoji
                state_emoji = {
                    'READY': '✅',
                    'ERROR': '❌',
                    'BUILDING': '🔨',
                    'QUEUED': '⏳',
                    'CANCELED': '⚠️',
                    'INITIALIZING': '🚀'
                }.get(state, '❓')
                
                print(f'{state_emoji} {app}: {state} - {url}')
                
                # If error, try to get error message
                if state == 'ERROR':
                    error_msg = deployment.get('errorMessage', '')
                    if error_msg:
                        print(f'   Error: {error_msg}')
            else:
                print(f'❓ {app}: No deployments found')
        except:
            print(f'❓ {app}: Failed to parse deployment data')
    else:
        print(f'❓ {app}: Failed to fetch deployments')
    
    time.sleep(0.1)  # Rate limiting

print('')
print('Legend: ✅ READY | ❌ ERROR | 🔨 BUILDING | ⏳ QUEUED | 🚀 INITIALIZING | ⚠️ CANCELED')
"