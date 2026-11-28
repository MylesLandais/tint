# Frontend quality rubric

Score each dimension from 1 to 5 and weight it. The weighted score is out of
100: the sum of (score ÷ 5 × weight). These weights are starting decisions and
will be revised as eval data accumulates.

| Dimension | Weight | What a 5 looks like |
|---|---|---|
| Visual consistency | 20 | Tokens only. It matches the adjacent surfaces and has no anti-patterns ([../docs/anti-patterns.md](../docs/anti-patterns.md)) |
| Accessibility | 20 | Keyboard-complete, named, visible focus, contrast verified, live regions where needed |
| Information architecture | 15 | One clear primary task, actions ranked by relevance, progressive disclosure |
| Functional correctness | 15 | The primary workflow works against real or contract-conformant data |
| Interaction quality | 10 | All relevant states ([../docs/patterns.md](../docs/patterns.md#interaction-states)); context preserved |
| Component reuse | 10 | Existing Tint components used; no duplicated primitives |
| Responsive behaviour | 5 | A deliberate narrow-width layout, not a shrunken desktop |
| Performance | 5 | No layout shift, virtualized large collections, no duplicated requests |

**Verdict bands:**
- 85 or more: pass
- 70 to 84: revise
- below 70: revise with priority

## Critical failures

Any one of these makes the verdict **blocked**, whatever the score. Good
typography never compensates for these.

- The primary workflow is broken.
- An essential action cannot be reached by keyboard.
- A critical accessibility violation (axe `critical`, or a verified keyboard trap).
- Fabricated operational state or functionality (fake progress, simulated agent activity, mock data shown as live).
- An unapproved parallel design system (new palettes, a local primitive library).
