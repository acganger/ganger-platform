# Documentation Protocol
*Prevent documentation sprawl and maintain single sources of truth*

## 🚨 **CRITICAL RULE: NO NEW STATUS/PROGRESS FILES**

Before creating ANY new documentation file, check if it should be updated in an existing file instead.

## 📋 **File Hierarchy & Purposes**

### **ROOT LEVEL - Project Entry Points**
- **`README.md`** - Project overview, quick start, basic commands
- **`PROJECT_TRACKER.md`** - ⭐ **SINGLE SOURCE OF TRUTH** for all status updates
- **`CLAUDE.md`** - Claude Code project instructions and context

### **DOCS FOLDER - Reference Documentation**
- **`docs/SETUP.md`** - Complete setup and development instructions
- **`docs/NEW_APPLICATION_DEVELOPMENT_STANDARDS.md`** - ⭐ **SINGLE SOURCE** for all development standards and processes
- **`docs/SYSTEM_ARCHITECTURE.md`** - Current proven architecture patterns
- **`docs/AUTHENTICATION_STANDARDS.md`** - Authentication implementation reference
- **`docs/DEPLOYMENT.md`** - Production deployment procedures
- **`docs/DOCUMENTATION_PROTOCOL.md`** - This file

### **PRDs FOLDER - Requirements**
- **`PRDs/`** - Individual application requirements and specifications

## ⚠️ **FORBIDDEN ACTIONS**

### **DO NOT CREATE:**
- `DEVELOPMENT_STATUS.md`
- `INFRASTRUCTURE_NOTES.md` 
- `README_DEVELOPMENT.md`
- `PROGRESS_UPDATE.md`
- `STATUS_REPORT.md`
- Any file ending in `_STATUS.md`, `_NOTES.md`, `_PROGRESS.md`

### **DO NOT DUPLICATE:**
- Development timeline information
- Infrastructure status
- Progress tracking
- Task lists
- Environment setup status

## ✅ **CORRECT WORKFLOW**

### **For Status Updates:**
1. Open `PROJECT_TRACKER.md`
2. Update the relevant section
3. Add timestamp
4. Update todo list if needed
5. **DO NOT** create new files

### **For New Features/Planning:**
1. Check if it belongs in `docs/NEW_APPLICATION_DEVELOPMENT_STANDARDS.md`
2. If it's a new PRD, add to `PRDs/` folder
3. If it's setup instructions, update `docs/SETUP.md`
4. If it's a quick reference, add to `README.md`

### **For Infrastructure Changes:**
1. Update `PROJECT_TRACKER.md` infrastructure section
2. Update `docs/SETUP.md` if setup process changes
3. Update `CLAUDE.md` if it affects Claude Code workflow

## 📝 **Content Guidelines**

### **PROJECT_TRACKER.md Structure:**
```markdown
# Header with protocol reference
## Overall Progress (timeline table)
## Infrastructure Status (components table)
## Shared Packages Status
## Application Development Status  
## Next Steps (priority ordered)
## Blockers and Issues
```

### **Documentation Updates:**
- Always include timestamps
- Use consistent status indicators (✅ 📋 🔄 ⚠️ 🔥)
- Reference other docs instead of duplicating content
- Keep entries concise but complete

## 🔄 **Review Process**

### **Before Creating New Docs:**
1. ❓ "Does this update existing status?" → Update `PROJECT_TRACKER.md`
2. ❓ "Is this a setup instruction?" → Update `docs/SETUP.md`
3. ❓ "Is this project overview info?" → Update `README.md`
3. ❓ "Is this a planning document?" → Check `docs/NEW_APPLICATION_DEVELOPMENT_STANDARDS.md`
5. ❓ "Is this a new requirement?" → Add to `PRDs/` folder

### **Monthly Cleanup:**
- Review all documentation files
- Consolidate any duplicate information
- Remove outdated information
- Update links and references

## 🎯 **Success Metrics**

**Good Documentation:**
- Single source of truth for each type of information
- Easy to find current status
- No conflicting information
- Clear next steps

**Warning Signs:**
- Multiple files with similar names
- Conflicting status information
- Outdated information in multiple places
- Difficulty finding current status

---

**Remember: When in doubt, update existing files instead of creating new ones!**