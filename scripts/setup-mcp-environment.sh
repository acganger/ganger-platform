#!/bin/bash

# MCP Environment Setup Script for WSL/Claude Code
# Ensures all 15+ MCP servers are properly configured and available

echo "🚀 Setting up MCP environment for Claude Code..."

# Set project root
PROJECT_ROOT="/mnt/q/Projects/ganger-platform"
cd "$PROJECT_ROOT"

echo "📦 Installing NPX packages globally..."
npm install -g @modelcontextprotocol/server-filesystem \
              @modelcontextprotocol/server-memory \
              @modelcontextprotocol/server-slack \
              gcp-mcp \
              mysql-mcp-server \
              @twilio-alpha/mcp \
              mcp-remote

echo "🐍 Verifying Python MCP packages..."
pip install --user mcp-server-time mcp-server-fetch mcp-server-git unifi-network-mcp

echo "🔧 Building custom MCP servers..."
# Build Puppeteer MCP
cd "$PROJECT_ROOT/mcp-servers/puppeteer"
npm install && npm run build

# Build Trello MCP  
cd "$PROJECT_ROOT/mcp-servers/trello"
npm install && npm run build

# Return to project root
cd "$PROJECT_ROOT"

echo "⚙️ Verifying MCP configuration..."
if [ -f ".mcp.json" ]; then
    echo "✅ MCP configuration file exists"
    echo "📊 Configured servers: $(jq '.mcpServers | keys[]' .mcp.json | wc -l)"
else
    echo "❌ MCP configuration file missing"
    exit 1
fi

echo "🔍 Testing MCP server availability..."
# Test Python modules
python3 -c "import mcp_server_time, mcp_server_fetch, mcp_server_git, unifi_network_mcp" && echo "✅ Python MCP modules available" || echo "❌ Python MCP modules missing"

# Test custom servers
[ -f "$PROJECT_ROOT/mcp-servers/puppeteer/dist/index.js" ] && echo "✅ Puppeteer MCP built" || echo "❌ Puppeteer MCP missing"
[ -f "$PROJECT_ROOT/mcp-servers/trello/dist/index.js" ] && echo "✅ Trello MCP built" || echo "❌ Trello MCP missing"

echo "🎯 MCP environment setup complete!"
echo ""
echo "Available MCP servers:"
echo "- filesystem (file operations)"
echo "- memory (knowledge graph)"  
echo "- time (timezone operations)"
echo "- fetch (web content)"
echo "- slack (team communication)"
echo "- github (repository management)"
echo "- gcp (Google Cloud Platform)"
echo "- git (version control)"
echo "- mysql-legacy (database access)"
echo "- synology (NAS management)"
echo "- twilio (SMS/voice)"
echo "- puppeteer (web automation)"
echo "- trello (project management)"
echo "- cloudflare-workers (edge deployment)"
echo "- cloudflare-builds (build management)"
echo "- unifi-network (network infrastructure)"
echo ""
echo "🔄 Restart Claude Desktop to apply changes"