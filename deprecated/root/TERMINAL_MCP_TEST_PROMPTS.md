# 🔬 TERMINAL MCP TEST PROMPTS - Google Sheets Integration

## 🎯 **TERMINAL 1 (FRONTEND) TEST PROMPT**

**Copy and paste this into Terminal 1:**

```
# Terminal 1 MCP Test Session - Google Sheets Integration
# Goal: Test new Google Sheets MCP functionality with frontend tasks

## Step 1: Test Google Sheets MCP Connection
First, let me test if the Google Sheets MCP tools are available:

read_all_from_sheet 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker"

If successful, I should see all 26 tasks in the spreadsheet.

## Step 2: Test Cell Update Capability
Now let me test updating a cell to mark a task as IN_PROGRESS:

edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 16 7 "IN_PROGRESS"

This should update row 16 (a Terminal 1 task), column 7 (Status) to "IN_PROGRESS".

## Step 3: Test Reading Updated Data
Let me verify the update worked:

read_all_from_sheet 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker"

I should see the status change in the data.

## Step 4: Run Actual Frontend Work
Now let me do some real frontend work and update the sheet:

cd /mnt/q/Projects/ganger-platform/apps/inventory
npm run type-check

Record the actual output and update the TypeScript Status column:

edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 16 8 "npm run type-check result: [ACTUAL_OUTPUT]"

## Step 5: Complete Task and Update Status
Mark the task as completed:

edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 16 7 "COMPLETED"

Add completion timestamp:

edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 16 14 "$(date -Iseconds)"

## Step 6: Memory MCP Context Update
mcp__memory__add_observations Terminal 1 MCP Test SUCCESSFUL - Google Sheets read/write operations working - Frontend task completed with real-time tracking

Report back:
✅ Google Sheets MCP Connection: [SUCCESS/FAILED]
✅ Read Operations: [SUCCESS/FAILED] 
✅ Write Operations: [SUCCESS/FAILED]
✅ Real-time Tracking: [SUCCESS/FAILED]
✅ Ready for Autonomous Work: [YES/NO]
```

---

## 🎯 **TERMINAL 2 (BACKEND) TEST PROMPT**

**Copy and paste this into Terminal 2:**

```
# Terminal 2 MCP Test Session - Google Sheets Integration
# Goal: Test new Google Sheets MCP functionality with backend tasks

## Step 1: Test Google Sheets MCP Connection
First, let me test if the Google Sheets MCP tools are available:

read_all_from_sheet 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker"

If successful, I should see all 26 tasks in the spreadsheet.

## Step 2: Find My Next Backend Task
Look for a PENDING task assigned to "Terminal 2" that I can work on:

# From the data above, identify a Terminal 2 task that's PENDING
# Example: TASK-006 (rootDir config) or TASK-007 (package audit)

## Step 3: Mark Task IN_PROGRESS
Update the selected task to IN_PROGRESS (example using row 7 for TASK-006):

edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 7 7 "IN_PROGRESS"

## Step 4: Do Real Backend Work
Execute the actual task. For example, if it's a package compilation check:

cd /mnt/q/Projects/ganger-platform/packages/db
npm run type-check

Or if it's rootDir configuration:
# Check and update tsconfig.json rootDir settings

## Step 5: Record Verification Results
Update the TypeScript Status column with actual verification output:

edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 7 8 "[ACTUAL_VERIFICATION_OUTPUT]"

## Step 6: Complete Task
Mark task as completed:

edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 7 7 "COMPLETED"

Add completion timestamp:

edit_cell 1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k "Master Project Tracker" 7 14 "$(date -Iseconds)"

## Step 7: Memory MCP Context Update
mcp__memory__add_observations Terminal 2 MCP Test SUCCESSFUL - Google Sheets operations working - Backend task completed with verification

Report back:
✅ Google Sheets MCP Connection: [SUCCESS/FAILED]
✅ Task Selection: [SUCCESS/FAILED]
✅ Progress Tracking: [SUCCESS/FAILED] 
✅ Verification Recording: [SUCCESS/FAILED]
✅ Ready for Autonomous Work: [YES/NO]
```

---

## 🔧 **MCP TOOLS REFERENCE**

**Available Google Sheets MCP Tools:**
- `read_all_from_sheet SPREADSHEET_ID "SHEET_NAME"` - Read entire sheet
- `edit_cell SPREADSHEET_ID "SHEET_NAME" ROW COL "VALUE"` - Update single cell
- `edit_row SPREADSHEET_ID "SHEET_NAME" ROW [VALUES]` - Update entire row
- `list_sheets SPREADSHEET_ID` - List all tabs
- `refresh_auth` - Re-authenticate if needed

**Parameters:**
- **Spreadsheet ID**: `1AVWbNZg6ozBIVk0D-0EWaHk7xn3LxovGqzBKjgYGq8k`
- **Sheet Name**: `"Master Project Tracker"`
- **Columns**: 1=Task ID, 2=PRD Source, 3=Component, 4=Description, 5=Assigned Terminal, 6=Priority, 7=Status, 8=TypeScript Status, 9=Build Status, 10=Functional Status, 11=Blocked By, 12=Created Date, 13=Due Date, 14=Completed Date, 15=Notes

---

## 🚨 **TROUBLESHOOTING**

**If MCP tools are not available:**
1. Check that `.mcp.json` is configured correctly
2. Verify OAuth2 credentials exist at `/mcp-servers/mkummer-google-sheets-mcp/dist/gcp-oauth.keys.json`
3. Restart Claude Desktop app to reload MCP configuration
4. Test direct server: `cd /mnt/q/Projects/ganger-platform/mcp-servers/mkummer-google-sheets-mcp && npm run start`

**Expected Success Indicators:**
- ✅ Can read spreadsheet data
- ✅ Can update individual cells  
- ✅ Changes appear in Google Sheets immediately
- ✅ Memory MCP tracking works
- ✅ Ready for 21 PENDING tasks autonomous work

*Run these tests to verify Google Sheets MCP is fully functional for autonomous terminal operation!*