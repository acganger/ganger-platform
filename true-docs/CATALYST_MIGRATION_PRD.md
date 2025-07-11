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

### UI Expert Requirements
- **Catalyst Experience**: Must have shipped production Catalyst apps
- **Medical Software**: Bonus, not required
- **Testing Mindset**: Obsessive about quality
- **Communication**: Daily updates, no surprises

### Code Review Requirements
- Every PR needs screenshots/recordings
- Before/after comparisons
- Bundle size impact
- Accessibility audit results
- Mobile responsiveness proof

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