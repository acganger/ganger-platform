#!/bin/bash
# Setup VM for Ganger Platform Deployment

echo "🚀 Setting up Ganger Platform on VM"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 successful${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Check if we're in the right directory
if [ ! -f "turbo.json" ]; then
    echo -e "${RED}❌ Error: Not in ganger-platform directory${NC}"
    echo "Please run this script from ~/ganger-platform"
    exit 1
fi

echo "📋 Checking prerequisites..."
echo -n "Node.js: "
node --version
echo -n "npm: "
npm --version

# Check for pnpm
echo -n "pnpm: "
if command -v pnpm &> /dev/null; then
    pnpm --version
else
    echo -e "${YELLOW}Not found - installing...${NC}"
    npm install -g pnpm
    check_status "pnpm installation"
    pnpm --version
fi

echo -n "PM2: "
pm2 --version

echo ""
echo "📦 Installing dependencies..."
pnpm install
check_status "Dependencies installation"

echo ""
echo "🔨 Building shared packages..."
pnpm --filter "./packages/types" build
pnpm --filter "./packages/utils" build
pnpm --filter "./packages/config" build
pnpm --filter "./packages/cache" build
pnpm --filter "./packages/db" build
pnpm --filter "./packages/auth" build
pnpm --filter "./packages/ui" build
pnpm --filter "./packages/integrations" build
check_status "Package builds"

echo ""
echo "📝 Creating PM2 ecosystem file..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    // Medical Apps (Port 3001-3010)
    {
      name: 'inventory',
      cwd: './apps/inventory',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'handouts',
      cwd: './apps/handouts',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3002,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'checkin-kiosk',
      cwd: './apps/checkin-kiosk',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3003,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'medication-auth',
      cwd: './apps/medication-auth',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3004,
        NODE_ENV: 'production'
      }
    },
    
    // Operations Apps (Port 3011-3020)
    {
      name: 'clinical-staffing',
      cwd: './apps/clinical-staffing',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3011,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'eos-l10',
      cwd: './apps/eos-l10',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3012,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'pharma-scheduling',
      cwd: './apps/pharma-scheduling',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3013,
        NODE_ENV: 'production'
      }
    },
    
    // Analytics Apps (Port 3021-3030)
    {
      name: 'batch-closeout',
      cwd: './apps/batch-closeout',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3021,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'billing-ops',
      cwd: './apps/billing-ops',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3022,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'compliance-training',
      cwd: './apps/compliance-training',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3023,
        NODE_ENV: 'production'
      }
    },
    
    // Research Apps (Port 3031-3040)
    {
      name: 'treatment-outcomes',
      cwd: './apps/treatment-outcomes',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3031,
        NODE_ENV: 'production'
      }
    },
    
    // Administrative Apps (Port 3041-3050)
    {
      name: 'ai-receptionist',
      cwd: './apps/ai-receptionist',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3041,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'demo',
      cwd: './apps/demo',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3042,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'staff',
      cwd: './apps/staff',
      script: 'pnpm',
      args: 'start',
      env: {
        PORT: 3044,
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF
check_status "PM2 ecosystem file creation"

echo ""
echo "🌍 Setting up environment..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Created .env from .env.example - please update with production values${NC}"
    else
        echo -e "${RED}❌ No .env.example found - please create .env file${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 To deploy apps, use these commands:"
echo ""
echo "# Deploy a single app:"
echo "pnpm --filter [app-name] build"
echo "pm2 start ecosystem.config.js --only [app-name]"
echo ""
echo "# Deploy all apps:"
echo "./deploy-all-apps.sh"
echo ""
echo "# Check status:"
echo "pm2 status"
echo ""
echo "# View logs:"
echo "pm2 logs [app-name]"