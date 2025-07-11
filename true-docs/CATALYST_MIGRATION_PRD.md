# Catalyst UI Migration - Product Requirements Document

*Created: January 11, 2025*  
*Milestone: [#1 - Catalyst UI Migration](https://github.com/acganger/ganger-platform/milestone/1)*  
*Project Duration: 3 months (Target: April 11, 2025)*

## 🎯 Executive Summary

The Ganger Platform consists of 17 production-ready medical applications built with custom React components. While functional, these components lack the polish and sophistication expected in modern healthcare software. This project will migrate the entire platform to Tailwind's Catalyst UI kit, delivering a premium user experience while maintaining all existing business logic.

**Critical Context**: This platform has not yet been launched to users. This is our ONE opportunity to deliver exceptional quality before go-live.

## 🚨 MANDATORY READING - Development Principles

**READ THESE FILES FIRST:**
1. `/CLAUDE.md` - Contains critical development principles including:
   - NO SHORTCUTS, NO HACKS, NO WORKAROUNDS
   - Definition of "complete" with explicit verification requirements
   - The cost of careless changes (2+ weeks wasted on deployment)
   - Stop pattern matching without understanding

2. `/true-docs/PROJECT_TRACKER.md` - Current platform status and architecture
3. `/true-docs/deployment/` - Deployment complexities and lessons learned

### Core Principles for This Migration:
1. **NEVER use scripts for mass updates** - Read each file, understand context, make changes manually
2. **NEVER make assumptions** - If unsure, stop and ask
3. **ALWAYS verify changes** - Build, type-check, and test in browser
4. **PROTECT business logic** - UI changes only, never modify functionality
5. **QUALITY over speed** - We have no time constraints, only quality metrics

## 🚨🚨 ABSOLUTE PROHIBITIONS - AUTOMATIC TERMINATION OFFENSES 🚨🚨

**The following actions will result in immediate project termination:**

### 1. **HACKJOB REWRITES**
❌ **FORBIDDEN**: Rewriting components to avoid errors
❌ **FORBIDDEN**: Removing "problematic" features instead of fixing them
❌ **FORBIDDEN**: Simplifying logic to make migration easier
✅ **REQUIRED**: Fix errors properly, maintain ALL existing functionality

**Example of FORBIDDEN hackjob:**
```typescript
// BEFORE: Complex form with validation
<Input 
  value={value} 
  onChange={handleChange} 
  onBlur={validateField}
  error={errors[field]}
/>

// ❌ FORBIDDEN HACKJOB: Removing validation to avoid errors
<CatalystInput value={value} onChange={handleChange} />
```

### 2. **CIRCULAR BREAK/FIX PATTERNS**
❌ **FORBIDDEN**: Fixing Component A breaks Component B, fixing B breaks A
❌ **FORBIDDEN**: Making changes without understanding dependencies
✅ **REQUIRED**: Map ALL dependencies before changing anything

**Mandatory Dependency Check:**
```bash
# MUST RUN before touching any component:
grep -r "ComponentName" packages/ apps/ --include="*.tsx" --include="*.ts"
# Document EVERY usage location
# Create dependency graph
# Plan for ALL impacts
```

### 3. **CASCADING MONOREPO FAILURES**
❌ **FORBIDDEN**: Deploying changes that break other apps
❌ **FORBIDDEN**: "I'll fix the other apps later" mentality
✅ **REQUIRED**: ALL affected apps must build before ANY commit

**Mandatory Pre-Commit Check:**
```bash
# MUST PASS before EVERY commit:
pnpm build  # ALL apps must build
pnpm type-check  # ZERO type errors
pnpm test  # ALL tests pass
```

### 4. **LOST CODE / FUNCTIONALITY**
❌ **FORBIDDEN**: Deleting code without preserving it
❌ **FORBIDDEN**: Removing features during migration
✅ **REQUIRED**: Create `ComponentNameLegacy.tsx` backup for EVERY component

**Mandatory Backup Process:**
```bash
# BEFORE touching any component:
cp Component.tsx ComponentLegacy.tsx
git add ComponentLegacy.tsx
git commit -m "backup: preserve original Component before migration"
```

### 5. **ASSUMPTION-BASED CHANGES**
❌ **FORBIDDEN**: "This probably works the same way"
❌ **FORBIDDEN**: "I think this is what they meant"
❌ **FORBIDDEN**: "This looks similar to X, so I'll do Y"
✅ **REQUIRED**: Test EVERY assumption, document EVERY decision

**Decision Documentation Required:**
```typescript
// REQUIRED comment for EVERY non-obvious change:
// MIGRATION NOTE: Changed prop 'color' to 'variant' because:
// 1. Catalyst Button uses 'variant' not 'color'
// 2. Mapped: color="primary" → variant="primary"
// 3. Tested in: ganger-actions, inventory, handouts
// 4. No functional change, only prop name
```

## 📊 Current State Analysis

### Component Inventory (23 Custom Components)
Based on usage analysis across all 17 apps:

**Critical Components** (High Usage):
- **Button**: 82 instances across all apps
- **Card** (+ variants): 67 instances  
- **LoadingSpinner**: 38 instances
- **Input**: 26 instances
- **Badge**: 33 instances

**Important Components** (Medium Usage):
- **Select**: 16 instances
- **Alert**: 10 instances
- **GangerLogo**: 13 instances (brand-specific)
- **StaffPortalLayout**: 9 instances (major UI element)
- **Modal**: 4 instances

**Low Usage Components**:
- **Progress**: 1 instance
- **Checkbox**: 3-4 instances
- **Avatar**: 4 instances
- **StatCard**: 5 instances
- **Others**: Various (1-5 instances each)

### Non-Component CSS Audit Required
- Check all `*.css` files for custom styles
- Look for inline styles in components
- Identify any non-Tailwind utility classes
- Find hardcoded colors/spacing not using design tokens

## 🎯 Goals & Success Criteria

### Primary Goals
1. **Premium User Experience**: Achieve enterprise-grade UI quality
2. **Developer Velocity**: New features built 5x faster using Catalyst
3. **Consistency**: Every interaction follows Catalyst patterns
4. **Maintainability**: Reduce custom CSS by 90%
5. **Future-Proof**: Easy updates as Catalyst evolves

### Success Metrics
- ✅ All 17 apps using Catalyst components exclusively
- ✅ Zero regression in functionality
- ✅ Page load times remain under 3 seconds
- ✅ Accessibility score improves to 95+
- ✅ Developer survey shows 90%+ satisfaction
- ✅ No custom component maintenance required

## 🏗️ Technical Approach

### Migration Strategy: Hybrid Approach (RECOMMENDED)

**Component-by-Component for shared packages + App-by-App for testing**

```
Phase 1: Low-Risk Components (Weeks 1-2)
├── Progress → 1 app affected
├── Checkbox → 3 apps affected
├── Avatar → 4 apps affected
└── Modal → 4 apps affected

Phase 2: Medium-Risk Components (Weeks 3-5)
├── Alert → 10 apps affected
├── Badge → 33 instances
├── Select → 16 instances
└── StatCard → 5 apps affected

Phase 3: Layout Components (Weeks 6-7)
├── StaffPortalLayout → 9 apps (CRITICAL)
└── PageHeader → Multiple apps

Phase 4: High-Risk Components (Weeks 8-10)
├── Input → 26 instances
├── Card System → 67 instances
└── Button → 82 instances

Phase 5: Polish & Optimization (Weeks 11-12)
├── Remove all custom CSS
├── Implement advanced Catalyst features
└── Performance optimization
```

### Branching Strategy

```bash
main (protected)
└── feature/catalyst-migration (long-lived feature branch)
    ├── catalyst/phase-1-progress-component
    ├── catalyst/phase-1-checkbox-component
    └── ... (one branch per component/phase)
```

**Process**:
1. Create long-lived `feature/catalyst-migration` branch
2. Create sub-branches for each component
3. PR from sub-branch → feature branch (fast reviews)
4. Weekly sync: feature branch → main (if stable)
5. Final merge: feature branch → main (complete migration)

### Rollback Strategy
1. **Component Level**: Git revert specific component changes
2. **App Level**: Revert to previous deployment in Vercel
3. **Full Platform**: Reset to main branch, abandon feature branch
4. **Partial Rollback**: Keep working components, revert problematic ones

## 📋 Implementation Checklist

### For EACH Component Migration:

```markdown
## Component: [Name] Migration Checklist

### 1. Analysis Phase
- [ ] Run usage analysis: `grep -r "ComponentName" apps/ --include="*.tsx"`
- [ ] List all apps affected
- [ ] Document all current props and their usage
- [ ] Check for component-specific business logic
- [ ] Identify any CSS/styling tied to component

### 2. Planning Phase  
- [ ] Find equivalent Catalyst component
- [ ] Map current props to Catalyst props
- [ ] Plan backwards compatibility approach
- [ ] Create migration guide for this component

### 3. Implementation Phase
- [ ] Create feature branch: `catalyst/[component-name]`
- [ ] Copy current component to `[Component]Legacy.tsx`
- [ ] Update component to use Catalyst
- [ ] Maintain exact same API (props/events)
- [ ] Add prop mapping/compatibility layer

### 4. Testing Phase
- [ ] Add side-by-side comparison in component-showcase
- [ ] Build all affected apps: `pnpm build`
- [ ] Type-check passes: `pnpm type-check`
- [ ] Manual test in EACH affected app
- [ ] Test all interactive states (hover, focus, disabled)
- [ ] Test dark mode compatibility
- [ ] Test mobile responsiveness

### 4.5. MANDATORY VERIFICATION PHASE
**NO EXCEPTIONS - MUST HAVE PROOF**
- [ ] Screenshot BEFORE migration for EVERY affected view
- [ ] Screenshot AFTER migration for EVERY affected view
- [ ] Record video of ALL interactive features working
- [ ] Document ANY visual differences (even 1px)
- [ ] Get written confirmation: "All functionality preserved"

**Required Proof Format:**
```markdown
## Component: Button - Verification Report
### App: ganger-actions
- Before: [screenshot-before.png]
- After: [screenshot-after.png]
- Functionality Test: [video-link]
- Visual Differences: NONE
- Forms Submit: ✅ VERIFIED
- Validation Works: ✅ VERIFIED
- Loading States: ✅ VERIFIED
- Disabled States: ✅ VERIFIED
```

### 5. Review Phase
- [ ] Self-review: Read every changed line
- [ ] Verify no business logic changed
- [ ] Check bundle size impact
- [ ] Create PR with screenshots
- [ ] Get code review approval

### 6. Deployment Phase
- [ ] Merge to feature/catalyst-migration branch
- [ ] Deploy ONE app to staging
- [ ] 24-hour monitoring period
- [ ] Deploy remaining affected apps
- [ ] Update component status tracker
```

## 🚨 Risk Mitigation

### Critical Risks & Mitigations

1. **Risk**: Breaking authentication flows
   - **Mitigation**: StaffPortalLayout migrated LAST with extensive testing
   - **Mitigation**: Keep auth logic completely separate from UI

2. **Risk**: Form submission failures
   - **Mitigation**: Test every form in every app
   - **Mitigation**: Maintain exact prop names for form components

3. **Risk**: Bundle size explosion
   - **Mitigation**: Monitor size after each component
   - **Mitigation**: Use dynamic imports for heavy components

4. **Risk**: Dark mode breaking
   - **Mitigation**: Test every component in both modes
   - **Mitigation**: Use Catalyst's theme system exclusively

5. **Risk**: Lost custom functionality
   - **Mitigation**: Document ALL custom behaviors first
   - **Mitigation**: Add to Catalyst components if needed

### Non-Negotiable Safety Rules

1. **NEVER** deploy all apps at once
2. **NEVER** skip the testing checklist
3. **NEVER** merge without screenshots
4. **NEVER** change business logic "while you're at it"
5. **ALWAYS** have a rollback plan ready

## 🚫 FORBIDDEN "QUICK FIXES"

### When You Encounter Errors, You MUST NOT:

❌ **Comment out the problematic code**
```typescript
// ❌ FORBIDDEN
// const validation = validateInput(value); // TODO: fix later
```

❌ **Add @ts-ignore**
```typescript
// ❌ FORBIDDEN
// @ts-ignore
<CatalystButton onClick={complexHandler} />
```

❌ **Simplify the implementation**
```typescript
// ❌ FORBIDDEN
// Old: Complex tooltip with positioning logic
// New: Just removed tooltip because "it was complicated"
```

❌ **Change the business logic to fit the component**
```typescript
// ❌ FORBIDDEN
// Old: Form could submit with Enter key
// New: Removed because Catalyst form didn't support it easily
```

### When You Encounter Errors, You MUST:

✅ **Understand the root cause**
```typescript
// ✅ REQUIRED
// Error: Catalyst Button doesn't accept 'loading' prop
// Research: Found Catalyst uses 'disabled' + separate Spinner
// Solution: Create wrapper that maintains our API
```

✅ **Create adapter layers**
```typescript
// ✅ REQUIRED
function Button({ loading, ...props }) {
  if (loading) {
    return (
      <CatalystButton disabled {...props}>
        <Spinner /> Loading...
      </CatalystButton>
    );
  }
  return <CatalystButton {...props} />;
}
```

✅ **Document the solution**
```typescript
// ✅ REQUIRED
/**
 * MIGRATION ADAPTER: Button
 * - Maps our 'loading' prop to Catalyst pattern
 * - Preserves exact same behavior
 * - Tested in: all 82 instances
 */
```

## 📊 Progress Tracking

### GitHub Integration
- All PRs linked to Milestone #1
- Use labels: `catalyst-migration`, `component:[name]`, `app:[name]`
- Daily progress updates in milestone
- Weekly summary reports

### Component Status Tracker
Create `/true-docs/catalyst-migration-status.md`:
```markdown
| Component | Status | Apps Affected | PR | Notes |
|-----------|--------|---------------|-----|-------|
| Progress | 🟡 In Progress | 1 | #123 | |
| Button | ⬜ Not Started | 82 | | High risk |
```

### Success Metrics Dashboard
- Bundle size per app (before/after)
- Build time comparison  
- Type errors fixed
- Accessibility scores
- Performance metrics

## 🎨 Catalyst Integration Guidelines

### What We're Getting From Catalyst
```
/packages/
├── catalyst/          # New Catalyst components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── sidebar-layout.tsx
│   └── ... (50+ components)
└── ui/               # Current components (to be replaced)
```

### Catalyst Components Priority List
**Must Have** (Core functionality):
- All current 23 components' equivalents
- CommandPalette (new capability)
- DataTable with advanced features
- SlideOver panels
- Combobox (autocomplete)

**Nice to Have** (Enhanced UX):
- Skeleton loaders
- Empty states
- Keyboard shortcuts system
- Virtual scrolling
- Advanced animations

## 📅 Timeline & Milestones

### Week 1-2: Foundation
- [ ] Set up Catalyst package structure
- [ ] Create component migration template
- [ ] Migrate first low-risk component (Progress)
- [ ] Establish testing procedures

### Week 3-4: Momentum Building  
- [ ] Complete Phase 1 components
- [ ] Start Phase 2 components
- [ ] First app fully migrated
- [ ] Team velocity established

### Week 5-8: Core Migration
- [ ] Phase 2 & 3 complete
- [ ] 50% of apps migrated
- [ ] Performance benchmarks
- [ ] User preview (internal)

### Week 9-11: High-Risk Components
- [ ] Button, Input, Card migrations
- [ ] All apps migrated
- [ ] Polish and optimization
- [ ] Documentation complete

### Week 12: Launch Preparation
- [ ] Final testing across all apps
- [ ] Performance optimization
- [ ] Rollback procedures verified
- [ ] Go-live checklist complete

## 👥 Team Requirements

### Working with AI Agents

**Why AI for this project:**
- Systematic approach perfect for component-by-component migration
- Never gets tired or takes shortcuts
- Can maintain perfect consistency
- Follows rules exactly as written
- Can work 24/7 if needed

**AI Agent Requirements:**
- Must have file system access
- Must have ability to run commands
- Must be able to read/write files
- Must maintain context across sessions
- Should be instructed to use this PRD

### AI Session Handoff Protocol

**When switching AI sessions/contexts:**
```markdown
## Handoff Document - [Date]

### Current State:
- Component in progress: [name]
- Files modified: [list]
- Last successful build: [time]
- Next step: [specific action]

### Context to reload:
- Read these files: [list]
- Current errors: [if any]
- Decisions made: [summary]

### Do NOT:
- [List any discovered gotchas]
```

## 🤖 AI AGENT IMPLEMENTATION GUIDELINES

### Context Management Requirements

**YOU MUST:**
1. **Read EVERY file before modification** - Use Read tool, never assume content
2. **Track all changes in memory** - Maintain a list of modified files
3. **Verify after EVERY change** - Run build/type-check immediately
4. **Never trust cached knowledge** - Re-read files if context was cleared

### Required Tool Usage Pattern

```markdown
For EACH component migration:

1. Read current component:
   - Read: packages/ui/src/components/[Component].tsx
   - Read: All files from grep results
   - Document current implementation

2. Before ANY modification:
   - Backup: cp Component.tsx ComponentLegacy.tsx
   - Commit backup immediately

3. After EACH change:
   - Run: pnpm build
   - Run: pnpm type-check
   - If errors: STOP and fix, never proceed with errors

4. Document everything:
   - Create: migrations/[Component]-migration-log.md
   - Include: Every decision, every change, every test
```

### AI-Specific Prohibitions

❌ **NEVER use pattern matching from other components**
- Each component is unique
- Read actual implementation every time

❌ **NEVER skip file reading**
- Even if you "remember" the content
- Context can be lost between sessions

❌ **NEVER batch changes**
- One file at a time
- Verify after each file

❌ **NEVER trust error messages alone**
- Read the actual code causing the error
- Understand the full context

### Required Verification Loop

```python
while migrating_component:
    1. Make ONE atomic change
    2. Run: pnpm build
    3. If build fails:
       - Revert the change
       - Read the error context
       - Try different approach
    4. If build succeeds:
       - Run: pnpm type-check
       - Test in one app
       - Document what worked
    5. Commit with detailed message
```

### Context Switching Protocol

**When resuming work (new session):**
1. Read: /true-docs/CATALYST_MIGRATION_STATUS.md
2. Read: Last migration log
3. Re-read: Current component being migrated
4. Verify: Current state with pnpm build
5. Only then: Continue work

### Error Resolution Protocol

**When encountering an error:**
1. **STOP** - Do not try to work around it
2. **READ** - The actual source code, not just error
3. **UNDERSTAND** - Why the error occurs
4. **PLAN** - A proper solution that preserves functionality
5. **IMPLEMENT** - With adapter/wrapper if needed
6. **VERIFY** - All functionality still works

### Documentation Requirements

**For EVERY component, create:**
```markdown
# [Component] Migration Log

## Pre-Migration Analysis
- Used in: [list every file]
- Props: [document all props]
- Features: [list all functionality]
- Edge cases: [document special behaviors]

## Migration Decisions
- Decision 1: [what and why]
- Decision 2: [what and why]
...

## Verification Results
- Build: ✅ All apps build
- Types: ✅ No errors
- Visual: [screenshots]
- Functional: [test results]

## Code Examples
[Before/after code snippets]
```

### Session Management

**At start of EACH session:**
```bash
# Verify clean state
git status
pnpm build
pnpm type-check

# Read current progress
cat /true-docs/CATALYST_MIGRATION_STATUS.md

# Continue from last point
```

**At end of EACH session:**
```bash
# Commit all work
git add -A
git commit -m "chore: migration progress - [details]"

# Update status
# Edit: /true-docs/CATALYST_MIGRATION_STATUS.md

# Verify everything still works
pnpm build
```

### AI Tool Limitations Workarounds

**For screenshots/video:**
- Create detailed text descriptions instead
- Document EXACT visual differences
- Use ASCII diagrams if helpful

**For testing across apps:**
- Systematically test each app
- Document results in markdown tables
- Create test scripts that can be re-run

**For complex debugging:**
- Add extensive console.log statements
- Create temporary debug files
- Remove all debug code before committing

### Monorepo-Specific AI Guidelines

**Understanding Dependencies:**
```bash
# Before modifying any component, map dependencies:
find . -name "*.tsx" -o -name "*.ts" | \
  xargs grep -l "ComponentName" | \
  while read file; do
    echo "=== $file ==="
    grep -A 3 -B 3 "ComponentName" "$file"
  done
```

**Preventing Cascade Failures:**
1. NEVER commit if any app fails to build
2. Test changes in dependency order:
   - packages/ui (shared components)
   - One app using the component
   - All other apps using the component
3. Keep a rollback script ready:
   ```bash
   git reset --hard HEAD~1
   ```

**Working with pnpm Workspaces:**
- Understand that packages/ui changes affect ALL apps
- Run `pnpm -F @ganger/ui build` after component changes
- Then run `pnpm build` to verify all apps

**Memory Management for AI:**
- Document each decision in migration logs
- Create a decisions.md file per component
- Reference previous decisions to maintain consistency

### AI-Specific Success Metrics

**Per Session:**
- Zero build failures at session end
- All changes documented
- Status tracker updated
- No uncommitted changes

**Per Component:**
- Backup created and committed
- All apps using component still work
- Migration log complete
- Zero TypeScript errors

**Overall:**
- No functionality lost
- No business logic changed
- All visual changes documented
- Complete audit trail

## 📚 Reference Documentation

### Must Read
1. `/CLAUDE.md` - Development principles
2. `/true-docs/PROJECT_TRACKER.md` - Platform overview
3. `/true-docs/deployment/` - Deployment guides
4. This PRD

### Catalyst Resources
- [Catalyst Documentation](https://catalyst.tailwindui.com)
- Component source in `/tailwind_templates/catalyst-ui-kit/`
- Example implementations in template apps

### Platform Specific
- Current components: `/packages/ui/src/components/`
- Component showcase: `/apps/component-showcase/`
- Authentication flow: `/packages/auth/`

## ✅ Pre-Migration Checklist

Before starting ANY work:

1. [ ] Read all mandatory documentation
2. [ ] Access to all required repositories
3. [ ] Catalyst UI kit downloaded and studied
4. [ ] Development environment working
5. [ ] Can build and deploy one app successfully
6. [ ] Understand the 17 apps' purposes
7. [ ] Component inventory analysis complete
8. [ ] Branching strategy understood
9. [ ] First component selected (Progress)
10. [ ] Migration checklist template copied

## 🎯 Definition of Done

The Catalyst migration is complete when:

1. **All 23 components** replaced with Catalyst equivalents
2. **All 17 apps** build without errors
3. **Zero TypeScript errors** related to UI components  
4. **All forms** submit successfully
5. **Authentication** works across all apps
6. **Dark mode** works perfectly
7. **Mobile experience** is flawless
8. **Bundle size** increase < 20%
9. **Accessibility score** > 95
10. **No custom CSS** remains (only Tailwind utilities)
11. **Documentation** updated
12. **Team trained** on Catalyst patterns

---

*Remember: This is our ONE chance to deliver exceptional quality before launch. Take the time to do it right.*

## 🔍 CSS Audit Results

### Current CSS Analysis (January 11, 2025)

**Global CSS Files**: All apps use `globals.css` with:
- Tailwind v4 directives (@import 'tailwindcss')
- Custom @theme configurations for text sizing
- Minimal custom CSS (mostly Tailwind utilities)

**Inline Styles Found**:
- Dynamic width calculations for progress bars
- Animation delays for loading states
- Chart/visualization styling (backgroundColor for data)
- Height calculations for dynamic content

**Migration Requirements**:
1. Replace inline `style={{ width: X% }}` with Catalyst Progress components
2. Convert animation delays to Tailwind animation utilities
3. Move dynamic styles to CSS variables or Tailwind arbitrary values
4. Ensure all colors use Tailwind color tokens

**Good News**: Very little custom CSS exists - mostly just Tailwind utilities!

---

*Last Updated: January 11, 2025*