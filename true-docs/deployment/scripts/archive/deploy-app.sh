#!/bin/bash
# Simplified App Deployment Script

set -e  # Exit on error

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
    echo "Usage: ./scripts/deploy-app.sh <app-name>"
    echo "Available apps: compliance-training, clinical-staffing, socials-reviews, eos-l10"
    exit 1
fi

echo "🚀 Deploying $APP_NAME to production"
echo "===================================="

# Map app names to directories
case $APP_NAME in
    "compliance")
        APP_DIR="compliance-training"
        WORKER_NAME="ganger-compliance-staff-production"
        ROUTES="staff.gangerdermatology.com/compliance/*"
        ;;
    "staffing")
        APP_DIR="clinical-staffing"
        WORKER_NAME="ganger-staffing-staff-production"
        ROUTES="staff.gangerdermatology.com/staffing/*"
        ;;
    "socials")
        APP_DIR="socials-reviews"
        WORKER_NAME="ganger-socials-staff-production"
        ROUTES="staff.gangerdermatology.com/socials/*"
        ;;
    "l10")
        APP_DIR="eos-l10"
        WORKER_NAME="ganger-eos-l10-v2"
        ROUTES="staff.gangerdermatology.com/l10,staff.gangerdermatology.com/l10/*"
        ;;
    *)
        echo "Unknown app: $APP_NAME"
        exit 1
        ;;
esac

cd "apps/$APP_DIR"

echo "📦 Step 1: Installing dependencies..."
npm install

echo "🔨 Step 2: Building Next.js app..."
npm run build

echo "☁️  Step 3: Deploying to Cloudflare Workers..."
npx wrangler deploy --env production

echo "🔍 Step 4: Verifying deployment..."
sleep 5  # Wait for deployment to propagate

# Test main route
MAIN_ROUTE=$(echo $ROUTES | cut -d'*' -f1 | sed 's/staff.gangerdermatology.com//')
TEST_URL="https://staff.gangerdermatology.com${MAIN_ROUTE}"

echo "Testing $TEST_URL..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL")

if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ]; then
    echo "✅ Deployment successful! App is accessible."
else
    echo "⚠️  Warning: App returned status $STATUS"
    echo "This might indicate a deployment issue."
fi

echo
echo "📋 Post-Deployment Checklist:"
echo "1. Check Worker logs: https://dash.cloudflare.com/68d0160c9915efebbbecfddfd48cddab/workers/services/view/$WORKER_NAME/production/logs"
echo "2. Verify routes are assigned: https://dash.cloudflare.com/68d0160c9915efebbbecfddfd48cddab/workers/services/view/$WORKER_NAME/production/settings"
echo "3. Test dynamic content: $TEST_URL"
echo
echo "If routes are not working:"
echo "- The Worker name in production might be different"
echo "- Routes might need manual assignment in Cloudflare dashboard"
echo "- There might be a conflicting Worker with higher precedence"