#!/bin/bash

# Add environment variables using Vercel CLI
# This approach works if you're logged in to Vercel CLI

set -e

echo "🚀 Adding environment variables to all Vercel projects using CLI..."
echo ""

# Check if logged in
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ Error: Not logged in to Vercel CLI"
    echo "Please run: vercel login"
    exit 1
fi

# List of apps
APPS=(
    "inventory"
    "handouts"
    "eos-l10"
    "batch-closeout"
    "compliance-training"
    "clinical-staffing"
    "config-dashboard"
    "integration-status"
    "ai-receptionist"
    "call-center-ops"
    "medication-auth"
    "pharma-scheduling"
    "checkin-kiosk"
    "socials-reviews"
    "component-showcase"
    "platform-dashboard"
    "staff"
)

# Environment variables to add
declare -A ENV_VARS=(
    ["DATABASE_URL"]="postgresql://postgres:password@localhost:54322/postgres"
    ["DIRECT_URL"]="postgresql://postgres:password@localhost:54322/postgres"
    ["NEXT_PUBLIC_SUPABASE_URL"]="https://pfqtzmxxxhhsxmlddrta.supabase.co"
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s"
    ["SUPABASE_SERVICE_ROLE_KEY"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA5ODUyNCwiZXhwIjoyMDY0Njc0NTI0fQ.F1sML4ob29QmG_-_zuG5o7mi4k9E2FAew3GDtXuLezo"
    ["NEXTAUTH_SECRET"]="your-nextauth-secret-here"
    ["GOOGLE_CLIENT_ID"]="745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com"
    ["GOOGLE_CLIENT_SECRET"]="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"
    ["NEXT_PUBLIC_STAFF_URL"]="https://staff.gangerdermatology.com"
    ["NEXT_PUBLIC_LUNCH_URL"]="https://lunch.gangerdermatology.com"
    ["NEXT_PUBLIC_L10_URL"]="https://l10.gangerdermatology.com"
    ["NODE_ENV"]="production"
    ["SECURITY_SALT"]="V1ny@C0nstruct10n2025!"
    ["HEALTH_CHECK_KEY"]="K9x2mP4nQ8wL5vB7"
)

# Process each app
for app in "${APPS[@]}"; do
    echo "📦 Processing $app..."
    
    # Navigate to app directory
    cd "../../../apps/$app" 2>/dev/null || {
        echo "  ❌ App directory not found: apps/$app"
        continue
    }
    
    # Link to the project if not already linked
    if [ ! -f ".vercel/project.json" ]; then
        echo "  Linking to Vercel project..."
        vercel link --yes --project="ganger-$app" || {
            echo "  ❌ Failed to link project"
            cd - > /dev/null
            continue
        }
    fi
    
    # Add environment variables
    for key in "${!ENV_VARS[@]}"; do
        value="${ENV_VARS[$key]}"
        
        # Special case for NEXTAUTH_URL - make it app-specific
        if [ "$key" = "NEXTAUTH_URL" ]; then
            value="https://ganger-$app.vercel.app"
        fi
        
        echo "  Adding $key..."
        echo "$value" | vercel env add "$key" production --yes 2>/dev/null || echo "    ⚠️  $key already exists or failed"
        echo "$value" | vercel env add "$key" preview --yes 2>/dev/null || true
        echo "$value" | vercel env add "$key" development --yes 2>/dev/null || true
    done
    
    echo "✅ Completed $app"
    echo ""
    
    # Return to scripts directory
    cd - > /dev/null
done

echo "🎉 All environment variables have been added!"
echo ""
echo "📋 Next steps:"
echo "1. Trigger new deployments:"
echo "   git commit --allow-empty -m 'deploy: with environment variables configured'"
echo "   git push origin main"
echo "2. Monitor deployment status in Vercel dashboard"
echo "3. Check build logs if any deployments fail"