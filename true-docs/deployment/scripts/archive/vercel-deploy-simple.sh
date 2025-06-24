#!/bin/bash

echo "🚀 Deploying to Vercel with npx..."

cd apps/staff

# Use npx to run vercel with pnpm support
npx vercel@latest --prod \
    --token="RdwA23mHSvPcm9ptReM6zxjF" \
    --scope="team_wpY7PcIsYQNnslNN39o7fWvS" \
    --yes