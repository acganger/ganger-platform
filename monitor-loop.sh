#!/bin/bash

# Continuous monitoring loop
VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
VERCEL_TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

while true; do
    clear
    
    # Check deployments
    curl -s "https://api.vercel.com/v6/deployments?teamId=$VERCEL_TEAM_ID&limit=100" \
        -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import json, sys
from datetime import datetime

data = json.load(sys.stdin)

# All 20 apps
apps = [
    'ai-receptionist', 'batch-closeout', 'call-center-ops', 'checkin-kiosk',
    'checkout-slips', 'clinical-staffing', 'compliance-training', 'component-showcase',
    'config-dashboard', 'deployment-helper', 'eos-l10', 'handouts',
    'integration-status', 'inventory', 'llm-demo', 'medication-auth',
    'pharma-scheduling', 'platform-dashboard', 'socials-reviews', 'staff'
]

print('\\033[1;34m═══════════════════════════════════════════════════════════════════\\033[0m')
print(f'\\033[1;34m     Deployment Status - {datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")}\\033[0m')
print('\\033[1;34m═══════════════════════════════════════════════════════════════════\\033[0m')
print()

completed = 0
building = 0
failed = 0
queued = 0
not_found = 0

print('\\033[1;33mApp Name                    Status          State           Duration\\033[0m')
print('──────────────────────────────────────────────────────────────────────')

for app in apps:
    project_name = f'ganger-{app}'
    
    # Find deployments for this project
    project_deployments = [d for d in data.get('deployments', []) if d.get('name', '') == project_name]
    
    if not project_deployments:
        print(f'{app:<27} \\033[1;33m⏳ Not found\\033[0m       -               -')
        not_found += 1
    else:
        # Get most recent
        latest = sorted(project_deployments, key=lambda x: x.get('createdAt', 0), reverse=True)[0]
        state = latest.get('state', 'UNKNOWN')
        ready_state = latest.get('readyState', 'UNKNOWN')
        created = latest.get('createdAt', 0)
        
        if created:
            duration = int((datetime.now().timestamp() * 1000 - created) / 1000)
            if duration < 60:
                duration_str = f'{duration}s'
            else:
                duration_str = f'{duration // 60}m {duration % 60}s'
        else:
            duration_str = 'N/A'
        
        if state == 'READY':
            print(f'{app:<27} \\033[0;32m✅ Complete\\033[0m        {ready_state:<15} {duration_str}')
            completed += 1
        elif state in ['ERROR', 'FAILED']:
            print(f'{app:<27} \\033[0;31m❌ Failed\\033[0m          {ready_state:<15} {duration_str}')
            failed += 1
        elif state in ['BUILDING', 'DEPLOYING']:
            print(f'{app:<27} \\033[1;33m🔨 Building\\033[0m        {ready_state:<15} {duration_str}')
            building += 1
        elif state in ['QUEUED', 'INITIALIZING']:
            print(f'{app:<27} \\033[0;34m⏱️  Queued\\033[0m          {ready_state:<15} {duration_str}')
            queued += 1
        else:
            print(f'{app:<27} \\033[1;33m❓ {state}\\033[0m         {ready_state:<15} {duration_str}')

print()
print('──────────────────────────────────────────────────────────────────────')
print(f'\\033[0;32mSummary:\\033[0m')
print(f'  ✅ Completed: {completed}/20')
print(f'  🔨 Building:  {building}')
print(f'  ⏱️  Queued:    {queued}')
print(f'  ❌ Failed:    {failed}')
print(f'  ⏳ Not found: {not_found}')
print()

# Show progress bar
total = 20
progress = completed
bar_length = 40
filled = int(bar_length * progress / total)
bar = '█' * filled + '░' * (bar_length - filled)
print(f'Progress: [{bar}] {progress}/{total} ({progress*100//total}%)')
print()

if completed == 20:
    print('\\033[0;32m🎉 ALL DEPLOYMENTS COMPLETE! 🎉\\033[0m')
    sys.exit(0)
elif failed > 0:
    print(f'\\033[0;31m⚠️  {failed} deployments have failed. Check logs for details.\\033[0m')
elif building + queued > 0:
    print(f'\\033[1;33m⏳ {building + queued} deployments still in progress...\\033[0m')
"

    # Check if all complete
    if [ $? -eq 0 ]; then
        echo ""
        echo "All deployments complete!"
        break
    fi
    
    # Wait 60 seconds
    echo ""
    echo "Next check in 60 seconds... (Press Ctrl+C to stop)"
    sleep 60
done