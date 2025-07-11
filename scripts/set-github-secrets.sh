#!/bin/bash

# Script to set all GitHub Actions secrets for Vercel deployment
# Usage: ./scripts/set-github-secrets.sh

echo "Setting GitHub Actions Secrets for Vercel Deployment"
echo "==================================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if we're authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Set project ID secrets
echo "Setting Vercel Project ID secrets..."
gh secret set VERCEL_PROJECT_ID_GANGER_ACTIONS -b "prj_p2TakyHptLfHQs98taMsBYs6PrVk"
gh secret set VERCEL_PROJECT_ID_INVENTORY -b "prj_y3Iewf0yNd3u4qlblPEO1UQuTRn0"
gh secret set VERCEL_PROJECT_ID_HANDOUTS -b "prj_Y6OK0JDJUHy52mvOzn7aELi1sLgr"
gh secret set VERCEL_PROJECT_ID_EOS_L10 -b "prj_Ta3F2zY21hGAzQ2aKpf3gtGObFd6"
gh secret set VERCEL_PROJECT_ID_BATCH_CLOSEOUT -b "prj_Hb6XVvGvTEHxizarE75cssJlRu7s"
gh secret set VERCEL_PROJECT_ID_COMPLIANCE_TRAINING -b "prj_6xy9j6AWsRUwFFU43PEvZ5RnghHJ"
gh secret set VERCEL_PROJECT_ID_CLINICAL_STAFFING -b "prj_ijqujmI8v9Kd3pQzyc8xOfSBqfqM"
gh secret set VERCEL_PROJECT_ID_CONFIG_DASHBOARD -b "prj_MkWEWkx1wQR6KchHujG1wifFPq2A"
gh secret set VERCEL_PROJECT_ID_INTEGRATION_STATUS -b "prj_vQ4Ic8EUCqMzxR7TAWIgXDBi5Vzn"
gh secret set VERCEL_PROJECT_ID_AI_RECEPTIONIST -b "prj_IBe6xa7SwhypJZ3Q0k1rWrRW6sfm"
gh secret set VERCEL_PROJECT_ID_CALL_CENTER_OPS -b "prj_zOr0ZcDt5vbDvGZk4ghfF74iq29x"
gh secret set VERCEL_PROJECT_ID_MEDICATION_AUTH -b "prj_yxU6jLRBpV1UNAzntC6iYe1nPaXN"
gh secret set VERCEL_PROJECT_ID_PHARMA_SCHEDULING -b "prj_f5hNE4JjuWiQSw66r9VfnUyW20uz"
gh secret set VERCEL_PROJECT_ID_CHECKIN_KIOSK -b "prj_jMPhUwnYdvdTvJGnbgmBxOp8iE1E"
gh secret set VERCEL_PROJECT_ID_SOCIALS_REVIEWS -b "prj_iRRSwwGH3SsFhXENhCo2Aqw4Dmif"
gh secret set VERCEL_PROJECT_ID_COMPONENT_SHOWCASE -b "prj_jfT5iNsD6fgFWbkecHSQOHIFvD7N"
gh secret set VERCEL_PROJECT_ID_PLATFORM_DASHBOARD -b "prj_325u1ou6dgceEuRVWUXiDG6mL9po"
gh secret set VERCEL_PROJECT_ID_STAFF -b "prj_ieT5HxdUCrsZwDSNxhQxtOL5Ejgp"

echo ""
echo "Setting core secrets..."
gh secret set VERCEL_TOKEN -b "RdwA23mHSvPcm9ptReM6zxjF"
gh secret set VERCEL_TEAM_ID -b "team_wpY7PcIsYQNnslNN39o7fWvS"
gh secret set VERCEL_ORG_ID -b "team_wpY7PcIsYQNnslNN39o7fWvS"

# Get Supabase values from .env file if it exists
if [ -f ".env" ]; then
    echo ""
    echo "Setting Supabase secrets from .env file..."
    
    # Source the .env file to get variables
    export $(cat .env | grep -E "^NEXT_PUBLIC_SUPABASE_URL|^NEXT_PUBLIC_SUPABASE_ANON_KEY" | xargs)
    
    if [ ! -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        gh secret set NEXT_PUBLIC_SUPABASE_URL -b "$NEXT_PUBLIC_SUPABASE_URL"
    fi
    
    if [ ! -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY -b "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
    fi
fi

echo ""
echo "✅ All secrets have been set!"
echo ""
echo "You can verify secrets are set by running:"
echo "gh secret list"
echo ""
echo "Next steps:"
echo "1. Commit and push these changes"
echo "2. The GitHub Actions workflows will now have all required secrets"
echo "3. You can deploy using the GitHub Actions workflows"