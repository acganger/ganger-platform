# Claude Code Custom Commands

## Documentation Commands

### `/sprint` - Session Initialization
Reads all project documentation to load context before starting a new development session.

**Usage:**
```bash
# Start a new development session
npm run docs:sprint

# Or direct execution
node scripts/docs/sprint.js
```

**What it does:**
- 📁 Reads all core files (PROJECT_TRACKER.md, README.md, CLAUDE.md)
- 📚 Reads all documentation in /docs
- 📋 Reads all PRDs in /PRDs
- 📊 Shows summary of files and total size read
- 🚀 Prepares context for new development work

**Use this at the start of every development session to ensure Claude has full project context!**

---

### `/updatedocs` - Session-Aware Documentation Updater
Analyzes recent development session, detects work patterns, and intelligently updates documentation with your approval.

**NEW: Session-Aware Intelligence**
- 🎯 **Detects recent work** - Scans last 12 hours for development activity
- 🔍 **Identifies patterns** - Recognizes app development, infrastructure updates, documentation changes
- 📝 **Proposes specific updates** - Generates precise documentation changes based on actual work
- ❓ **Interactive approval** - Shows you exactly what will be updated before making changes
- ✅ **Applies updates** - Makes only approved changes to PROJECT_TRACKER.md and /docs files

**Usage:**
```bash
# Method 1: Direct npm script
npm run docs:update

# Method 2: Full analysis with shell script  
npm run docs:check

# Method 3: Direct execution
node scripts/docs/update-docs.js
```

**5-Phase Enhanced Process:**

**PHASE 1: Documentation Status Check**
- ✅ Core files exist (PROJECT_TRACKER.md, README.md, CLAUDE.md)
- ✅ Documentation structure follows protocol
- ✅ No forbidden file patterns (_STATUS.md, _NOTES.md, etc.)
- ✅ No duplicate development files
- ✅ PROJECT_TRACKER.md is current (updated within 7 days)
- ✅ Archive directory structure
- ✅ Protocol compliance score

**PHASE 2: Session Analysis (NEW)**
- 🎯 Scans recent file changes (last 12 hours)
- 📊 Identifies work patterns (medication-auth, new apps, infrastructure)
- 🗺️ Maps changes to documentation sections

**PHASE 3: Smart Update Generation (NEW)**
- 📝 Creates specific update proposals based on detected work
- 🎯 Context-aware updates for different types of development activity
- 📅 Smart timestamp updates with session context

**PHASE 4: Interactive Approval (NEW)**
- ❓ Shows each proposed update with preview
- ⚡ Selective approval - apply only what you want
- 🛡️ Safe operation - no surprises, full control

**PHASE 5: Automatic Updates (NEW)**
- ✅ Applies approved changes to PROJECT_TRACKER.md
- 📝 Documents session work completion
- 🎉 Provides completion report

### Example Usage in Claude Code:

**After completing a development session:**
```
/updatedocs
```

**Sample Interactive Flow:**
```
🎯 Found recent changes in apps/ and packages/
📝 Proposed updates:

1. Update PROJECT_TRACKER timestamp
   Priority: MEDIUM
   Reason: Development session completed
   Preview: *Last Updated: June 9, 2025 - Development Session Update*
   Apply this update? (y/n/s to skip): y
   ✅ Approved

2. Update application development status
   Priority: HIGH  
   Reason: Application development activity detected
   Preview: Update PROJECT_TRACKER with recent application development progress
   Apply this update? (y/n/s to skip): y
   ✅ Approved

🎉 Documentation update complete!
Applied 2 updates to PROJECT_TRACKER.md
```

## Recommended Workflow

**Start of development session:**
```
/sprint
```
*Loads all documentation into context*

**After completing development work:**
```
/updatedocs
```
*Updates documentation based on what you accomplished*

**Alternative:** You can also simply tell Claude Code:
```
bring all project documentation up to date
```
*Claude will update all relevant sections in /docs and PROJECT_TRACKER*

## Custom Command Pattern

To create additional commands, follow this pattern:

1. **Create script in `/scripts/[category]/`**
2. **Add npm script to package.json**
3. **Document in this file**
4. **Use descriptive slash command names**

### Other Useful Commands:

```bash
# Check all documentation
npm run docs:check

# Quick status check
npm run docs:update

# View documentation protocol
code docs/DOCUMENTATION_PROTOCOL.md

# Update project tracker
code PROJECT_TRACKER.md

# Check git status for docs
git status docs/
```

## Command Development Guidelines

When creating new commands:
- Keep them focused on single tasks
- Follow the documentation protocol
- Provide clear output with status indicators
- Include actionable recommendations
- Make them idempotent (safe to run multiple times)
