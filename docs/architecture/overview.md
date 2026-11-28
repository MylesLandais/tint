# Architecture overview

How Tint is built, and where each concern lives. This describes Tint as it is at
`4664af3`. Proposals are marked as proposals.

## Layers

| Layer | Path | Rule | Enforced by |
|---|---|---|---|
| Core | `src/core/` | Framework-neutral TypeScript: contracts, state machines, reducers, parsers, selection, validation, transport contracts. No `svelte` or `react` imports, and no DOM globals at module scope | `src/core/architecture.test.ts`, [src/core/README.md](../../src/core/README.md) |
| Client | `src/client/` | `TintClient` and its capability adapters: request, operations, playback, realtime, uploads, storage | `src/consumer-contract.test.ts` |
| Svelte | `src/svelte/` | The only presentation layer. Public components and runes bindings (`*.svelte.ts`) | `npm run check:svelte`, `npm run check:migration` |
| Styles | `src/styles/` | The token contract, layout scale, themes and the Carbon bridge | `src/styles/themes.test.ts` |
| Docs | `src/docs/` | The live docs site and route registry | `src/docs/svelte/routing.test.ts`, `src/exports.test.ts` |

Imports flow **svelte → client → core**, never the other way. Carbon Components
Svelte is a private implementation detail, allowed only in
`src/svelte/internal/carbon/` ([design/tokens.md](../design/tokens.md)).

The 2026-11-03 refactor PRD names these layers core, binding and render
([plans/2026-11-03-tint-refactor-prd.md](../plans/2026-11-03-tint-refactor-prd.md)).
In this repository, "binding" is the runes modules under `src/svelte`, and
"render" is the `.svelte` components.

## Host ownership

Tint components are **controlled**. The host owns:
- domain state
- selection and query state
- persistence
- transport

Tint presents host-owned documents (`FeedDocument`, `ActivityDocument`, graph
documents, datasets) and reports intent through callbacks. Nothing in Tint
decides authorization, persists domain data, or talks to a specific server
except through an adapter the host provides. Contracts between the UI and the
Gateway are covered in [gateway-contracts.md](gateway-contracts.md).

## Composition conventions (Svelte 5)

- Props come from `$props()`. `$bindable()` is explicit and rare.
- Components take callbacks (`onselect`, `onreorder`), not dispatched DOM events.
- Compose with snippets (`{#snippet}` and `{@render}`), not slots.
- Derive state instead of duplicating it. Use `$effect` only to sync with an
  external system.
- A component that mounts a canvas or engine passes the host element to a
  snippet only after mount.
- Components that layer content use `isolation: isolate`.

## Behaviours

Interaction behaviour lives in `src/core` modules (for example `core/table`
editor and history, and `core/feed` presentation), so it can be tested without a
DOM. A behaviour-first inventory and comparison is planned
([behaviors.md](behaviors.md)).

## Extensibility

Agents and Lua extensions compose registered Tint components through typed
contracts. They never style or script the DOM directly. The planned boundaries
are in [extensibility.md](extensibility.md).

## References

These architecture references are separate from the visual influences in the
[style guide](../style-guide.md#influences). Each has a research brief. None of
them is adopted, and none adds a dependency.

| Reference | What we study | Brief |
|---|---|---|
| Vercel UI SDK | Framework-independent behaviours, composition, accessibility semantics, agent-facing tooling | [vercel-ui.md](../../references/architecture/vercel-ui.md) |
| Vercel AI SDK and AI Elements | Streaming message parts, typed tool contracts, incremental rendering, transport abstraction, AI-native compositions | [vercel-ai.md](../../references/architecture/vercel-ai.md) |
| Roblox scripting | Client/server split, script lifecycle, replicated state, remote calls, capability-scoped extensions | [roblox.md](../../references/architecture/roblox.md) |

## Specification crosswalk

The 2026-11-03 drafts are kept unchanged as history
([plans/](../plans/2026-11-03-tint-refactor-status.md)). The table shows where
each of their topics is now authoritative.

| Draft section | Authoritative now |
|---|---|
| Component docs §1, design language | [style-guide.md](../style-guide.md) |
| §2, layers | This page |
| §2.3, Svelte conventions | This page, and [instructions.md](../../instructions.md) |
| §3, tokens | [style-guide.md](../style-guide.md), [design/tokens.md](../design/tokens.md) and the token contract |
| §4, component spec template | [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| §5, inventory | [components.md](../../components.md) (generated) |
| §12, definition of done | [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| The PRD as a whole | Stays the migration specification. Progress is tracked in the refactor status note |
