#!/bin/bash
# Update Cloudflare DNS for Vercel Deployments

echo "🌐 Updating Cloudflare DNS for Vercel"
echo "===================================="
echo ""

# Cloudflare configuration
ZONE_ID="ba76d3d3f41251c49f0365421bd644a5"
CF_TOKEN="${CLOUDFLARE_API_TOKEN}"

# Domain mappings (app -> subdomain)
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
        -H "Content-Type: application/json" | jq -r '.result[0].id')
    
    if [ "$existing" != "null" ]; then
        # Update existing record
        curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${existing}" \
            -H "Authorization: Bearer ${CF_TOKEN}" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "CNAME",
                "name": "'${subdomain}'",
                "content": "cname.vercel-dns.com",
                "ttl": 1,
                "proxied": false
            }' > /dev/null
        echo "✅ Updated ${full_domain}"
    else
        # Create new record
        curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
            -H "Authorization: Bearer ${CF_TOKEN}" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "CNAME",
                "name": "'${subdomain}'",
                "content": "cname.vercel-dns.com",
                "ttl": 1,
                "proxied": false
            }' > /dev/null
        echo "✅ Created ${full_domain}"
    fi
}

# Main function
main() {
    if [ -z "$CF_TOKEN" ]; then
        echo "❌ Error: CLOUDFLARE_API_TOKEN not set"
        exit 1
    fi
    
    # Check for jq
    if ! command -v jq &> /dev/null; then
        echo "📦 Installing jq..."
        sudo apt-get update && sudo apt-get install -y jq
    fi
    
    echo "🔍 Updating DNS records for ${#DOMAINS[@]} apps..."
    echo ""
    
    # Update each domain
    for app in "${!DOMAINS[@]}"; do
        subdomain="${DOMAINS[$app]}"
        update_dns "$subdomain"
    done
    
    echo ""
    echo "✅ All DNS records updated!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Add these domains to your Vercel projects"
    echo "2. Vercel will automatically provision SSL certificates"
    echo "3. Your apps will be accessible at their custom domains"
}

main "$@"