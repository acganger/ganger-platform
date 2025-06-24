#!/bin/bash
# VM Setup Script with NVM

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "🚀 Ganger Platform VM Setup"
echo "=========================="
echo ""

# Check pnpm
echo "Checking pnpm..."
pnpm --version || { echo "❌ pnpm not found"; exit 1; }

# Navigate to project
cd ~/ganger-platform || { echo "❌ ganger-platform directory not found"; exit 1; }

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔨 Building shared packages..."
pnpm --filter "./packages/**" build

echo ""
echo "📝 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
else
    echo "✅ .env already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with production values"
echo "2. Run: pnpm --filter eos-l10 build"
echo "3. Run: pm2 start ecosystem.config.js --only eos-l10"