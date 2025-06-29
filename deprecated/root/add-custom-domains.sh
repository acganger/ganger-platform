#!/bin/bash

source .env

echo "🌐 Adding custom domains to Vercel projects..."

# Add domain function
add_domain() {
  local project_id=$1
  local domain=$2
  local app_name=$3
  
  echo "Adding $domain to $app_name..."
  
  response=$(curl -s -X POST "https://api.vercel.com/v10/projects/$project_id/domains?teamId=$VERCEL_TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$domain\"}")
  
  if echo "$response" | grep -q "error"; then
    error=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error', {}).get('message', 'Unknown'))" 2>/dev/null || echo "Parse error")
    if [[ "$error" == *"already exists"* ]]; then
      echo "✅ Domain already configured"
    else
      echo "❌ Error: $error"
    fi
  else
    echo "✅ Domain added successfully"
  fi
}

# Add main domains
add_domain "prj_NF5ig8gWFVupD9CbTtb65osM1Cz7" "staff.gangerdermatology.com" "staff"
add_domain "prj_P1mgy6cw0Eemt1OkB7oaPxkQzDXW" "lunch.gangerdermatology.com" "pharma-scheduling"
add_domain "prj_2C6D48SfvOgIUrRAkphZ6H8Ehajk" "kiosk.gangerdermatology.com" "checkin-kiosk"

echo ""
echo "✅ Domain configuration complete!"
echo ""
echo "📝 Note: DNS records should already point to Vercel via Cloudflare"