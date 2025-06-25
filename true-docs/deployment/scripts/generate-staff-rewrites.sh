#!/bin/bash

# Generate vercel.json rewrites for Staff Portal router
# This configures the staff portal to proxy requests to individual app deployments

export VERCEL_TOKEN="WbDEXgkrhO85oc6mz0aAMQQc"
export VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🔍 Fetching deployment URLs..."

# Get current deployments and generate vercel.json
curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import json
import sys

data = json.load(sys.stdin)
projects = [p for p in data.get('projects', []) if p.get('name', '').startswith('ganger-')]

# App path mappings
app_paths = {
    'ganger-inventory': '/inventory',
    'ganger-handouts': '/handouts',
    'ganger-checkin-kiosk': '/kiosk',
    'ganger-medication-auth': '/meds',
    'ganger-eos-l10': '/l10',
    'ganger-compliance-training': '/compliance',
    'ganger-clinical-staffing': '/staffing',
    'ganger-socials-reviews': '/socials',
    'ganger-config-dashboard': '/config',
    'ganger-integration-status': '/status',
    'ganger-ai-receptionist': '/ai',
    'ganger-call-center-ops': '/call-center',
    'ganger-pharma-scheduling': '/reps',
    'ganger-component-showcase': '/showcase',
    'ganger-batch-closeout': '/batch',
    'ganger-platform-dashboard': '/platform'
}

# Generate rewrites
rewrites = []
for p in projects:
    name = p.get('name', '')
    if name in app_paths and name != 'ganger-staff':
        latest = p.get('latestDeployments', [])
        if latest and latest[0].get('readyState') == 'READY':
            url = latest[0].get('url', '')
            if url:
                path = app_paths[name]
                rewrite = {
                    'source': f'{path}/:path*',
                    'destination': f'https://{url}{path}/:path*'
                }
                rewrites.append(rewrite)

# Create vercel.json content
vercel_config = {
    'installCommand': 'cd ../.. && npm install -g pnpm && pnpm install',
    'buildCommand': 'cd ../.. && pnpm build:staff',
    'outputDirectory': 'apps/staff/.next',
    'framework': None,
    'rewrites': rewrites
}

# Write to file
with open('apps/staff/vercel.json', 'w') as f:
    json.dump(vercel_config, f, indent=2)

print(f'✅ Generated vercel.json with {len(rewrites)} rewrites')
print()
print('Rewrites configured:')
for r in rewrites:
    print(f\"  {r['source']} → {r['destination']}\")
"

echo ""
echo "📋 Next steps:"
echo "1. Review apps/staff/vercel.json"
echo "2. Deploy staff portal: cd apps/staff && vercel --prod"
echo "3. Configure custom domain to point to staff deployment"