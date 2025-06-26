#!/usr/bin/env python3
import subprocess
import json
import os
import time

# Get environment variables
team_id = os.environ.get('VERCEL_TEAM_ID')
token = os.environ.get('VERCEL_TOKEN')

# Get all projects
cmd = f'curl -s "https://api.vercel.com/v9/projects?teamId={team_id}&limit=100" -H "Authorization: Bearer {token}"'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
data = json.loads(result.stdout)
projects = data.get('projects', [])

print("Checking deployment status...")
print("=" * 40)

ready = []
building = []
queued = []
error = []

for project in projects:
    # Get latest deployment
    cmd = f'curl -s "https://api.vercel.com/v6/deployments?projectId={project["id"]}&teamId={team_id}&limit=1" -H "Authorization: Bearer {token}"'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        deploy_data = json.loads(result.stdout)
        deployments = deploy_data.get('deployments', [])
        
        if deployments:
            deployment = deployments[0]
            state = deployment.get('state', 'UNKNOWN')
            
            if state == 'READY':
                ready.append(project['name'])
            elif state == 'BUILDING':
                building.append(project['name'])
            elif state == 'QUEUED':
                queued.append(project['name'])
            elif state == 'ERROR':
                error.append(project['name'])
    
    time.sleep(0.1)  # Rate limiting

print(f"\n✅ READY ({len(ready)}):")
for name in ready[:5]:
    print(f"   - {name}")
if len(ready) > 5:
    print(f"   ... and {len(ready) - 5} more")

print(f"\n🔨 BUILDING ({len(building)}):")
for name in building:
    print(f"   - {name}")

print(f"\n⏳ QUEUED ({len(queued)}):")
for name in queued[:5]:
    print(f"   - {name}")
if len(queued) > 5:
    print(f"   ... and {len(queued) - 5} more")

print(f"\n❌ ERROR ({len(error)}):")
for name in error[:5]:
    print(f"   - {name}")
if len(error) > 5:
    print(f"   ... and {len(error) - 5} more")

print(f"\nTotal: {len(ready)} ready, {len(building)} building, {len(queued)} queued, {len(error)} errors")