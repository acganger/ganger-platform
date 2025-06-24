#!/bin/bash

# Direct Vercel deployment with environment variables
set -e

echo "🚀 Starting direct Vercel deployment..."

# Export required environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://pfqtzmxxxhhsxmlddrta.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4NTY4MzQsImV4cCI6MjAzODQzMjgzNH0.XBGQrHPRrsf1NcaRT8kJXcqBBTFqv1_SqC3nIqtmedo"
export NEXT_PUBLIC_STAFF_URL="https://staff.gangerdermatology.com"
export SKIP_ENV_VALIDATION="true"

# Navigate to staff app
cd apps/staff

# Remove any existing Vercel link
rm -rf .vercel

# Deploy directly with all settings
vercel --prod \
    --token="RdwA23mHSvPcm9ptReM6zxjF" \
    --scope="team_wpY7PcIsYQNnslNN39o7fWvS" \
    --name="ganger-staff-portal" \
    --build-env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    --build-env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --build-env NEXT_PUBLIC_STAFF_URL="$NEXT_PUBLIC_STAFF_URL" \
    --build-env SKIP_ENV_VALIDATION="true" \
    --env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    --env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --env NEXT_PUBLIC_STAFF_URL="$NEXT_PUBLIC_STAFF_URL" \
    --yes

echo "✅ Deployment initiated!"