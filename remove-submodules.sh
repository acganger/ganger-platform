#!/bin/bash
# Remove all MCP submodules that are blocking Vercel deployments

echo "🧹 Removing MCP submodules (keeping files, just removing git submodule references)"
echo "=================================================================="

# Remove all submodule references from git index
echo "Removing submodule references..."

git rm -r --cached mcp-servers/agent-toolkit
git rm -r --cached mcp-servers/cloud-run-mcp
git rm -r --cached mcp-servers/github-mcp-server
git rm -r --cached mcp-servers/mcp-server-cloudflare
git rm -r --cached mcp-servers/mcp-server-gemini
git rm -r --cached mcp-servers/mcp-server-synology
git rm -r --cached mcp-servers/mcp-servers-official
git rm -r --cached mcp-servers/servers-archived
git rm -r --cached mcp-servers/supabase-mcp
git rm -r --cached mcp-servers/trello
git rm -r --cached mcp-servers/twilio-mcp
git rm -r --cached mcp-servers/unifi-network
git rm -r --cached servers 2>/dev/null || true

echo ""
echo "✅ Submodule references removed from git"

# Check if we have any remaining submodules
echo ""
echo "Checking for remaining submodules..."
remaining=$(git ls-files --stage | grep ^160000 | wc -l)
if [ "$remaining" -eq 0 ]; then
    echo "✅ All submodules removed successfully!"
else
    echo "⚠️  Warning: $remaining submodules still remain"
    git ls-files --stage | grep ^160000
fi

echo ""
echo "The MCP server files are still in your local directory (not deleted)."
echo "They're just no longer tracked as git submodules."
echo ""
echo "Next steps:"
echo "1. Run: git add ."
echo "2. Run: git commit -m \"fix: remove MCP submodules to fix Vercel deployments\""
echo "3. Run: git push"
echo ""
echo "This will fix all 13 failing deployments! 🚀"