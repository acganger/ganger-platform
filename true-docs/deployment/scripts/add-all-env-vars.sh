#!/bin/bash

# Add environment variables to all Vercel projects
# This script adds the required env vars to each project

set -e

# Check for token
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN not set"
    echo "The token should be in memory according to the user"
    exit 1
fi

TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Project IDs
declare -A PROJECTS=(
    ["inventory"]="prj_AC868NXvUCZHXUyCyA9AOWRtabu8"
    ["handouts"]="prj_4Nf2RBXcF7AHiiYbfiSyIzLun3Mf"
    ["eos-l10"]="prj_tFLTyosnL10AAsFsOaagVgIS2aoi"
    ["batch-closeout"]="prj_gYrNhjrxXEPg5upvst4opPpiYVGa"
    ["compliance-training"]="prj_nyXefRjw3vRhQmJBh4jQ38AtuPTd"
    ["clinical-staffing"]="prj_UXfHT3CiTwBcaf0FAByPj7Keh7dN"
    ["config-dashboard"]="prj_RfI3tADUf1OFJ2iVyE4eoXdsHapR"
    ["integration-status"]="prj_p7qMv4639vUURlvAEH9VRU96DrSR"
    ["ai-receptionist"]="prj_rX2RWwl80vNGkLN6RAFgRaMtZb9z"
    ["call-center-ops"]="prj_XfvjRr8Vc1aBiDJ8M3dT5HdiGul3"
    ["medication-auth"]="prj_2ahWES85ADV8axKY2xJmmtCzky6n"
    ["pharma-scheduling"]="prj_P1mgy6cw0Eemt1OkB7oaPxkQzDXW"
    ["checkin-kiosk"]="prj_2C6D48SfvOgIUrRAkphZ6H8Ehajk"
    ["socials-reviews"]="prj_yVy0L8Kr5piNFfeU3pThMUHyNjjL"
    ["component-showcase"]="prj_u0YlA5N4X4f46ayy4BPfdO4sFpb7"
    ["platform-dashboard"]="prj_zqa9o0iyrPsm8tURW9tiljBjuIwN"
    ["staff"]="prj_NF5ig8gWFVupD9CbTtb65osM1Cz7"
)

# Function to add env var
add_env_var() {
    local project_id=$1
    local key=$2
    local value=$3
    
    echo "  Adding $key..."
    
    response=$(curl -s -X POST "https://api.vercel.com/v10/projects/$project_id/env?teamId=$TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$key\",
            \"value\": \"$value\",
            \"type\": \"encrypted\",
            \"target\": [\"production\", \"preview\", \"development\"]
        }")
    
    if echo "$response" | grep -q "error"; then
        if echo "$response" | grep -q "already exists"; then
            echo "    ⚠️  $key already exists"
        else
            echo "    ❌ Failed to add $key: $response"
        fi
    else
        echo "    ✓ Added $key"
    fi
}

echo "🚀 Adding environment variables to all Vercel projects..."
echo ""

# Critical environment variables
for app_name in "${!PROJECTS[@]}"; do
    project_id="${PROJECTS[$app_name]}"
    echo "📦 Processing $app_name ($project_id)..."
    
    # Database
    add_env_var "$project_id" "DATABASE_URL" "postgresql://postgres:password@localhost:54322/postgres"
    add_env_var "$project_id" "DIRECT_URL" "postgresql://postgres:password@localhost:54322/postgres"
    
    # Supabase
    add_env_var "$project_id" "NEXT_PUBLIC_SUPABASE_URL" "https://pfqtzmxxxhhsxmlddrta.supabase.co"
    add_env_var "$project_id" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s"
    add_env_var "$project_id" "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA5ODUyNCwiZXhwIjoyMDY0Njc0NTI0fQ.F1sML4ob29QmG_-_zuG5o7mi4k9E2FAew3GDtXuLezo"
    
    # NextAuth
    add_env_var "$project_id" "NEXTAUTH_URL" "https://${app_name}.vercel.app"
    add_env_var "$project_id" "NEXTAUTH_SECRET" "your-nextauth-secret-here"
    
    # Google OAuth
    add_env_var "$project_id" "GOOGLE_CLIENT_ID" "745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com"
    add_env_var "$project_id" "GOOGLE_CLIENT_SECRET" "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"
    
    # App URLs
    add_env_var "$project_id" "NEXT_PUBLIC_STAFF_URL" "https://staff.gangerdermatology.com"
    add_env_var "$project_id" "NEXT_PUBLIC_LUNCH_URL" "https://lunch.gangerdermatology.com"
    add_env_var "$project_id" "NEXT_PUBLIC_L10_URL" "https://l10.gangerdermatology.com"
    
    # Other
    add_env_var "$project_id" "NODE_ENV" "production"
    add_env_var "$project_id" "SECURITY_SALT" "V1ny@C0nstruct10n2025!"
    add_env_var "$project_id" "HEALTH_CHECK_KEY" "K9x2mP4nQ8wL5vB7"
    
    echo "✅ Completed $app_name"
    echo ""
done

echo "🎉 All environment variables have been added!"
echo ""
echo "📋 Next steps:"
echo "1. Trigger new deployments:"
echo "   git commit --allow-empty -m 'deploy: with environment variables configured'"
echo "   git push origin main"
echo "2. Monitor deployment status in Vercel dashboard"
echo "3. Check build logs if any deployments fail"