# 🔄 AUTONOMOUS TERMINAL 1 (FRONTEND) - SELF-SUSTAINING WORKFLOW

## 🎯 **MISSION: Complete ALL frontend tasks autonomously until finished**

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
# Query Google Sheets for next available frontend task:
read_all_from_sheet 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker"

# Find first row where:
# - Status = "PENDING" 
# - Assigned Terminal = "Terminal 1" OR "Mixed"
# - If no PENDING tasks, you are COMPLETE

# Mark selected task as IN_PROGRESS:
edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" [ROW] 7 "IN_PROGRESS"
```

### **C. COMPLETE THE SELECTED TASK**
```bash
# Based on task type, execute appropriate commands:

# For TypeScript compilation tasks:
cd apps/[APP_NAME] && npm run type-check
# Fix any errors found, then re-verify

# For configuration tasks:
# Edit relevant config files, test compilation

# For build tasks:
npm run build
# Verify build succeeds

# For code quality tasks:
npm run lint && npm run format
# Fix any linting issues
```

### **D. VERIFY TASK COMPLETION**
```bash
# MANDATORY: Run verification commands for the task type
# TypeScript: npm run type-check (must show 0 errors)
# Build: npm run build (must succeed)
# Lint: npm run lint (must pass)

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
mcp__memory__add_observations (Terminal 1: Completed [TASK_ID] - [BRIEF_DESCRIPTION] - Verification: [RESULT])
```

### **G. LOOP BACK TO STEP B (SELECT NEXT TASK)**
```bash
# Automatically return to Step B to select next PENDING task
# Continue until no PENDING tasks remain for Terminal 1
```

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

## 🎯 **YOUR FRONTEND TASK PRIORITIES**

**Phase 1 (Continue from current progress):**
- TASK-009: medication-auth app TypeScript compilation
- TASK-010: Next.js build configurations optimization
- TASK-011: Tailwind CSS configurations verification
- TASK-012: ESLint and code quality fixes

**Phase 2 (Integration tasks):**
- Mixed tasks assigned to "Terminal 1" or "Mixed"
- Root workspace verification
- Build optimization tasks

**Continue until Google Sheets shows no PENDING tasks for your domain.**

---

## 🚫 **DO NOT TOUCH (Terminal 2's Domain)**
- Backend package compilation (packages/*)
- Database migrations
- MCP server configurations
- Infrastructure setup tasks marked "Terminal 2"

---

## ⚡ **AUTONOMOUS OPERATION RULES**

1. **Work continuously** until all frontend tasks complete
2. **Self-recover from errors** by re-running verification and fixing issues
3. **Update progress in real-time** using Google Sheets MCP
4. **Preserve context** using Memory MCP every 15 minutes
5. **No user intervention required** - handle all frontend compilation autonomously

**START IMMEDIATELY: Go to Step B and select your next task from Google Sheets.**