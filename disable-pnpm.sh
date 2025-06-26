#!/bin/bash

# Source environment variables
source .env

echo "Disabling pnpm for all projects..."
echo "==================================="

# Get all projects
curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json, subprocess, time

data = json.load(sys.stdin)
projects = data.get('projects', [])

# App names we care about
app_names = [
    'ai-receptionist', 'batch-closeout', 'call-center-ops', 'checkin-kiosk',
    'clinical-staffing', 'compliance-training', 'component-showcase', 'config-dashboard',
    'eos-l10', 'handouts', 'integration-status', 'inventory', 'medication-auth',
    'pharma-scheduling', 'platform-dashboard', 'socials-reviews', 'staff'
]

for project in projects:
    project_name = project['name']
    project_id = project['id']
    
    # Check if this project matches any of our apps
    matched = False
    for app in app_names:
        if app in project_name:
            matched = True
            break
    
    if not matched:
        continue
    
    print(f'Setting ENABLE_EXPERIMENTAL_COREPACK=0 for {project_name}...')
    
    # Add environment variable to disable pnpm
    cmd = f'''curl -s -X POST \"https://api.vercel.com/v10/projects/{project_id}/env?teamId=$VERCEL_TEAM_ID\" \
        -H \"Authorization: Bearer $VERCEL_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{{
            \"key\": \"ENABLE_EXPERIMENTAL_COREPACK\",
            \"value\": \"0\",
            \"type\": \"plain\",
            \"target\": [\"production\", \"preview\", \"development\"]
        }}' '''
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if 'already exists' in result.stdout:
        print(f'  ⚠️  Variable already exists')
    elif result.returncode == 0:
        print(f'  ✅ Added successfully')
    else:
        print(f'  ❌ Failed: {result.stdout[:100]}')
    
    time.sleep(0.5)  # Rate limiting

print('\\nDone! New deployments will use npm instead of pnpm.')
"