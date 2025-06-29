#!/bin/bash

# Script to trigger GitHub Actions deployment workflow
# This demonstrates how to deploy apps now that auto-deploy is disabled

echo "🚀 Triggering GitHub Actions Deployment Workflow"
echo ""
echo "This script shows how to trigger deployments via GitHub Actions API"
echo "since auto-deploy is now disabled for all Vercel projects."
echo ""

# GitHub repository details
OWNER="acganger"
REPO="ganger-platform"
WORKFLOW_FILE="smart-sequential-deploy.yml"

# Default values
DEPLOY_MODE="${1:-changed-only}"
ENVIRONMENT="${2:-production}"
APPS_TO_DEPLOY="${3:-}"
SKIP_TESTS="${4:-false}"

echo "Configuration:"
echo "  - Deploy Mode: $DEPLOY_MODE"
echo "  - Environment: $ENVIRONMENT"
echo "  - Apps to Deploy: ${APPS_TO_DEPLOY:-auto-detected}"
echo "  - Skip Tests: $SKIP_TESTS"
echo ""

# Check if GitHub token is available
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Error: GITHUB_TOKEN environment variable is not set"
  echo ""
  echo "To trigger deployments via API, you need a GitHub Personal Access Token with 'repo' scope."
  echo "Set it as: export GITHUB_TOKEN=your_token_here"
  echo ""
  echo "Alternatively, you can trigger deployments manually:"
  echo "  1. Go to https://github.com/$OWNER/$REPO/actions"
  echo "  2. Click on 'Smart Sequential Deployment' workflow"
  echo "  3. Click 'Run workflow'"
  echo "  4. Select your deployment options"
  exit 1
fi

# Trigger the workflow
echo "Triggering workflow..."
response=$(curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$OWNER/$REPO/actions/workflows/$WORKFLOW_FILE/dispatches" \
  -d "{
    \"ref\": \"main\",
    \"inputs\": {
      \"deploy_mode\": \"$DEPLOY_MODE\",
      \"environment\": \"$ENVIRONMENT\",
      \"apps_to_deploy\": \"$APPS_TO_DEPLOY\",
      \"skip_tests\": \"$SKIP_TESTS\"
    }
  }" \
  -w "\n%{http_code}" \
  -s)

http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "204" ]; then
  echo "✅ Workflow triggered successfully!"
  echo ""
  echo "View the workflow run at:"
  echo "https://github.com/$OWNER/$REPO/actions/workflows/$WORKFLOW_FILE"
else
  echo "❌ Failed to trigger workflow (HTTP $http_code)"
  echo "Response: $(echo "$response" | head -n-1)"
fi

echo ""
echo "Usage examples:"
echo "  ./trigger-github-deployment.sh changed-only production"
echo "  ./trigger-github-deployment.sh sequential-all production"
echo "  ./trigger-github-deployment.sh specific-apps production \"platform-dashboard,staff\""
echo "  ./trigger-github-deployment.sh changed-only preview \"\" true  # Skip tests"