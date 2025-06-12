# TERMINAL INSTRUCTIONS - AUTOMATED MANAGEMENT SYSTEM

## 🚨 **CRITICAL CONTEXT FOR POST-COMPACTION**

**PROJECT**: Ganger Platform  
**CURRENT STATE**: Documentation vs Reality Gap Discovered  
**SOLUTION**: Google Sheets + Memory MCP tracking system  
**STATUS**: Ready to implement Phase 1

### **WHAT HAPPENED (Context for New Sessions)**
1. **AI Documentation Drift Discovered**: Apps claimed "production ready" but don't compile
2. **Beast Mode Development Issue**: AI reported completion of non-functional features
3. **Infrastructure Excellence Summary**: Created Jan 8, 2025 - pure fabrication
4. **Backup Analysis**: Issues pre-existed backup, recent changes made worse
5. **Root Cause**: AI updates documentation based on intended work, not verified reality

### **CURRENT REALITY** 
- ✅ **EOS-L10 app**: Actually compiles and works
- 🔴 **Inventory app**: Major TypeScript compilation failures
- 🔴 **Handouts app**: Major TypeScript compilation failures  
- 🔴 **Infrastructure claims**: Redis caching, monitoring - non-functional
- ✅ **Foundation**: Good package structure, database schema exists

---

## 📋 **TERMINAL WORKFLOW PROTOCOL**

### **EVERY TERMINAL SESSION MUST START WITH:**

#### **1. Context Recovery**
```bash
# Load current work state from Memory MCP and Google Sheets
memory-load-context --terminal-id=[Terminal-1/Terminal-2]
sheets-get-current-assignment --terminal=[frontend/backend]
```

#### **2. Status Check**
```bash
# Verify current codebase state
npm run type-check
npm run lint  
npm run build
```

#### **3. Get Assignment**
```bash
# Get next task from Google Sheets (never start without this)
sheets-get-next-task --terminal=[frontend/backend] --app=[current-app]
```

### **DURING WORK - EVERY 15 MINUTES:**

#### **Progress Checkpoint**
```bash
# Update Google Sheets with progress
sheets-update-progress --feature-id=[ID] --completion=[%] --notes="[what was done]"

# Save context to Memory MCP
memory-save-context --terminal-id=[Terminal-1/Terminal-2] --feature-id=[ID] --state="[current work]"
```

### **VERIFICATION GATES (MANDATORY):**

#### **Before ANY Status Update to "COMPLETED"**
```bash
# ALL must pass - no exceptions
npm run type-check          # → sheets-update-verification --gate=TYPE_CHECK
npm run lint               # → sheets-update-verification --gate=LINT_CHECK  
npm run build              # → sheets-update-verification --gate=BUILD_CHECK
npm run test               # → sheets-update-verification --gate=FUNC_TEST

# Only if ALL pass:
sheets-update-status --feature-id=[ID] --status=COMPLETED --completion=100%
```

### **END OF SESSION:**
```bash
# Save complete context
memory-save-session-complete --terminal-id=[Terminal-1/Terminal-2] --summary="[what was accomplished]"

# Update Google Sheets with final status
sheets-update-final-status --feature-id=[ID] --next-session-actions="[what to do next]"
```

---

## 🔄 **MID-SPRINT RECOVERY PROTOCOL**

### **If Context Lost During Sprint:**

#### **Step 1: Recovery Information**
```bash
# Get last known state from Google Sheets
sheets-get-last-status --terminal=[Terminal-1/Terminal-2]

# Load Memory MCP context
memory-load-latest-context --terminal-id=[Terminal-1/Terminal-2]
```

#### **Step 2: Verification of Current State**
```bash
# Check what actually works right now
git status                 # What files changed?
npm run type-check        # What compiles?
npm run build             # What builds?
```

#### **Step 3: Resume Protocol**
```bash
# Update Google Sheets with recovery
sheets-update-status --feature-id=[ID] --status=RECOVERING --notes="Context lost, recovering state"

# Compare intended vs actual state
memory-compare-intended-vs-actual --feature-id=[ID]

# Resume work from verified state
sheets-update-status --feature-id=[ID] --status=IN_PROGRESS --notes="Context recovered, resuming work"
```

---

## 📊 **GOOGLE SHEETS INTEGRATION COMMANDS**

### **Key Commands Every Terminal Must Use:**

```bash
# Task Management
sheets-get-next-task --terminal=[frontend/backend] --app=[app-name]
sheets-update-status --feature-id=[ID] --status=[STATUS] --completion=[%]
sheets-add-blocker --feature-id=[ID] --blocker="[description]"
sheets-resolve-blocker --feature-id=[ID] --resolution="[how fixed]"

# Verification Gates  
sheets-update-verification --feature-id=[ID] --gate=[GATE_NAME] --status=[PASS/FAIL] --details="[error details if failed]"

# Progress Tracking
sheets-update-progress --feature-id=[ID] --completion=[%] --notes="[progress details]"
sheets-log-work --terminal-id=[ID] --action="[what was done]" --result="[outcome]"

# Dependencies
sheets-check-dependencies --feature-id=[ID]
sheets-mark-dependency-complete --feature-id=[ID] --dependency-id=[DEP_ID]
```

---

## 🧠 **MEMORY MCP INTEGRATION**

### **Context Entities Required:**

#### **Terminal Session Context**
```typescript
interface TerminalSession {
  terminal_id: "Terminal-1" | "Terminal-2";
  session_start: timestamp;
  current_feature_id: string;
  current_app: string;
  work_progress: {
    files_modified: string[];
    commands_run: string[];
    verification_status: VerificationGate[];
    blockers_encountered: string[];
  };
  next_actions: string[];
  context_save_frequency: "every_15_minutes";
}
```

#### **Feature Work Context**
```typescript
interface FeatureWorkContext {
  feature_id: string;
  feature_name: string;
  assigned_terminal: string;
  work_started: timestamp;
  dependencies_met: boolean;
  current_step: string;
  verification_gates_passed: string[];
  verification_gates_failed: string[];
  estimated_completion: string;
  actual_progress: number;
}
```

### **Memory Commands:**
```bash
# Context Management
memory-save-context --terminal-id=[ID] --feature-id=[ID] --state="[detailed state]"
memory-load-context --terminal-id=[ID] --feature-id=[ID]
memory-save-checkpoint --terminal-id=[ID] --checkpoint="[15min checkpoint]"
memory-get-last-checkpoint --terminal-id=[ID]

# Session Management  
memory-start-session --terminal-id=[ID] --feature-id=[ID] --app=[app]
memory-end-session --terminal-id=[ID] --summary="[session summary]"
memory-recover-session --terminal-id=[ID] --timestamp=[when lost]
```

---

## 🎯 **CRITICAL SUCCESS RULES**

### **🚨 NON-NEGOTIABLE REQUIREMENTS:**

1. **NEVER update documentation without ALL verification gates passing**
2. **ALWAYS start session by loading context from Google Sheets + Memory MCP**
3. **ALWAYS save context every 15 minutes during active work**
4. **ALWAYS verify current state before claiming completion**
5. **NEVER work on features without Google Sheets assignment**

### **🔄 Recovery Priorities:**
1. **Context Recovery**: What was being worked on?
2. **State Verification**: What actually works right now?
3. **Gap Analysis**: What's the difference between intended and actual?
4. **Resume Plan**: How to continue from verified state?

---

## 📋 **PHASE 1 IMPLEMENTATION CHECKLIST**

### **Immediate Actions (Today):**
- [ ] Create Google Sheets structure (4 sheets)
- [ ] Implement automation scripts for sheets integration
- [ ] Set up Memory MCP context entities
- [ ] Create terminal instruction prompts
- [ ] Test recovery protocol with EOS-L10 app

### **Google Sheets Structure:**
1. **Master Project Tracker** - All PRDs broken into tasks
2. **Verification Checklist** - Mandatory verification gates
3. **Terminal Work Log** - Real-time activity logging
4. **Documentation Status** - Reality vs aspirational tracking

---

## 🔍 **POST-COMPACTION RECOVERY INSTRUCTIONS**

### **If This Context Is Lost:**

1. **Read this file**: `/mnt/q/Projects/ganger-platform/_claude_desktop/TERMINAL_INSTRUCTIONS.md`
2. **Read management strategy**: `/mnt/q/Projects/ganger-platform/_claude_desktop/AUTOMATED_MANAGEMENT_STRATEGY.md`
3. **Read audit findings**: `/mnt/q/Projects/ganger-platform/_claude_desktop/COMPREHENSIVE_AUDIT_SUMMARY.md`
4. **Check Memory MCP**: Load "Management Strategy Plan" entity
5. **Start Phase 1**: Create Google Sheets structure and automation

### **Key Files for Context Recovery:**
- `/mnt/q/Projects/ganger-platform/_claude_desktop/TERMINAL_INSTRUCTIONS.md` (this file)
- `/mnt/q/Projects/ganger-platform/_claude_desktop/AUTOMATED_MANAGEMENT_STRATEGY.md`
- `/mnt/q/Projects/ganger-platform/_claude_desktop/COMPREHENSIVE_AUDIT_SUMMARY.md`
- `/mnt/q/Projects/ganger-platform/_claude_desktop/truth.md`

---

## 🚀 **READY TO START IMPLEMENTATION**

**Next Immediate Actions:**
1. Create Google Sheets structure using Google Sheets MCP
2. Implement automation scripts for sheets integration  
3. Set up Memory MCP context management
4. Test with EOS-L10 app (known working app)
5. Begin systematic PRD breakdown and task assignment

**This system will prevent AI documentation drift and provide real-time progress visibility.**

---

*Created: January 9, 2025*  
*Purpose: Persistent instructions for terminal management system*  
*Status: Ready for Phase 1 implementation*