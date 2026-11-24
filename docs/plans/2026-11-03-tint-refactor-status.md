# Tint refactor PRD: status

Reviewed 2026-11-24 against Tint `dev` (last commit 2026-10-27) and Nebula `dev`.
The PRD and component docs beside this file are the unedited 2026-11-03 drafts (0.1).
They were written from notes, not from a repository audit.

| PRD goal | State |
|---|---|
| G1 client contract for room, playback, queue, presence | Landed in Nebula, not Tint: `lib/protocol/src/watch_session.rs` with exported contracts and golden vectors (`contracts/watch/golden.json`). The server owns this state, as P2 requires. |
| G2 Penpot token pipeline with drift check | Unmerged: `feat/penpot-design-system` (3 commits, 2026-11-01) adds DTCG tokens, `scripts/export-tokens.mjs` and `npm run design:check`. CI does not run the check yet. |
| G3 Svelte 5 library on a Node-only core | Largely present: `src/core`, `src/svelte`. Per-component specs are not written. |
| G4 property, model-based and visual regression tests | Not started. No fast-check, no model tests, no screenshot tests. |
| G5 docs site toggling Svelte and React | Docs site exists (`src/docs`). No build toggle yet. |
| G6 server gate | Not written. |
| P3 source time as half-open `[start_ms, end_ms)` | Not adopted in Tint. Nebula's watch session uses `position_ms` relative to `at_server_ms`. |
| P6 no pill shapes | Not enforced. `dev` still has about 19 full-radius uses under `src/`. The component docs' radius scale is not implemented. |

Next decisions: land or rework `feat/penpot-design-system` and add `design:check` to CI;
decide whether the no-pill radius scale is still wanted; start G4 with property tests on
`src/core` state machines.
