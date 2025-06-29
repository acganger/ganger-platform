#!/bin/bash
# Quick cancel all deployments

echo "🛑 Canceling all active deployments..."

VERCEL_TOKEN="RdwA23mHSvPcm9ptReM6zxjF"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Get all active deployments
DEPLOYMENTS=$(curl -s "https://api.vercel.com/v6/deployments?teamId=${TEAM_ID}&limit=100&state=BUILDING,QUEUED,INITIALIZING" \
  -H "Authorization: Bearer $VERCEL_TOKEN")

# Count deployments
COUNT=$(echo "$DEPLOYMENTS" | python3 -c "
import json,sys
data = json.load(sys.stdin)
print(len(data.get('deployments', [])))
")

echo "Found $COUNT active deployments"

if [ "$COUNT" -eq 0 ]; then
  echo "✅ No deployments to cancel"
  exit 0
fi

# Cancel all deployments
echo "$DEPLOYMENTS" | python3 -c "
import json
import sys
import subprocess
import time

data = json.load(sys.stdin)
deployments = data.get('deployments', [])

print(f'Canceling {len(deployments)} deployments...')

token = '$VERCEL_TOKEN'
team_id = '$TEAM_ID'

canceled = 0
failed = 0

for d in deployments:
    dep_id = d.get('uid', d.get('id'))
    if dep_id:
        cmd = [
            'curl', '-s', '-X', 'PATCH',
            f'https://api.vercel.com/v13/deployments/{dep_id}/cancel?teamId={team_id}',
            '-H', f'Authorization: Bearer {token}',
            '-H', 'Content-Type: application/json'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if 'CANCELED' in result.stdout or 'already' in result.stdout:
            canceled += 1
        else:
            failed += 1
        
        # Progress indicator
        if (canceled + failed) % 10 == 0:
            print(f'  Progress: {canceled + failed}/{len(deployments)}')
        
        time.sleep(0.2)  # Rate limiting

print(f'\\n✅ Canceled: {canceled}')
if failed > 0:
    print(f'❌ Failed: {failed}')
"

echo ""
echo "✅ Done! Your Vercel environment is now clean."
echo ""
echo "Next: Run ./sequential-deploy.sh to start fresh deployments"