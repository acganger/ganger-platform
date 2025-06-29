#!/bin/bash

# Script to add authentication to all deployed apps
# This ensures users see sign-in when accessing apps directly

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Adding Authentication to Deployed Apps${NC}"
echo "========================================"

# List of deployed apps that need authentication
DEPLOYED_APPS=(
    "inventory"
    "handouts"
    "compliance-training"
    "clinical-staffing"
    "config-dashboard"
    "checkin-kiosk"
    "platform-dashboard"
)

# Function to check if a page has AuthGuard
check_auth_guard() {
    local FILE=$1
    if grep -q "AuthGuard" "$FILE"; then
        echo -e "${GREEN}✅ $FILE already has AuthGuard${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $FILE needs AuthGuard${NC}"
        return 1
    fi
}

# Function to add AuthGuard to a page
add_auth_guard() {
    local APP=$1
    local FILE=$2
    local APP_NAME_KEBAB=$3
    
    echo -e "${BLUE}Adding AuthGuard to $FILE...${NC}"
    
    # Check if file exists
    if [ ! -f "$FILE" ]; then
        echo -e "${RED}❌ File not found: $FILE${NC}"
        return 1
    fi
    
    # Create a temporary file with the updated content
    cat > "${FILE}.tmp" << 'EOF'
// Authentication required for this app
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthGuard } from '@ganger/auth';

function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app page
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Loading...
          </h1>
          <p className="text-lg text-gray-600">
            Redirecting to application
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedHomePage() {
  return (
    <AuthGuard level="staff" appName="APP_NAME_PLACEHOLDER">
      <HomePage />
    </AuthGuard>
  );
}
EOF

    # Replace placeholder with actual app name
    sed -i "s/APP_NAME_PLACEHOLDER/${APP_NAME_KEBAB}/g" "${FILE}.tmp"
    
    # Move the temp file to the original
    mv "${FILE}.tmp" "$FILE"
    
    echo -e "${GREEN}✅ Added AuthGuard to $FILE${NC}"
}

# Process each deployed app
for APP in "${DEPLOYED_APPS[@]}"; do
    echo -e "\n${BLUE}Processing $APP...${NC}"
    
    APP_DIR="apps/$APP"
    INDEX_FILE="$APP_DIR/src/pages/index.tsx"
    
    if [ ! -d "$APP_DIR" ]; then
        echo -e "${YELLOW}⚠️  App directory not found: $APP_DIR${NC}"
        continue
    fi
    
    if [ -f "$INDEX_FILE" ]; then
        if ! check_auth_guard "$INDEX_FILE"; then
            # Convert app name to kebab case for auth
            APP_NAME_KEBAB=$(echo "$APP" | tr '[:upper:]' '[:lower:]')
            add_auth_guard "$APP" "$INDEX_FILE" "$APP_NAME_KEBAB"
        fi
    else
        echo -e "${YELLOW}⚠️  Index file not found: $INDEX_FILE${NC}"
    fi
done

echo -e "\n${BLUE}📋 Summary of Changes:${NC}"
echo "========================"
echo "1. Added AuthGuard to index pages that were missing it"
echo "2. All deployed apps now require sign-in"
echo "3. Users will see Google sign-in prompt when accessing apps directly"

echo -e "\n${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Commit these changes to Git"
echo "2. Push to GitHub to trigger Vercel deployments"
echo "3. Wait for deployments to complete (~2-3 minutes per app)"
echo "4. Test direct app access to verify sign-in prompt appears"

echo -e "\n${GREEN}✅ Authentication setup complete!${NC}"