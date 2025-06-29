#!/bin/bash

# Generate curl commands to add environment variables
# Run this script and it will output all the commands you need

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

# Critical environment variables needed for build
declare -A CRITICAL_VARS=(
    ["NEXT_PUBLIC_SUPABASE_URL"]="https://pfqtzmxxxhhsxmlddrta.supabase.co"
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s"
    ["SUPABASE_SERVICE_ROLE_KEY"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA5ODUyNCwiZXhwIjoyMDY0Njc0NTI0fQ.F1sML4ob29QmG_-_zuG5o7mi4k9E2FAew3GDtXuLezo"
    ["DATABASE_URL"]="postgresql://postgres:password@localhost:54322/postgres"
    ["DIRECT_URL"]="postgresql://postgres:password@localhost:54322/postgres"
    ["NEXTAUTH_SECRET"]="your-nextauth-secret-here"
    ["GOOGLE_CLIENT_ID"]="745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com"
    ["GOOGLE_CLIENT_SECRET"]="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"
)

echo "# Vercel Environment Variable Setup Commands"
echo "# =========================================="
echo "#"
echo "# This script generates curl commands to add environment variables."
echo "# Replace YOUR_VERCEL_TOKEN with your actual token."
echo "#"
echo "# You can run all commands at once by piping to bash:"
echo "# ./generate-env-var-commands.sh | grep '^curl' | bash"
echo "#"
echo ""

# Generate commands for each project
for app_name in "${!PROJECTS[@]}"; do
    project_id="${PROJECTS[$app_name]}"
    echo "# === $app_name ($project_id) ==="
    
    for var_name in "${!CRITICAL_VARS[@]}"; do
        var_value="${CRITICAL_VARS[$var_name]}"
        
        # Special handling for NEXTAUTH_URL
        if [ "$var_name" = "NEXTAUTH_URL" ]; then
            var_value="https://ganger-$app_name.vercel.app"
        fi
        
        # Escape the value for JSON
        escaped_value=$(echo "$var_value" | sed 's/"/\\"/g')
        
        echo "curl -X POST \"https://api.vercel.com/v10/projects/$project_id/env?teamId=$TEAM_ID\" \\"
        echo "  -H \"Authorization: Bearer YOUR_VERCEL_TOKEN\" \\"
        echo "  -H \"Content-Type: application/json\" \\"
        echo "  -d '{\"key\": \"$var_name\", \"value\": \"$escaped_value\", \"type\": \"encrypted\", \"target\": [\"production\", \"preview\", \"development\"]}'"
        echo ""
    done
    echo ""
done

echo "# =========================================="
echo "# Total commands generated: $((${#PROJECTS[@]} * ${#CRITICAL_VARS[@]}))"
echo "#"
echo "# After running these commands:"
echo "# 1. Commit and push to trigger deployments:"
echo "#    git commit --allow-empty -m 'deploy: with environment variables'"
echo "#    git push origin main"
echo "# 2. Check https://vercel.com/ganger for deployment status"