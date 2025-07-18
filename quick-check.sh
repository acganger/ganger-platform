#!/bin/bash

echo "🔍 Checking Vercel Deployment Status..."
echo ""

# Check recent deployments
echo "📊 Recent Deployments:"
curl -s "https://api.vercel.com/v6/deployments?teamId=team_wpY7PcIsYQNnslNN39o7fWvS&limit=5" \
  -H "Authorization: Bearer RdwA23mHSvPcm9ptReM6zxjF" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
for d in data.get('deployments', []):
    print(f\"  {d['name']}: {d['state']} - {d['url']} - {d['created']}\")
"

echo ""
echo "📦 Checking ganger-staff project:"
curl -s "https://api.vercel.com/v9/projects?teamId=team_wpY7PcIsYQNnslNN39o7fWvS" \
  -H "Authorization: Bearer RdwA23mHSvPcm9ptReM6zxjF" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
projects = [p['name'] for p in data.get('projects', [])]
print(f\"Total projects: {len(projects)}\")
if 'ganger-staff' in projects:
    print('✅ ganger-staff project exists')
else:
    print('❌ ganger-staff project NOT FOUND')
print(f\"\\nAll projects: {', '.join(sorted(projects[:10]))}...\")
"