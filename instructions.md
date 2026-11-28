# Frontend instructions for agents

How agents (and people in a hurry) implement, change or fix interfaces built on
Tint. This page does not restate the design system. It tells you where the rules
are and how to apply them.

Your role: product designer, frontend architect, accessibility engineer and
TypeScript/Svelte engineer, all at once. You are building production application
interfaces, not demos, landing pages or generic dashboards.

## 1. Read first

| Read | For |
|---|---|
| [docs/vocabulary.md](docs/vocabulary.md) | Entity names and their status (active, proposed, conflict) |
| [docs/philosophy.md](docs/philosophy.md) | What we value |
| [docs/style-guide.md](docs/style-guide.md) | Tokens, type, spacing, surfaces, the four axes, open decisions |
| [docs/anti-patterns.md](docs/anti-patterns.md) | Defaults you must not produce |
| [docs/patterns.md](docs/patterns.md) | Shell anatomy, states, operational honesty, human vs agent content |
| [docs/accessibility.md](docs/accessibility.md) | WCAG 2.2 AA baseline, and what automation does not prove |
| [docs/brand/voice.md](docs/brand/voice.md) | Copy |
| [components.md](components.md) | What already exists. Check it before you build anything |
| [docs/architecture/overview.md](docs/architecture/overview.md) | Layers, host ownership, Svelte conventions |

## 2. Inspect before implementing

- Read the existing shell, routes, components and the adjacent surfaces. Reuse
  their patterns.
- Identify the user's primary task and the information it needs.
- List the states that apply: loading, empty, error, offline, permission,
  pending, stale and background.
- Decide keyboard, focus and narrow-width behaviour before writing markup.
- Pick a composition mode (operational, editorial or immersive). Density, theme
  and input are separate axes.
- Do not introduce a parallel design system. Do not restyle working components
  to suit your own taste.

## 3. Terminology

- Use the preferred terms from the vocabulary. Never invent a new name for an
  existing entity (no `ChatSession` when you mean a Thread).
- A proposed term is not an existing type. Do not build against it as if it were.
- A presentation is not an entity. A tree of channels is still channels.
- Imported records keep their source term as provenance.
- If the vocabulary does not cover your case, say so in your report and propose
  a term. Do not quietly coin one.

## 4. Implementation

- **TypeScript strict mode, Svelte 5 runes.** Use `$props()`, snippets and
  callbacks. Prefer derived state to duplicated state. Use `$effect` only to sync
  with external systems.
- **Imports.** Import public Tint subpaths only (`@nebula/tint/button`), never
  `src/...`.
- **Logic placement.**
  - Framework-neutral logic goes in `src/core`.
  - Presentation goes in `src/svelte`.
  - API orchestration belongs to the host, never inside a generic primitive.
- **Styling.**
  - Use `--tint-*` semantic tokens only.
  - No raw colours, no literal `var()` fallbacks, no literal z-index.
  - New values go into the token contract first.
- **Markup.** Native semantic HTML. ARIA only to supplement it.
- **Component reuse.**
  - Extend an existing component when the need is general.
  - Keep domain-specific behaviour in domain components.
  - A new component follows [CONTRIBUTING.md](CONTRIBUTING.md).
- **Dependencies and warnings.**
  - Add no new framework, component library or dependency without approval.
  - Never suppress Svelte a11y warnings without a stated reason and a test.
- **Real state only.** Use typed contracts and honest states. No hardcoded mock
  data presented as real, and no simulated progress or agent activity.

## 5. Verification

Before you call a task done:

1. Run `npm run check` in Tint: names, migration, `tsc`, `svelte-check`, lint
   and tests. In a consumer, run its own checks.
2. Look at the rendered interface in a browser, in light and dark themes, at
   narrow and wide widths.
3. Operate the change by keyboard only: focus order, visible focus, Escape,
   focus restoration.
4. Run automated accessibility checks (axe in Playwright, where the consumer
   has them).
5. Exercise loading, empty, error, offline and permission states, long labels and
   large collections.
6. Compare the result with the adjacent surfaces.

Do not claim visual or accessibility verification you did not do. A passing
build is not a working interface.

## 6. Report

End with:
- the components you changed or added
- your design decisions and any deviations, each with its functional reason
- vocabulary changes you are proposing
- verification evidence: commands and their outcomes, screenshots
- what you did not verify
- remaining accessibility issues

## 7. Independent review

The implementer does not judge its own work. Use a separate review session
following [eval/reviewer.md](eval/reviewer.md), scored with
[eval/rubric.md](eval/rubric.md). Limit the remediation loop to two rounds, then
escalate unresolved disagreements to a human.
