#!/bin/bash
# Update Cloudflare DNS to point to Vercel deployments

echo "🌐 Updating Cloudflare DNS for Vercel"
echo "===================================="
echo ""

# Cloudflare configuration (using your existing token)
ZONE_ID="ba76d3d3f41251c49f0365421bd644a5"
CF_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"

# Domain mappings
declare -A DOMAINS=(
    ["eos-l10"]="l10"
    ["inventory"]="inventory"
    ["handouts"]="handouts"
    ["checkin-kiosk"]="kiosk"
    ["medication-auth"]="meds"
    ["clinical-staffing"]="staffing"
    ["pharma-scheduling"]="pharma"
    ["batch-closeout"]="batch"
    ["billing-ops"]="billing"
    ["compliance-training"]="compliance"
    ["treatment-outcomes"]="outcomes"
    ["ai-receptionist"]="ai"
    ["demo"]="demo"
    ["staff"]="staff-app"
)

# Function to create/update DNS record
update_dns() {
    local subdomain=$1
    local full_domain="${subdomain}.gangerdermatology.com"
    
    echo "📝 Updating DNS for ${full_domain}..."
    
    # Check if record exists
    existing=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${full_domain}" \
        -H "Authorization: Bearer ${CF_TOKEN}" \
        -H "Content-Type: application/json" | jq -r '.result[0].id' 2>/dev/null || echo "null")
    
    if [ "$existing" != "null" ] && [ -n "$existing" ]; then
        # Update existing record
        result=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${existing}" \
            -H "Authorization: Bearer ${CF_TOKEN}" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "CNAME",
                "name": "'${subdomain}'",
                "content": "cname.vercel-dns.com",
                "ttl": 1,
                "proxied": false
            }')
        
        if echo "$result" | jq -e '.success' > /dev/null; then
            echo "✅ Updated ${full_domain} → cname.vercel-dns.com"
        else
            echo "❌ Failed to update ${full_domain}"
            echo "$result" | jq '.errors'
        fi
    else
        # Create new record
        result=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
            -H "Authorization: Bearer ${CF_TOKEN}" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "CNAME",
                "name": "'${subdomain}'",
                "content": "cname.vercel-dns.com",
                "ttl": 1,
                "proxied": false
            }')
        
        if echo "$result" | jq -e '.success' > /dev/null; then
            echo "✅ Created ${full_domain} → cname.vercel-dns.com"
        else
            echo "❌ Failed to create ${full_domain}"
            echo "$result" | jq '.errors'
        fi
    fi
}

# Main function
main() {
    # Check for jq
    if ! command -v jq &> /dev/null; then
        echo "📦 Installing jq..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install jq
        else
            sudo apt-get update && sudo apt-get install -y jq
        fi
    fi
    
    echo "🔍 Updating DNS records for ${#DOMAINS[@]} apps..."
    echo "Zone: gangerdermatology.com"
    echo ""
    
    # Update each domain
    for app in "${!DOMAINS[@]}"; do
        subdomain="${DOMAINS[$app]}"
        update_dns "$subdomain"
    done
    
    echo ""
    echo "✅ DNS updates complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to each Vercel project and add the custom domain"
    echo "2. Vercel will automatically provision SSL certificates"
    echo "3. Your apps will be live at:"
    for app in "${!DOMAINS[@]}"; do
        echo "   https://${DOMAINS[$app]}.gangerdermatology.com"
    done
}

main "$@"