#!/bin/bash

# Add env vars to remaining apps that failed deployment

set -e

VERCEL_TOKEN="WbDEXgkrhO85oc6mz0aAMQQc"
TEAM_ID="team_wpY7PcIsYQNnslNN39o7fWvS"

# Remaining apps that need env vars
declare -A REMAINING_APPS=(
    ["handouts"]="prj_4Nf2RBXcF7AHiiYbfiSyIzLun3Mf"
    ["integration-status"]="prj_p7qMv4639vUURlvAEH9VRU96DrSR"
    ["medication-auth"]="prj_2ahWES85ADV8axKY2xJmmtCzky6n"
    ["pharma-scheduling"]="prj_P1mgy6cw0Eemt1OkB7oaPxkQzDXW"
    ["staff"]="prj_NF5ig8gWFVupD9CbTtb65osM1Cz7"
)

# Function to add env var
add_env_var() {
    local project_id=$1
    local key=$2
    local value=$3
    
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
            echo "    ❌ Failed: $response"
        fi
    else
        echo "    ✓ Added $key"
    fi
}

echo "🚀 Adding environment variables to remaining apps..."
echo ""

# Process remaining apps
for app_name in "${!REMAINING_APPS[@]}"; do
    project_id="${REMAINING_APPS[$app_name]}"
    echo "📦 Processing $app_name ($project_id)..."
    
    # Critical env vars
    add_env_var "$project_id" "DATABASE_URL" "postgresql://postgres:password@localhost:54322/postgres"
    add_env_var "$project_id" "DIRECT_URL" "postgresql://postgres:password@localhost:54322/postgres"
    add_env_var "$project_id" "NEXT_PUBLIC_SUPABASE_URL" "https://pfqtzmxxxhhsxmlddrta.supabase.co"
    add_env_var "$project_id" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s"
    add_env_var "$project_id" "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA5ODUyNCwiZXhwIjoyMDY0Njc0NTI0fQ.F1sML4ob29QmG_-_zuG5o7mi4k9E2FAew3GDtXuLezo"
    add_env_var "$project_id" "NEXTAUTH_URL" "https://ganger-${app_name}.vercel.app"
    add_env_var "$project_id" "NEXTAUTH_SECRET" "your-nextauth-secret-here"
    add_env_var "$project_id" "GOOGLE_CLIENT_ID" "745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com"
    add_env_var "$project_id" "GOOGLE_CLIENT_SECRET" "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"
    add_env_var "$project_id" "NODE_ENV" "production"
    
    echo "✅ Completed $app_name"
    echo ""
done

echo "🎉 Finished adding env vars to remaining apps!"
echo ""
echo "📋 These apps should now rebuild automatically."