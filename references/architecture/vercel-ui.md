# Research brief: Vercel UI SDK

> **Status: not yet studied.** No source revision has been recorded. This brief
> lists the questions for M2. It does not adopt anything or imply a dependency.

- **Source:** <https://github.com/vercel-labs/ui>
- **Why:** it is a behaviour-first component architecture with agent-facing developer tooling.

## Questions

1. How are interaction behaviours separated from rendering? What is the unit of
   reuse: a hook, a state machine or a headless component?
2. Which accessibility semantics come for free, and how do they map to APG patterns?
3. How do agents discover and compose components? Is there a registry, typed
   capabilities or a CLI?
4. Can the behaviour layer run in Svelte 5? If so, which adapter, and what does
   it cost for SSR and runes?
5. How does it compare with Tint's `src/core` modules ([behaviors.md](../../docs/architecture/behaviors.md))?

## Deliverable

Record the commit studied, the patterns verified in source (with file links),
Svelte compatibility, and an **adopt**, **wrap**, **reimplement** or **reject**
recommendation for each behaviour, with the reason.
