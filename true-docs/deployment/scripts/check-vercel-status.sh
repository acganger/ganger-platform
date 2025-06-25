#!/bin/bash

# Check Vercel deployment status
# This script checks the status of all Ganger Platform projects in Vercel

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 Checking Vercel Project Status..."
echo "=================================="

# Check if environment variables are set
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ VERCEL_TOKEN not set${NC}"
    echo "Please run: export VERCEL_TOKEN='your-token'"
    exit 1
fi

if [ -z "$VERCEL_TEAM_ID" ]; then
    export VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"
    echo -e "${YELLOW}⚠️  Using default VERCEL_TEAM_ID: $VERCEL_TEAM_ID${NC}"
fi

# Function to check projects
check_projects() {
    echo -e "\n${GREEN}📦 Checking Projects...${NC}"
    
    local response=$(curl -s "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID&limit=100" \
        -H "Authorization: Bearer $VERCEL_TOKEN")
    
    local project_count=$(echo "$response" | python3 -c "
import json, sys
data = json.load(sys.stdin)
projects = [p for p in data.get('projects', []) if p.get('name', '').startswith('ganger-')]
print(len(projects))
")
    
    echo "Total Ganger projects found: $project_count"
    
    if [ "$project_count" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No projects found. They may not be visible until first deployment.${NC}"
        return
    fi
    
    echo "$response" | python3 -c "
import json, sys
from datetime import datetime

data = json.load(sys.stdin)
projects = [p for p in data.get('projects', []) if p.get('name', '').startswith('ganger-')]

print('\nProject List:')
print('-' * 60)
for p in sorted(projects, key=lambda x: x.get('name', '')):
    name = p.get('name', 'unknown')
    has_deploy = len(p.get('latestDeployments', [])) > 0
    status = '✅ Deployed' if has_deploy else '⏳ Awaiting deployment'
    print(f'{name:<35} {status}')
"
}

# Function to check recent deployments
check_deployments() {
    echo -e "\n${GREEN}🚀 Checking Recent Deployments...${NC}"
    
    local response=$(curl -s "https://api.vercel.com/v6/deployments?teamId=$VERCEL_TEAM_ID&limit=20" \
        -H "Authorization: Bearer $VERCEL_TOKEN")
    
    local deploy_count=$(echo "$response" | python3 -c "
import json, sys
data = json.load(sys.stdin)
deploys = [d for d in data.get('deployments', []) if d.get('name', '').startswith('ganger-')]
print(len(deploys))
")
    
    echo "Recent Ganger deployments: $deploy_count"
    
    if [ "$deploy_count" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No deployments found yet.${NC}"
        return
    fi
    
    echo "$response" | python3 -c "
import json, sys
from datetime import datetime

data = json.load(sys.stdin)
deployments = [d for d in data.get('deployments', []) if d.get('name', '').startswith('ganger-')]

print('\nRecent Deployments:')
print('-' * 80)
print(f'{\"Project\":<30} {\"State\":<15} {\"Ready\":<15} {\"Time\":<20}')
print('-' * 80)

for d in sorted(deployments[:10], key=lambda x: x.get('createdAt', 0), reverse=True):
    name = d.get('name', 'unknown')
    state = d.get('state', 'UNKNOWN')
    ready = d.get('readyState', 'UNKNOWN')
    created = d.get('createdAt', 0)
    if created:
        created_str = datetime.fromtimestamp(created/1000).strftime('%Y-%m-%d %H:%M:%S')
    else:
        created_str = 'Unknown'
    
    # Add color based on state
    if state == 'READY':
        state_str = '✅ ' + state
    elif state == 'ERROR':
        state_str = '❌ ' + state
    elif state == 'BUILDING':
        state_str = '🔨 ' + state
    else:
        state_str = '⏳ ' + state
    
    print(f'{name:<30} {state_str:<15} {ready:<15} {created_str:<20}')
"
}

# Main execution
echo -e "${GREEN}Team ID:${NC} $VERCEL_TEAM_ID"
echo -e "${GREEN}API Endpoint:${NC} https://api.vercel.com"
echo ""

check_projects
check_deployments

echo -e "\n${GREEN}📋 Next Steps:${NC}"
echo "1. If no projects are visible, check the Vercel dashboard directly"
echo "2. Push a commit to trigger deployments"
echo "3. Monitor https://vercel.com/ganger for build progress"
echo ""
echo "Dashboard URL: https://vercel.com/ganger"