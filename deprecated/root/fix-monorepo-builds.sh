#!/bin/bash

# Source environment variables
source .env

echo "Updating all projects for proper monorepo builds..."
echo "================================================="

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

updated = 0

for project in projects:
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
    
    print(f'Updating {matched_app} ({project_name})...')
    
    # Use turbo with proper monorepo commands
    update_data = {
        'framework': 'nextjs',
        'buildCommand': 'cd ../.. && npm run build -- --filter=@ganger/' + matched_app,
        'installCommand': 'cd ../.. && npm install',
        'outputDirectory': 'apps/' + matched_app + '/.next',
        'rootDirectory': './',
        'nodeVersion': '20.x'
    }
    
    cmd = f'''curl -s -X PATCH \"https://api.vercel.com/v9/projects/{project_id}?teamId=$VERCEL_TEAM_ID\" \
        -H \"Authorization: Bearer $VERCEL_TOKEN\" \
        -H \"Content-Type: application/json\" \
        -d '{json.dumps(update_data)}' '''
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode == 0 and '\"id\"' in result.stdout:
        print(f'  ✅ Updated for monorepo build')
        updated += 1
    else:
        print(f'  ❌ Failed')
    
    time.sleep(0.5)

print(f'\\nTotal updated: {updated}')
"