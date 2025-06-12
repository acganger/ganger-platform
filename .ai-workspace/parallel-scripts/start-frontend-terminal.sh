#!/bin/bash
# 🖥️ Frontend Terminal Initialization
# Specialized for React components, UI, and styling development

echo "🖥️ INITIALIZING FRONTEND TERMINAL"
echo "=================================="
echo "🎯 Role: React Components, UI, Styling, Frontend Logic"
echo "📂 Working Areas:"
echo "   - apps/[app]/src/components/ (React components)"
echo "   - apps/[app]/src/pages/ (Next.js pages)"
echo "   - apps/[app]/src/styles/ (Tailwind CSS)"
echo "   - Frontend configuration and logic"
echo ""

# Create terminal state tracking
cat > .ai-workspace/terminal-coordination/frontend-terminal-state.json << EOF
{
  "terminal_id": "FRONTEND-TERMINAL",
  "role": "frontend",
  "status": "initialized",
  "working_areas": [
    "apps/*/src/components/",
    "apps/*/src/pages/",
    "apps/*/src/styles/",
    "frontend configuration"
  ],
  "available_infrastructure": [
    "@ganger/ui (13 components)",
    "@ganger/auth (authentication)",
    "Universal Communication Hub",
    "Universal Payment Hub",
    "Proven patterns from Inventory/Handouts"
  ],
  "last_updated": "$(date)",
  "coordination_status": "ready_for_work"
}
EOF

# Load handoff context if available
echo "📋 Loading Context:"
if [ -f ".ai-workspace/context-bridges/handoff-context.md" ]; then
    echo "✅ Handoff context found"
    echo "📝 Planning from Desktop:"
    grep -A 5 "Frontend tasks" .ai-workspace/context-bridges/handoff-context.md 2>/dev/null || echo "   - No specific frontend tasks listed yet"
else
    echo "⚠️ No handoff context found"
    echo "💡 Request planning from Claude Desktop with:"
    echo "   'Plan frontend development for [application] using Terminal 1'"
fi
echo ""

# Show available infrastructure
echo "🏗️ Available Frontend Infrastructure:"
echo "✅ @ganger/ui Components:"
echo "   - AppLayout, PageHeader, StatCard, ThemeProvider"
echo "   - Button, Input, Checkbox, FormField, Select"
echo "   - Card, DataTable, Modal, Toast, LoadingSpinner"
echo ""
echo "✅ Authentication:"
echo "   - @ganger/auth with role-based permissions"
echo "   - Google OAuth integration ready"
echo "   - Supabase authentication patterns"
echo ""
echo "✅ Styling & Layout:"
echo "   - Tailwind CSS with shared design system"
echo "   - Responsive mobile-first patterns"
echo "   - Dark/light theme support"
echo ""

# Check backend coordination
echo "🔄 Backend Coordination:"
if [ -f ".ai-workspace/terminal-coordination/backend-terminal-state.json" ]; then
    BACKEND_STATUS=$(cat .ai-workspace/terminal-coordination/backend-terminal-state.json | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "⚙️ Backend Terminal Status: $BACKEND_STATUS"
    echo "📡 Coordination active - backend handles APIs/database"
else
    echo "⚙️ Backend Terminal: Not initialized"
    echo "💡 Backend handles: Database schemas, API routes, integrations"
fi
echo ""

# File ownership guidance
echo "📁 File Ownership (Conflict Prevention):"
echo "🖥️ FRONTEND TERMINAL (You) - ONLY touch:"
echo "   ✅ apps/[app]/src/components/*.tsx"
echo "   ✅ apps/[app]/src/pages/*.tsx (UI parts)"
echo "   ✅ apps/[app]/src/styles/*.css"
echo "   ✅ Frontend configuration files"
echo ""
echo "⚙️ BACKEND TERMINAL - ONLY touches:"
echo "   🚫 packages/db/migrations/"
echo "   🚫 packages/integrations/"
echo "   🚫 apps/[app]/api/ routes"
echo "   🚫 Backend services and schemas"
echo ""

# Success patterns
echo "🎯 Success Patterns (From Inventory/Handouts):"
echo "1. Use existing @ganger/ui components"
echo "2. Follow AppLayout → PageHeader → Content structure"
echo "3. Integrate with Universal Communication/Payment Hubs"
echo "4. Maintain TypeScript strict compliance"
echo "5. Follow mobile-first responsive design"
echo ""

# Update state
sed -i 's/"status":"initialized"/"status":"ready_for_work"/' .ai-workspace/terminal-coordination/frontend-terminal-state.json

echo "✅ FRONTEND TERMINAL READY"
echo ""
echo "🎯 Your Mission:"
echo "   Build beautiful, responsive React components and user interfaces"
echo "   following the proven patterns from Inventory and Handouts apps"
echo ""
echo "📋 Next Steps:"
echo "1. Load handoff context: cat .ai-workspace/context-bridges/handoff-context.md"
echo "2. Ask Claude Console: 'Load frontend context and implement [feature] UI'"
echo "3. Focus on components, pages, styling, and frontend logic"
echo ""
echo "🖥️ FRONTEND TERMINAL ACTIVE - Ready for UI development! 🚀"