#!/bin/bash

# Script to trigger GitHub Actions deployment workflow
# Usage: ./scripts/trigger-github-deployment.sh <deploy_mode> <environment> [apps] [skip_tests]

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Error: GITHUB_TOKEN environment variable is not set"
  echo "Please set it with: export GITHUB_TOKEN=your_github_personal_access_token"
  exit 1
fi

# Arguments
DEPLOY_MODE=${1:-"changed-only"}
ENVIRONMENT=${2:-"production"}
APPS_TO_DEPLOY=${3:-""}
SKIP_TESTS=${4:-"false"}

# GitHub API endpoint
API_URL="https://api.github.com/repos/acganger/ganger-platform/actions/workflows/smart-sequential-deploy.yml/dispatches"

echo "🚀 Triggering Smart Sequential Deployment"
echo "  Mode: $DEPLOY_MODE"
echo "  Environment: $ENVIRONMENT"
if [ -n "$APPS_TO_DEPLOY" ]; then
  echo "  Apps: $APPS_TO_DEPLOY"
fi
echo "  Skip tests: $SKIP_TESTS"
echo ""

# Create the JSON payload
if [ -n "$APPS_TO_DEPLOY" ]; then
  PAYLOAD=$(cat <<EOF
{
  "ref": "main",
  "inputs": {
    "deploy_mode": "$DEPLOY_MODE",
    "environment": "$ENVIRONMENT",
    "apps_to_deploy": "$APPS_TO_DEPLOY",
    "skip_tests": $SKIP_TESTS
  }
}
EOF
)
else
  PAYLOAD=$(cat <<EOF
{
  "ref": "main",
  "inputs": {
    "deploy_mode": "$DEPLOY_MODE",
    "environment": "$ENVIRONMENT",
    "skip_tests": $SKIP_TESTS
  }
}
EOF
)
fi

# Make the API request
RESPONSE=$(curl -s -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d "$PAYLOAD" \
  "$API_URL")

# Check if successful
if [ $? -eq 0 ]; then
  echo "✅ Deployment workflow triggered successfully!"
  echo ""
  echo "📊 View progress at:"
  echo "https://github.com/acganger/ganger-platform/actions"
else
  echo "❌ Failed to trigger deployment workflow"
  echo "$RESPONSE"
  exit 1
fi