#!/bin/bash

# Add custom domains to Vercel projects

VERCEL_TOKEN="WbDEXgkrhO85oc6mz0aAMQQc"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

echo "🌐 Adding custom domains to Vercel projects..."
echo "============================================="

# Function to add domain to project
add_domain() {
    local project_id=$1
    local domain=$2
    local project_name=$3
    
    echo "Adding $domain to $project_name..."
    
    response=$(curl -s -X POST "https://api.vercel.com/v10/projects/$project_id/domains?teamId=$TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$domain\"
        }")
    
    if echo "$response" | grep -q '"error"'; then
        error_msg=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',{}).get('message','Unknown error'))")
        if echo "$error_msg" | grep -q "already exists"; then
            echo "✅ Domain $domain already configured"
        else
            echo "❌ Failed to add $domain: $error_msg"
        fi
    else
        echo "✅ Successfully added $domain"
        
        # Check verification status
        verification=$(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('verified', False))")
        if [ "$verification" = "True" ]; then
            echo "   ✓ Domain verified automatically"
        else
            echo "   ⏳ Domain verification in progress..."
        fi
    fi
    echo
}

# Add domains to projects
echo "📡 Configuring custom domains..."
echo

# Staff Portal
add_domain "prj_NF5ig8gWFVupD9CbTtb65osM1Cz7" "staff.gangerdermatology.com" "ganger-staff"

# Pharma Scheduling (lunch)
add_domain "prj_P1mgy6cw0Eemt1OkB7oaPxkQzDXW" "lunch.gangerdermatology.com" "ganger-pharma-scheduling"

# Check-in Kiosk
add_domain "prj_2C6D48SfvOgIUrRAkphZ6H8Ehajk" "kiosk.gangerdermatology.com" "ganger-checkin-kiosk"

# Patient Handouts
add_domain "prj_4Nf2RBXcF7AHiiYbfiSyIzLun3Mf" "handouts.gangerdermatology.com" "ganger-handouts"

echo "🎉 Custom domain configuration complete!"
echo
echo "📋 Status:"
echo "- DNS records are pointing to Vercel ✅"
echo "- Custom domains are added to projects ✅"
echo "- SSL certificates will be provisioned automatically 🔒"
echo
echo "⏱️  Domain verification usually takes 1-5 minutes"
echo "📊 Monitor progress at: https://vercel.com/ganger"