# TERMINAL PROMPT TEMPLATES - ORGANIZED HANDOFF SYSTEM

## 📋 **STANDARDIZED HANDOFF FORMAT: [YYMMDD]-[increment]-terminal[x]-handoff.md**

### **🔧 TERMINAL 1 (FRONTEND) HANDOFF TEMPLATE**

**File Format**: `YYMMDD-##-terminal1-handoff.md`  
**Copy this template for each Terminal 1 session:**

```markdown
# Terminal 1 Frontend Session - [YYMMDD]-[increment]

## 🚨 **ANTI-HALLUCINATION PROTOCOL - READ FIRST**

**WARNING**: If you claim work is "already completed" without verification, you are experiencing AI documentation drift.

**MANDATORY REALITY CHECK**: Before making ANY claims, run these verification commands:

```bash
cd /mnt/q/Projects/ganger-platform/apps/inventory
npm run type-check
# Run actual verification - don't assume status

cd /mnt/q/Projects/ganger-platform/apps/handouts  
npm run type-check
# Run actual verification - don't assume status

cd /mnt/q/Projects/ganger-platform/apps/checkin-kiosk
npm run type-check
# Run actual verification - don't assume status
```

## 🧠 **MEMORY MCP CONTEXT PRESERVATION**

**CRITICAL: Use Memory MCP throughout your session to prevent context loss**

**Required Memory MCP Updates:**
```bash
# At session start:
mcp__memory__add_observations (Terminal 1 session started, load previous context)

# Every 15 minutes during work:
mcp__memory__add_observations (Progress update: files modified, commands run, current status)

# After each verification:
mcp__memory__add_observations (Verification results: npm run type-check output, errors found/fixed)

# Before task completion:
mcp__memory__add_observations (Task completion status, verification gates passed)
```

**Context to Preserve**:
- Current task being worked on
- Files modified in this session
- Verification commands run and their results
- Any errors encountered and solutions attempted
- Next planned actions

## 📊 **GOOGLE SHEETS MCP INTEGRATION - EXPLICIT USAGE**

**🚨 CRITICAL: Never use WebFetch on Google Sheets URL - Use MCP tools directly**

**Required Environment Setup:**
```bash
# Google Sheets MCP now uses OAuth2 - no environment variables needed
```

**EXPLICIT MCP COMMANDS TO USE:**
```bash
# At session start - Load your current tasks:
read_all_from_sheet 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker"

# Update task status to IN_PROGRESS:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 3 7 "IN_PROGRESS"

# Record verification results:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 3 8 "npm run type-check: 0 errors"

# Mark task COMPLETED:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 3 7 "COMPLETED"
```

**YOUR ASSIGNED TASKS** (Terminal 1 Frontend Focus):
1. **TASK-002**: Fix apps/inventory TypeScript compilation errors
2. **TASK-013**: Fix apps/inventory TypeScript compilation (extended)  
3. **TASK-014**: Fix apps/handouts TypeScript compilation errors
4. **TASK-015**: Verify apps/checkin-kiosk compilation status

## 🚫 **DO NOT TOUCH** (Terminal 2's Domain):
- Any files in `packages/` directory (backend packages)
- **TASK-001**: @ganger/db ioredis dependency (Terminal 2 only)
- Database, migrations, or MCP server configurations

## 🔧 **VERIFICATION GATES** (ALL must pass before "COMPLETED"):
```bash
# Run in each app directory - ALL must succeed:
npm run type-check    # 0 TypeScript errors required
npm run lint         # Must pass without errors  
npm run build        # Must build successfully
```

## 📋 **CONTEXT RECOVERY FILES**:
1. `/mnt/q/Projects/ganger-platform/_claude_desktop/COMPACT_CONTEXT.md`
2. `/mnt/q/Projects/ganger-platform/_claude_desktop/COMPREHENSIVE_AUDIT_SUMMARY.md`
3. This handoff file

**START**: Run verification commands to see current errors
**END**: All frontend apps compile successfully with verification gates passed
```

### **⚙️ TERMINAL 2 (BACKEND) HANDOFF TEMPLATE**

**File Format**: `YYMMDD-##-terminal2-handoff.md`  
**Copy this template for each Terminal 2 session:**

```markdown
# Terminal 2 Backend Session - [YYMMDD]-[increment]

## 🚨 **ANTI-HALLUCINATION PROTOCOL - READ FIRST**

**WARNING**: If you claim backend work is "already completed" without verification, you are experiencing AI documentation drift.

**MANDATORY REALITY CHECK**: Before making ANY claims, run these verification commands:

```bash
cd /mnt/q/Projects/ganger-platform/packages/db
npm run type-check
# Run actual verification - don't assume status

npm run type-check
# Root level check - verify workspace compilation
```

## 🧠 **MEMORY MCP CONTEXT PRESERVATION**

**CRITICAL: Use Memory MCP throughout your session to prevent context loss**

**Required Memory MCP Updates:**
```bash
# At session start:
mcp__memory__add_observations (Terminal 2 session started, load previous context)

# Every 15 minutes during work:
mcp__memory__add_observations (Progress update: files modified, commands run, current status)

# After each verification:
mcp__memory__add_observations (Verification results: npm run type-check output, compilation status)

# Before task completion:
mcp__memory__add_observations (Task completion status, verification gates passed)

# When documenting infrastructure:
mcp__memory__add_observations (Infrastructure findings: what works vs aspirational claims)
```

**Context to Preserve**:
- Current task being worked on
- Package compilation status discovered
- Files modified in this session
- Verification commands run and their results
- Infrastructure reality vs documentation gaps found
- Next planned actions

## 🔒 **CRITICAL: ENVIRONMENT VARIABLES & SECRETS SECURITY POLICY**

**🚨 NEVER USE PLACEHOLDERS FOR EXISTING SECRETS 🚨**

**CLAUDE.md Security Policy (STRICTLY ENFORCE)**:
- ✅ **PRESERVE** all working configuration values exactly as they exist
- ✅ **REFERENCE** actual environment variables in CLAUDE.md  
- ✅ **USE** real credentials that are already working
- ✅ **DOCUMENT** required variables but keep working values
- ❌ **NEVER** replace working values with "your-value-here" placeholders
- ❌ **NEVER** sanitize credentials that are intentionally committed
- ❌ **NEVER** create extra work by requiring secret re-entry

**When Working with Environment Variables:**
```bash
# ✅ CORRECT: Reference actual working values
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ WRONG: Don't replace with placeholders
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-anon-key-here
```

**Rationale**: This is internal tooling with working infrastructure that depends on exact values.

## 📊 **GOOGLE SHEETS MCP INTEGRATION - EXPLICIT USAGE**

**🚨 CRITICAL: Never use WebFetch on Google Sheets URL - Use MCP tools directly**

**Required Environment Setup:**
```bash
# Google Sheets MCP now uses OAuth2 - no environment variables needed
```

**EXPLICIT MCP COMMANDS TO USE:**
```bash
# At session start - Load your current tasks:
read_all_from_sheet 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker"

# Update task status to IN_PROGRESS:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 6 7 "IN_PROGRESS"

# Record verification results:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 6 8 "npm run type-check: packages/db PASS"

# Mark task COMPLETED:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 6 7 "COMPLETED"
```

**YOUR ASSIGNED TASKS** (Terminal 2 Backend Focus):
1. **TASK-001**: ✅ COMPLETED - Fixed @ganger/db ioredis dependency 
2. **TASK-006**: Fix TypeScript rootDir configuration errors
3. **TASK-007**: Audit workspace package dependencies
4. **TASK-008**: Environment variables validation
5. **TASK-005**: Documentation reality reconciliation

## 🚫 **DO NOT TOUCH** (Terminal 1's Domain):
- Any files in `apps/` directory (frontend applications)
- **TASK-002/003**: Frontend app compilation issues (Terminal 1 only)
- React/JSX components or frontend-specific problems

## 🔧 **VERIFICATION GATES** (ALL must pass before "COMPLETED"):
```bash
# Run in packages/db directory - ALL must succeed:
cd packages/db
npm run type-check    # 0 TypeScript errors required
npm run lint         # Must pass without errors
npm run build        # Must build successfully

# Root level verification:
npm run type-check    # Workspace compilation check
```

## 📋 **CONTEXT RECOVERY FILES**:
1. `/mnt/q/Projects/ganger-platform/_claude_desktop/COMPACT_CONTEXT.md`
2. `/mnt/q/Projects/ganger-platform/_claude_desktop/COMPREHENSIVE_AUDIT_SUMMARY.md`
3. This handoff file

**START**: Check packages/db compilation status and ioredis dependency
**END**: All backend packages compile successfully with verification gates passed
```

## 🔄 **ORGANIZED HANDOFF WORKFLOW**

### **📋 HANDOFF FILE NAMING CONVENTION**

**Format**: `[YYMMDD]-[increment]-terminal[x]-handoff.md`

**Examples**:
- `250609-01-terminal1-handoff.md` (June 9, 2025, first session, Terminal 1)
- `250609-01-terminal2-handoff.md` (June 9, 2025, first session, Terminal 2)  
- `250609-02-terminal1-handoff.md` (June 9, 2025, second session, Terminal 1)

### **📊 GOOGLE SHEETS INTEGRATION COMMANDS**

**Required for both terminals - Google Sheets URL**: https://docs.google.com/spreadsheets/d/1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k

**MCP Integration Pattern**:
```bash
# Check current tasks assigned to your terminal
# Update progress in real-time
# Mark verification gates as PASS/FAIL
# Update completion status only after ALL gates pass
```

### **🧠 MEMORY MCP CONTEXT RETENTION**

**Required for both terminals - Auto-save every 15 minutes**:

**Context to preserve**:
- Current task from Google Sheets
- Files modified in this session
- Verification commands run and results
- Next planned actions
- Any blockers encountered

### **🔧 MANDATORY VERIFICATION GATES**

**Before marking ANY task as "COMPLETED"**:

```bash
# ALL of these must pass:
npm run type-check    # 0 TypeScript errors
npm run lint         # ESLint passes
npm run build        # Build succeeds
# Functional test     # Feature actually works
```

### **📋 CONTEXT RECOVERY FILES**

**Essential files for session recovery**:
1. `/mnt/q/Projects/ganger-platform/_claude_desktop/COMPACT_CONTEXT.md`
2. `/mnt/q/Projects/ganger-platform/_claude_desktop/COMPREHENSIVE_AUDIT_SUMMARY.md`
3. `/mnt/q/Projects/ganger-platform/_claude_desktop/AUTOMATED_MANAGEMENT_STRATEGY.md`
4. Current handoff file

### **🎯 CURRENT PRIORITY TASKS** (from Google Sheets)

**Terminal 1 (Frontend)**:
- TASK-002: Fix apps/inventory TypeScript compilation
- TASK-003: Fix apps/handouts TypeScript compilation  
- TASK-004: Verify apps/checkin-kiosk status

**Terminal 2 (Backend)**:
- TASK-001: Fix @ganger/db ioredis dependency
- Package verification: Ensure all backend packages compile

### **🚨 ANTI-HALLUCINATION ENFORCEMENT**

**Both terminals MUST**:
- **Run verification commands BEFORE claiming success** - no assumptions
- **Use Memory MCP every 15 minutes** to preserve context and prevent loss
- **Update progress tracking** with actual command output, not aspirational claims
- **Load previous context from Memory MCP** at session start
- **Preserve verification results** in Memory MCP for continuity

### **🔒 ENVIRONMENT VARIABLES SECURITY ENFORCEMENT**

**Both terminals MUST**:
- **NEVER replace working credentials with placeholders**
- **PRESERVE existing environment variable values exactly**
- **REFERENCE actual working infrastructure in CLAUDE.md**
- **AVOID creating extra work** by requiring secret re-entry
- **FOLLOW CLAUDE.md security policy** - this is internal tooling, not open source

### **🧠 MEMORY MCP INTEGRATION REQUIREMENTS**

**Mandatory for both terminals**:
```bash
# Session start - load previous context
mcp__memory__search_nodes (query: "Terminal [1/2] Session Context")
mcp__memory__add_observations (session start with previous context loaded)

# During work - preserve progress every 15 minutes
mcp__memory__add_observations (current task, files modified, verification results)

# Task completion - record verified completion
mcp__memory__add_observations (task completed, verification gates passed)
```

**NEVER CLAIM WORK IS COMPLETE WITHOUT VERIFICATION COMMAND SUCCESS + MEMORY MCP UPDATE**