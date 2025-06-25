#!/bin/bash

# Update Cloudflare DNS records to point to Vercel

CLOUDFLARE_ZONE_ID="ba76d3d3f41251c49f0365421bd644a5"
CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"

echo "🔄 Updating DNS records for Vercel deployment..."
echo "==============================================="

# First, get existing record IDs
get_record_id() {
    local name=$1
    curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records?name=$name.gangerdermatology.com" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" | \
        python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else '')"
}

# Update or create DNS record
update_dns_record() {
    local subdomain=$1
    local record_id=$(get_record_id "$subdomain")
    
    if [ -z "$record_id" ]; then
        echo "Creating new record for $subdomain.gangerdermatology.com..."
        # Create new record
        response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"type\": \"CNAME\",
                \"name\": \"$subdomain\",
                \"content\": \"cname.vercel-dns.com\",
                \"proxied\": false,
                \"ttl\": 1
            }")
    else
        echo "Updating existing record for $subdomain.gangerdermatology.com..."
        # Update existing record
        response=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$record_id" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"type\": \"CNAME\",
                \"name\": \"$subdomain\",
                \"content\": \"cname.vercel-dns.com\",
                \"proxied\": false,
                \"ttl\": 1
            }")
    fi
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Successfully updated $subdomain.gangerdermatology.com"
    else
        echo "❌ Failed to update $subdomain.gangerdermatology.com"
        echo "$response" | python3 -m json.tool
    fi
    echo
}

# Delete l10 subdomain
delete_l10() {
    local record_id=$(get_record_id "l10")
    if [ ! -z "$record_id" ]; then
        echo "Deleting l10.gangerdermatology.com..."
        response=$(curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$record_id" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json")
        
        if echo "$response" | grep -q '"success":true'; then
            echo "✅ Successfully deleted l10.gangerdermatology.com"
        else
            echo "❌ Failed to delete l10.gangerdermatology.com"
        fi
    else
        echo "ℹ️  l10.gangerdermatology.com not found (already deleted)"
    fi
    echo
}

# Update all required subdomains
echo "📡 Updating DNS records to point to Vercel..."
echo

# Delete l10 first
delete_l10

# Update the main subdomains
update_dns_record "staff"
update_dns_record "lunch"
update_dns_record "kiosk"
update_dns_record "handouts"

echo "🎉 DNS updates complete!"
echo
echo "📋 Next steps:"
echo "1. Go to Vercel Dashboard: https://vercel.com/ganger"
echo "2. Add custom domains to each project:"
echo "   - staff.gangerdermatology.com → ganger-staff"
echo "   - lunch.gangerdermatology.com → ganger-pharma-scheduling"
echo "   - kiosk.gangerdermatology.com → ganger-checkin-kiosk"
echo "   - handouts.gangerdermatology.com → ganger-handouts"
echo "3. Vercel will automatically provision SSL certificates"
echo
echo "⏱️  DNS propagation may take up to 48 hours (usually much faster)"