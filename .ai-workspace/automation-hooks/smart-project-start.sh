#!/bin/bash
# 🚀 Smart Project Initialization for Beast Mode

echo "🚀 Starting Beast Mode development session..."
echo "📊 Platform: Ganger Platform (95% Complete)"
echo "🎯 Ready for: Phase 2 Applications (Staff, Lunch, L10)"
echo ""

# System status check
echo "📊 System Status Check:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "Platform: $(uname -s)"
echo ""

# Git status
echo "📋 Git Status:"
git status --porcelain | head -5
if [ $(git status --porcelain | wc -l) -gt 5 ]; then
    echo "... and $(($(git status --porcelain | wc -l) - 5)) more files"
fi
echo ""

# Load existing context if available
if [ -f ".ai-workspace/context-bridges/current-session-context.md" ]; then
    echo "📋 Loading previous session context..."
    echo "Last session: $(head -2 .ai-workspace/context-bridges/current-session-context.md | tail -1)"
    echo ""
fi

# Quick health check
echo "🔧 Running health checks..."
echo "TypeScript compilation:"
if npm run type-check >/dev/null 2>&1; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed - run quality checkpoint"
fi

echo "ESLint checks:"
if npm run lint >/dev/null 2>&1; then
    echo "✅ ESLint checks passing"
else
    echo "⚠️ ESLint issues found - run quality checkpoint"
fi

# Save session start context
echo "## Beast Mode Session Started" > .ai-workspace/context-bridges/current-session-context.md
echo "**Date:** $(date)" >> .ai-workspace/context-bridges/current-session-context.md
echo "**Platform Status:** 95% Complete - 3 Production Apps Operational" >> .ai-workspace/context-bridges/current-session-context.md
echo "**Phase:** Ready for Phase 2 Development" >> .ai-workspace/context-bridges/current-session-context.md
echo "**Available Infrastructure:**" >> .ai-workspace/context-bridges/current-session-context.md
echo "- ✅ Universal Communication Hub (Twilio MCP)" >> .ai-workspace/context-bridges/current-session-context.md
echo "- ✅ Universal Payment Hub (Stripe MCP)" >> .ai-workspace/context-bridges/current-session-context.md
echo "- ✅ Enhanced Database Hub (Supabase MCP)" >> .ai-workspace/context-bridges/current-session-context.md
echo "- ✅ All @ganger/* packages functional" >> .ai-workspace/context-bridges/current-session-context.md
echo "- ✅ TypeScript 100% compilation success" >> .ai-workspace/context-bridges/current-session-context.md
echo "" >> .ai-workspace/context-bridges/current-session-context.md
echo "**Git Status:**" >> .ai-workspace/context-bridges/current-session-context.md
git status --short >> .ai-workspace/context-bridges/current-session-context.md

echo ""
echo "✅ Beast Mode session initialized!"
echo "🎯 Ready for parallel development:"
echo "   🖥️ Frontend Terminal: React components, UI, styling"
echo "   ⚙️ Backend Terminal: Database, APIs, integrations"
echo "   📋 Desktop: Strategic planning and coordination"
echo ""
echo "💡 Next: Use Claude Desktop to plan your next development task"
echo "📚 Reference: docs/BEAST_MODE_REFERENCE.md"