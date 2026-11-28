# Frontend evaluation

How we compare one implementation task across agents, models, prompts and
design-system revisions.

| File | Purpose |
|---|---|
| [rubric.md](rubric.md) | Weighted dimensions and the critical failures that override the score |
| [reviewer.md](reviewer.md) | The independent reviewer prompt and its output contract |
| [scenarios/README.md](scenarios/README.md) | FE-001 to FE-018 scenario index |

Each scenario uses the same fixtures, task text, viewports and acceptance
criteria for every agent. For preference testing, anonymize model and agent
identity and run blind pairwise comparisons.

## Quality gates

| Gate | What | Status |
|---|---|---|
| G0 | TypeScript, `svelte-check`, existing contract tests | Required |
| G1 | No new token violations in consumers (incremental; existing debt recorded) | Required in consumers |
| G2 | `components.md` and the docs routes stay in sync with the public exports; documentation links resolve inside the repository | Required (`src/componentIndex.test.ts`, `src/exports.test.ts`, `src/docLinks.test.ts`) |
| G3 | A fixture-backed browser scenario with axe, reporting all findings and blocking on serious or critical | Pilot (in consumers) |
| G4 | Contract conformance across live, mock and replay transports | Future (M3) |
| G5 | Sandbox conformance: capability isolation and execution limits | Future (M6) |
| G6 | Independent design review, then human preference testing | Future |

Automated accessibility checks do not replace manual keyboard and
screen-reader testing. Screenshot regression detects change, not improvement.
