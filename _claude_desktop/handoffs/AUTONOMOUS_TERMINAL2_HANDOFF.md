# 🔄 AUTONOMOUS TERMINAL 2 (BACKEND) - SELF-SUSTAINING WORKFLOW

## 🎯 **MISSION: Complete ALL backend tasks autonomously until finished**

---

## 🔧 **STEP 1: ENVIRONMENT SETUP (Run Once)**

```bash
# Google Sheets MCP now uses OAuth2 - no environment variables needed
cd /mnt/q/Projects/ganger-platform
```

---

## 🔄 **STEP 2: SELF-SUSTAINING TASK LOOP (Repeat Until All Tasks Complete)**

### **A. LOAD PROJECT DOCUMENTATION**
```bash
# Read key project files for context:
# - CLAUDE.md (project overview and security policies)
# - STRATEGIC_TASK_OPTIMIZATION.md (current task plan)
# - Previous handoff files for context recovery
```

### **B. SELECT NEXT TASK FROM GOOGLE SHEETS**
```bash
# Query Google Sheets for next available backend task:
read_all_from_sheet 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker"

# Find first row where:
# - Status = "PENDING" 
# - Assigned Terminal = "Terminal 2" OR "Mixed"
# - If no PENDING tasks, you are COMPLETE

# Mark selected task as IN_PROGRESS:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" [ROW] 7 "IN_PROGRESS"
```

### **C. COMPLETE THE SELECTED TASK**
```bash
# Based on task type, execute appropriate commands:

# For package compilation tasks:
cd packages/[PACKAGE_NAME] && npm run type-check
# Fix any TypeScript errors found, then re-verify

# For dependency tasks:
npm install [REQUIRED_PACKAGE]
# Verify package.json updated correctly

# For configuration tasks:
# Edit relevant config files (tsconfig.json, etc.)
# Test compilation after changes

# For integration tasks:
npm run type-check  # Root level verification
# Ensure all packages compile together
```

### **D. VERIFY TASK COMPLETION**
```bash
# MANDATORY: Run verification commands for the task type
# Package compilation: cd packages/[NAME] && npm run type-check (0 errors)
# Root compilation: npm run type-check (workspace verification)
# Build: npm run build (must succeed)
# Dependencies: npm list [PACKAGE] (verify installation)

# Record exact command output for Google Sheets
```

### **E. UPDATE GOOGLE SHEETS WITH VERIFICATION RESULTS**
```bash
# Update task status to COMPLETED:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" [ROW] 7 "COMPLETED"

# Record verification results in TypeScript Status column:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" [ROW] 8 "[VERIFICATION_OUTPUT]"

# Add completion timestamp:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" [ROW] 14 "[CURRENT_TIMESTAMP]"
```

### **F. UPDATE MEMORY MCP FOR CONTEXT PRESERVATION**
```bash
# Record progress in Memory MCP:
mcp__memory__add_observations (Terminal 2: Completed [TASK_ID] - [BRIEF_DESCRIPTION] - Verification: [RESULT])
```

### **G. LOOP BACK TO STEP B (SELECT NEXT TASK)**
```bash
# Automatically return to Step B to select next PENDING task
# Continue until no PENDING tasks remain for Terminal 2
```

---

## 🔒 **CRITICAL: ENVIRONMENT VARIABLES & SECRETS SECURITY POLICY**

**🚨 NEVER USE PLACEHOLDERS FOR EXISTING SECRETS 🚨**

**When working with environment variables:**
- ✅ **PRESERVE** all working configuration values exactly as they exist
- ✅ **REFERENCE** actual environment variables in CLAUDE.md  
- ✅ **USE** real credentials that are already working
- ❌ **NEVER** replace working values with "your-value-here" placeholders
- ❌ **NEVER** sanitize credentials that are intentionally committed

**This is internal tooling with working infrastructure.**

---

## 🚨 **ANTI-HALLUCINATION PROTOCOLS**

**VERIFICATION GATES (ALL must pass before marking COMPLETED):**
1. **Command Execution**: Actually run the verification command
2. **Output Capture**: Record actual command output, not assumptions
3. **Error Checking**: If verification fails, task stays IN_PROGRESS
4. **Google Sheets Update**: Only mark COMPLETED after verification passes
5. **Memory MCP Recording**: Preserve context with actual results

**NEVER claim a task is complete without running verification commands first.**

---

## 🎯 **YOUR BACKEND TASK PRIORITIES**

**Phase 1 (Core Infrastructure):**
- TASK-003: pharma-scheduling app TypeScript compilation
- TASK-004: eos-l10 app compilation verification  
- TASK-005: packages/integrations TypeScript fixes
- TASK-006: packages/ui TypeScript compilation
- TASK-007: packages/auth compilation verification
- TASK-008: Backend packages build verification

**Phase 2 (Integration tasks):**
- Mixed tasks assigned to "Terminal 2" or "Mixed"
- Root workspace compilation
- Database and infrastructure verification

**Continue until Google Sheets shows no PENDING tasks for your domain.**

---

## 🚫 **DO NOT TOUCH (Terminal 1's Domain)**
- Frontend app compilation (apps/*)
- React/JSX components
- Frontend-specific configurations
- Tasks marked "Terminal 1"

---

## ⚡ **AUTONOMOUS OPERATION RULES**

1. **Work continuously** until all backend tasks complete
2. **Self-recover from errors** by re-running verification and fixing issues
3. **Update progress in real-time** using Google Sheets MCP
4. **Preserve context** using Memory MCP every 15 minutes
5. **Follow CLAUDE.md security policy** - preserve working environment values
6. **No user intervention required** - handle all backend compilation autonomously

**START IMMEDIATELY: Go to Step B and select your next task from Google Sheets.**