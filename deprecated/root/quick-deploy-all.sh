#!/bin/bash
# Quick deployment trigger for all apps

echo "🚀 Triggering deployments for all apps..."
echo ""

# Just trigger a git push event which will trigger all connected projects
git commit --allow-empty -m "chore: trigger deployments after pnpm migration"
git push origin main

echo ""
echo "✅ Empty commit pushed to trigger all Vercel deployments"
echo ""
echo "📊 Monitor at: https://vercel.com/ganger"
echo ""
echo "All apps should now deploy with:"
echo "- pnpm package manager"
echo "- ENABLE_EXPERIMENTAL_COREPACK=1 environment variable"
echo "- Consistent vercel.json configuration"