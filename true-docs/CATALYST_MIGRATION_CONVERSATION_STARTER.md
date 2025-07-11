# Conversation Starter for Catalyst Migration

## Initial Message to AI Agent

I need you to migrate our component library from custom React components to Tailwind's Catalyst UI kit. This is a critical project for our medical platform with 17 applications.

**IMPORTANT CONTEXT**: We've had severe issues with previous developers taking shortcuts, making assumptions, and creating cascading failures in our monorepo. We lost 2+ weeks to deployment issues from rushed fixes. I need you to be extremely methodical and follow our procedures exactly.

Your primary resource is: `/true-docs/CATALYST_MIGRATION_PRD.md`

This PRD contains:
- Strict prohibitions (things that will cause immediate failure)
- Required verification steps after every change
- A complete component migration checklist
- AI-specific guidelines for managing context

**Key Points**:
1. We have 23 custom components to migrate
2. Start with Progress component (only used once, lowest risk)
3. Each component must be backed up before changes
4. All 17 apps must build successfully after each change
5. No functionality can be lost or changed

**Your first tasks**:
1. Read the entire PRD
2. Run `pnpm build` to verify current state
3. Read `/true-docs/CATALYST_MIGRATION_STATUS.md` 
4. Analyze the Progress component usage
5. Create your migration plan for Progress

I value accuracy over speed. Take your time, read every file, test everything. Ask questions if anything is unclear.

Are you ready to begin?