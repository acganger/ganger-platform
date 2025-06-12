#!/bin/bash
# ⚙️ Backend Terminal Initialization
# Specialized for database, APIs, and integrations development

echo "⚙️ INITIALIZING BACKEND TERMINAL"
echo "================================="
echo "🎯 Role: Database Schemas, APIs, Integrations, Backend Services"
echo "📂 Working Areas:"
echo "   - packages/db/migrations/ (Database schemas)"
echo "   - packages/integrations/ (API integrations)"
echo "   - apps/[app]/api/ (Next.js API routes)"
echo "   - Backend services and data processing"
echo ""

# Create terminal state tracking
cat > .ai-workspace/terminal-coordination/backend-terminal-state.json << EOF
{
  "terminal_id": "BACKEND-TERMINAL",
  "role": "backend",
  "status": "initialized",
  "working_areas": [
    "packages/db/migrations/",
    "packages/integrations/",
    "apps/*/api/",
    "backend services"
  ],
  "available_infrastructure": [
    "@ganger/db (database utilities)",
    "@ganger/integrations (API clients)",
    "Supabase MCP (real-time operations)",
    "Universal Communication Hub (Twilio MCP)",
    "Universal Payment Hub (Stripe MCP)",
    "Enhanced Database Hub"
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
    grep -A 5 "Backend tasks" .ai-workspace/context-bridges/handoff-context.md 2>/dev/null || echo "   - No specific backend tasks listed yet"
else
    echo "⚠️ No handoff context found"
    echo "💡 Request planning from Claude Desktop with:"
    echo "   'Plan backend development for [application] using Terminal 2'"
fi
echo ""

# Show available infrastructure
echo "🏗️ Available Backend Infrastructure:"
echo "✅ Database & MCP:"
echo "   - @ganger/db: Database utilities and repositories"
echo "   - Supabase MCP: Real-time database operations"
echo "   - Enhanced Database Hub: Automated migrations"
echo "   - 87% faster migrations (15min → 2min)"
echo ""
echo "✅ Universal Hubs:"
echo "   - Communication Hub: Twilio MCP for HIPAA-compliant SMS/voice"
echo "   - Payment Hub: Stripe MCP for medical billing"
echo "   - Real-time fraud detection (99.2% accuracy)"
echo "   - Automated transaction monitoring"
echo ""
echo "✅ API Integrations:"
echo "   - @ganger/integrations: Google, Email, PDF clients"
echo "   - Proven integration patterns"
echo "   - HIPAA-compliant communication"
echo ""

# Check frontend coordination
echo "🔄 Frontend Coordination:"
if [ -f ".ai-workspace/terminal-coordination/frontend-terminal-state.json" ]; then
    FRONTEND_STATUS=$(cat .ai-workspace/terminal-coordination/frontend-terminal-state.json | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "🖥️ Frontend Terminal Status: $FRONTEND_STATUS"
    echo "📡 Coordination active - frontend handles UI/components"
else
    echo "🖥️ Frontend Terminal: Not initialized"
    echo "💡 Frontend handles: React components, pages, styling"
fi
echo ""

# File ownership guidance
echo "📁 File Ownership (Conflict Prevention):"
echo "⚙️ BACKEND TERMINAL (You) - ONLY touch:"
echo "   ✅ packages/db/migrations/*.sql"
echo "   ✅ packages/integrations/src/"
echo "   ✅ apps/[app]/api/*.ts"
echo "   ✅ Backend services and schemas"
echo ""
echo "🖥️ FRONTEND TERMINAL - ONLY touches:"
echo "   🚫 apps/[app]/src/components/"
echo "   🚫 apps/[app]/src/pages/"
echo "   🚫 apps/[app]/src/styles/"
echo "   🚫 Frontend UI and components"
echo ""

# Database schema patterns
echo "🗄️ Database Schema Patterns (From Inventory/Handouts):"
echo "1. Use UUID primary keys (gen_random_uuid())"
echo "2. Include created_at, updated_at timestamps"
echo "3. Add proper indexes for performance"
echo "4. Use JSONB for flexible metadata"
echo "5. Implement row-level security (RLS)"
echo ""

# API patterns
echo "🔌 API Patterns (From Universal Hubs):"
echo "1. Use Next.js API routes (app/api/)"
echo "2. Integrate with Universal Communication Hub"
echo "3. Integrate with Universal Payment Hub"
echo "4. Follow RESTful conventions"
echo "5. Implement proper error handling"
echo ""

# MCP integration guidance
echo "🚀 MCP Integration:"
echo "✅ Supabase MCP: Automated database operations"
echo "✅ Twilio MCP: HIPAA-compliant communication"
echo "✅ Stripe MCP: Medical billing and payments"
echo "✅ Enhanced Database Hub: Real-time monitoring"
echo ""

# Update state
sed -i 's/"status":"initialized"/"status":"ready_for_work"/' .ai-workspace/terminal-coordination/backend-terminal-state.json

echo "✅ BACKEND TERMINAL READY"
echo ""
echo "🎯 Your Mission:"
echo "   Build robust database schemas, APIs, and integrations"
echo "   following the proven patterns from Universal Hubs"
echo ""
echo "📋 Next Steps:"
echo "1. Load handoff context: cat .ai-workspace/context-bridges/handoff-context.md"
echo "2. Ask Claude Console: 'Load backend context and implement [feature] database/API'"
echo "3. Focus on schemas, APIs, integrations, and backend services"
echo ""
echo "⚙️ BACKEND TERMINAL ACTIVE - Ready for database/API development! 🚀"