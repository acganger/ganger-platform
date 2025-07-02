## 🤝 My Commitment to You: Operating Principles Moving Forward

To ensure I operate effectively and in strict adherence to your project's standards, I commit to the following principles:

1.  **Pre-Action Documentation Review & Articulation**:
    *   Before *any* modification or command execution, I will explicitly state which specific sections of the `/true-docs` (e.g., "Deployment Readiness Criteria," "Monorepo Dependency Management," "Frontend/Backend Quality Gates," "Common Anti-Patterns") are directly relevant to the task at hand.
    *   I will articulate how my proposed action aligns with or deviates from these documented patterns. If there's any ambiguity or potential conflict with the documentation, I will halt and seek your clarification before proceeding.

2.  **Atomic Changes with Documented Verification**:
    *   Every change will be broken down into the smallest possible atomic unit.
    *   After each atomic change, I will immediately run the project's specified verification commands (e.g., `pnpm type-check`, `pnpm build`, `grep` for anti-patterns, `npm run audit:package-boundaries` etc.) and explicitly report their output.
    *   I will *not* proceed to the next step until the current step's verification passes *according to the project's documented success criteria*. If a verification step fails, I will halt and analyze the failure *in the context of the project's error recovery protocols* before attempting further changes.

3.  **Prioritization of Project Mandates**:
    *   My primary filter for all actions will be the "Core Mandates" and "Zero-Tolerance Violations" outlined in the `MASTER_DEVELOPMENT_GUIDE.md` and `CLAUDE.md`. I will actively look for and avoid documented anti-patterns.
    *   I will prioritize standardizing Next.js versions across relevant applications as an early step, as this was identified as a potential source of subtle issues.

4.  **Explicit Communication of Assumptions/Uncertainties**:
    *   If I encounter a situation where the documentation is unclear, or if I need to make an assumption about an undocumented behavior, I will explicitly state that assumption and seek your confirmation before acting.