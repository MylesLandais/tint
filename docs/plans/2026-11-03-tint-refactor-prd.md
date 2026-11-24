# tint Refactor PRD

Status: Draft 0.1
Date: 2026-11-03
Owner: K
Companion document: tint-component-docs.md
Scope: tint shared UI layer, svelte-dev build, client contract, design token pipeline, test harness, docs site

---

## 1. Summary

tint is being refactored into one consistent design language and component library with a Svelte 5 build, a framework-neutral core, and a client contract that exists before any new server work. The approach is contract-first and UI-first:

1. Freeze a versioned client contract.
2. Tie the visual system to Penpot designs through a token pipeline.
3. Prove behavior with property and model-based tests.
4. Lock appearance with deterministic visual regression.
5. Only then implement the Rust side of any new surface.

Two surfaces drive the work because they stress the library in different ways:

- Shared watch rooms: synchronized playback, queue, chat, and an overlay layer for avatars. Hard parts are real-time state and layered rendering.
- Automation workspace: game panels, Lua editor and debugger, Frida hooks, terminal, object inspector, framebuffer overlay. Hard parts are density and tool-grade interaction.

## 2. Assumed current state (verify in WS0)

This document was written from project notes, not from a repo audit. Treat the following as assumptions that WS0 must confirm or correct.

- tint exists as an Alpine.js library (also forked as tint-alpine-kino) and a React/TypeScript build, with a three-layer split of core, binding, render.
- A svelte-dev branch is planned to port all React and TypeScript to Svelte.
- Design influences (Meta Astryx, IBM Carbon, Notion branding) are present but not yet consolidated into one language.
- Components have no uniform written spec, so humans and Claude Code sessions produce inconsistent results. The tint skill lacks domain-to-component mapping examples.
- No client contract exists for room, queue, or playback state.

## 3. Goals

G1. A single client contract for room, playback, queue, chat, and presence that a Rust server can implement without UI rework.
G2. One design language, expressed as tokens that originate in Penpot and compile to CSS variables and TypeScript constants, with drift detected in CI.
G3. A Svelte 5 component library with a documented spec for every component, built on a core layer that runs in plain Node.
G4. Behavior locked by property tests and model-based tests; appearance locked by visual regression; both runnable without a server.
G5. A docs site and gallery that stays in step with each build release and toggles between the Svelte and React builds.
G6. A written server gate: explicit exit criteria that must hold before server implementation begins.

## 4. Non-goals

- Implementing the room server, media pipeline, transcoding, or WebRTC transport.
- Choosing the AI avatar technology. tint provides an overlay host and an event contract only.
- Rewriting the React build before cutover. React remains supported during the transitory period.
- Inventing new product features for the watch surface beyond decisions already made (see section 12).

## 5. Principles and constraints

P1. Three-layer split. core holds logic and state machines and runs in plain Node with no DOM dependency. binding adapts core to a framework (Svelte runes). render holds visual components. Imports flow render -> binding -> core only.
P2. Stack division of authority. Rust owns execution and authoritative state, Lua owns dynamic policy, TypeScript owns interaction and visualization. The client contract therefore describes state the server owns; the client never becomes the source of truth for it.
P3. Source time. Media timelines are expressed in source media time, as half-open intervals [start_ms, end_ms). Playback speed never rewrites annotations.
P4. Deterministic core. No direct Date.now(), Math.random(), or timers in core. Clock and RNG are injected so property tests are reproducible.
P5. Dependency minimization. Runtime dependencies in core and binding are avoided; third-party code is vendored and ported where it is needed. See open question OQ-1 for the test and design tooling boundary.
P6. Visual rules. No pill-shaped controls or containers. Shape language is defined by the radius scale in the component docs.
P7. Accessibility is part of done: keyboard operation, focus visibility, reduced motion.

## 6. Users and consuming surfaces

- Gateway workspace shell and agent chat (React today, Svelte target)
- Player workspace: transport, EQ, lyrics, artist pages, layout manager and component registry
- Shared watch channels: playback sync, queue, presence, chat
- Automation workspace: game panels, Lua editor and debugger, Frida hooks, terminal, object inspector, framebuffer overlay
- Wiki site and docs site
- Kino and other prototype apps that adopt tint through the neutral core

Primary human users: K and collaborators building these surfaces. Secondary users: Claude Code sessions consuming the tint skill and component docs. The docs are therefore an interface and must be written to be machine-usable (consistent headings, typed API tables, domain-to-component mapping).

## 7. Workstreams

WS0 Audit. Inventory the current tint components, tokens, and docs across the Alpine, React, and Svelte builds. Output: baseline inventory and gap list that replaces the assumptions in section 2.
WS1 Client contract. Neutral schema, event envelope, versioning, fixtures.
WS2 Design tokens. Penpot export adapter, token tiers, CSS and TS generation, drift check.
WS3 Core logic. Sync drift controller, playback state machine, queue reducer, layout tree, all in core.
WS4 Svelte binding and render. Runes bindings, primitives, composites, domain components.
WS5 Test harness. Unit, property, model-based, component behavior, visual regression, fake room server.
WS6 Docs site and gallery. Per-component pages, state galleries, Svelte/React toggle, generated API tables.
WS7 Migration. React and Svelte coexistence, parity tracking, cutover criteria.

## 8. Requirements

Priority: P0 must ship before the server gate; P1 should; P2 later.

### 8.1 Client contract (WS1)

C1 (P0) A single neutral schema artifact is the source of truth. TypeScript types and runtime validators are generated from it. The Rust server consumes the same artifact. See OQ-2 for how it is authored.
C2 (P0) Every server-to-client and client-to-server message uses one envelope: id, seq, type, schemaVersion, emittedAtServerMs, correlationId (optional), payload.
C3 (P0) Time model: media positions in source ms; clocks expressed as server epoch ms; clients never assert wall-clock truth. Intervals are half-open.
C4 (P0) Contract versioning follows semver. Additive changes are minor; removals or meaning changes are major. Clients declare a supported range; the server rejects out-of-range clients with a typed error.
C5 (P0) Canonical fixtures: one JSON fixture per message type and per significant state (empty room, playing, paused for readiness, buffering, skip pending, queue empty, reconnecting). Fixtures from older contract versions are retained and replayed in compatibility tests.
C6 (P1) Error taxonomy with stable codes (not_authorized, out_of_range, stale_seq, version_unsupported, rate_limited) and a defined client reaction for each.
C7 (P0) Ordering and idempotency rules: seq is monotonic per room; duplicate id is a no-op; a gap in seq triggers a resync request. The client reducer must satisfy these rules under reordering and duplication in tests.
C8 (P0) Reconnect semantics: a full-state snapshot message defines the state after any gap; deltas apply only on top of a known seq.
C9 (P1) Playback readiness: the contract carries per-participant readiness so that "pause for everyone until all are ready" is representable without server-specific behavior.

### 8.2 Design tokens (WS2)

T1 (P0) A Penpot export adapter reads the exported tokens and produces a canonical token file. It validates shape and normalizes known format quirks (see risk R2). It is written in-house.
T2 (P0) Three token tiers: primitive (raw values), semantic (roles such as surface, text, border, accent, status), component (per-component overrides, used sparingly).
T3 (P0) Generated outputs: CSS custom properties and a typed TypeScript constants module. Generated files are committed and marked as generated.
T4 (P0) Drift check in CI: regenerating from the latest Penpot export must produce no diff against committed outputs, or the build fails with a readable diff.
T5 (P0) Layer scale and spacing scale are tokens, not literals in components. A lint rule rejects raw z-index numbers and raw hex colors in render-layer files.
T6 (P1) Density modes (compact, default, comfortable) are expressed as a token set swap, not per-component props.
T7 (P1) The Tinted Glass theme is the baseline theme. Any additional theme (for example light) is P2 and is a token set only.

### 8.3 Core logic (WS3)

K1 (P0) core runs in plain Node with no DOM. An import-boundary test fails if core imports from binding, render, or DOM globals.
K2 (P0) Drift controller (see component docs, helper modules) with hysteresis, bounded rate adjustment, and a hard-seek threshold. All thresholds are named constants shared with the contract documentation.
K3 (P0) Playback state machine: states idle, loading, waiting-for-ready, playing, paused, buffering, ended; transitions are pure functions of (state, event).
K4 (P0) Queue reducer: waitlist rotation, voting, skip rule, removal, reorder. Pure and idempotent on event id.
K5 (P1) Layout tree reducer for the layout manager (split, tabs, resize, replace, remove, save, restore) that is serializable and round-trips exactly.
K6 (P0) Injected clock and RNG everywhere (principle P4).

### 8.4 Binding and render (WS4)

B1 (P0) Svelte 5 runes bindings for each core module, with a thin surface: the binding exposes reactive getters and dispatch functions only.
B2 (P0) Composition uses snippets, not slots. Every composite component documents its snippet props and their argument types.
B3 (P0) Every component has a spec page that follows the template in the component docs and ships a gallery with its full state matrix.
B4 (P0) Accessibility baseline: keyboard operable, visible focus, correct roles, prefers-reduced-motion respected, automated axe-style check in the gallery run.
B5 (P0) Shape rule: no pill shapes. Radius comes from the radius scale only.
B6 (P1) React parity table per component (status: not started, partial, parity, retired). The shared core is the contract between builds.
B7 (P1) Animated icon support following the moving-icon reference, honoring reduced motion.
B8 (P1) Terminal component carried forward from the startpage project, built on core terminal-buffer logic with no DOM in core.

### 8.5 Test harness (WS5)

Q1 (P0) Property tests for core invariants (see section 9).
Q2 (P1) Model-based tests for the queue and playback machines: random command sequences checked against a simple reference model.
Q3 (P0) Component behavior tests run in a real browser, not a simulated DOM, for anything involving layout, focus, resize observers, or pointer behavior.
Q4 (P0) Visual regression on the gallery routes in a pinned, deterministic environment (section 9.4).
Q5 (P0) Contract compatibility tests in both directions: fixtures replayed into the client reducer, and client-emitted messages validated against the schema.
Q6 (P0) A scriptable in-process fake room that implements the contract, used by tests and the gallery. It supports scripted scenarios (late join, reconnect with gap, readiness stall, simultaneous skip votes). It is a test double of the server, not an HTTP interception layer.
Q7 (P1) Mutation or fault-injection pass on the drift controller and queue reducer to confirm the property tests can actually fail.

### 8.6 Docs and gallery (WS6)

D1 (P0) Docs site generated from component spec files; one page per component; state gallery embedded.
D2 (P0) Svelte/React build toggle on every component page, with parity status shown.
D3 (P1) API tables (props, snippets, events) generated from types so they cannot drift from code.
D4 (P1) Domain-to-component mapping pages that feed the tint skill (section 10).
D5 (P0) Docs are versioned with the build release; a release is not tagged if the docs build fails.

### 8.7 Migration (WS7)

M1 (P0) React and Svelte builds coexist for the transitory period. Expected length 3 to 6 months; the exit is criteria-based, not date-based.
M2 (P0) Cutover criteria per surface: all components that surface uses are at parity, visual baselines are green for both builds or the React baselines are explicitly retired, and the surface runs on Svelte for one release without regression.

## 9. Test and regression strategy

### 9.1 Layers

1. Schema and fixture tests: every fixture validates; every generated sample validates; old-version fixtures still decode.
2. Property tests (core): invariants over generated inputs.
3. Model-based tests: command sequences versus a reference model.
4. Component behavior tests: real browser, user-level interactions.
5. Visual regression: screenshots of gallery routes.
6. Token drift test: regenerated tokens equal committed tokens.
7. Import-boundary tests: layer rules enforced by test, not by convention.

### 9.2 Invariants to cover first

Queue:
- An item id appears at most once across active and waitlist.
- The active item is never also in the waitlist.
- A user is in at most one of woot or meh for an item.
- Skip fires if and only if meh votes from users present at evaluation time meet or exceed the threshold fraction of present users. Users who left are excluded from both numerator and denominator.
- Votes from distinct users commute: applying them in any order yields the same state.
- Applying the same event id twice equals applying it once.
- A removed item never reappears without an explicit add.
- With no removals, DJs with queued items play in stable cyclic order.

Drift controller:
- Output rate is always within [1 - maxRateDelta, 1 + maxRateDelta].
- A seek is emitted if and only if absolute drift is at or above the hard-seek threshold.
- If the client is ahead (positive drift), the rate is below 1; if behind, above 1.
- Hysteresis: for a non-increasing sequence of absolute drift that stays below the hard-seek threshold (a seek resets the mode), the controller leaves the correcting mode at most once and never re-enters it.
- Zero drift yields lock.

Playback machine:
- No transition is defined out of ended except load.
- waiting-for-ready exits to playing only when every present participant is ready or has been removed.
- Position is monotonic non-decreasing while playing at positive rate, absent a seek event.

Time model:
- Annotation intervals are half-open and never overlap-adjacent in a way that makes a point belong to two intervals.
- Mapping source time to presentation time and back is the identity within tolerance for rates in the supported range.

### 9.3 Component behavior tests

Test what a user does: type, click, drag, press keys, resize. Assert on accessible roles and names rather than class names. Drag-and-drop (queue reorder) and resizing must run in a real browser.

### 9.4 Visual regression determinism

Visual tests are only useful if they are boring. Required environment:

- Pinned browser build in a container; baselines generated only inside that container.
- Bundled fonts only; no system font fallback.
- Animations and transitions disabled; prefers-reduced-motion forced in a dedicated pass to verify the reduced variant.
- Fixed viewport set (small, medium, large) per component where layout differs.
- Injected clock and seeded RNG; media replaced by a static frame fixture.
- Matrix: theme x density x state, with the matrix defined per component in its spec.
- Tolerance: default near-zero ratio; any per-component increase is documented in the spec with a reason.
- Baselines are committed to the repo; an intentional change is a reviewed baseline update in the same change as the code.
- A Penpot comparison is a review aid, not an automated gate: designers export reference frames, the reviewer compares side by side, and tokens (not pixels) are the automated link to Penpot.

## 10. Documentation requirements

Each component page must be usable by a person or a Claude Code session without reading source. Required sections are defined in the component docs template. In addition:

- Every component lists the domain situations it is meant for (for example, "game panel list -> GamePanelTabs with grid view"). These lines are aggregated into the domain-to-component mapping that the tint skill is rebuilt around.
- Every component lists anti-uses (what not to use it for), to stop wrong-component selection.
- The instruction guide, style guide, and component breakdown prioritize the automation engineering workspace (Lua domain, agentic tooling, rendering the game client).

## 11. Review of the imported blueprint

The pasted blueprint is a useful starting point. This section records what this PRD adopts, changes, and defers, so the differences are deliberate.

Adopted:
- Contract-first, UI-first sequencing; Penpot tokens as a build artifact; Svelte 5 runes helpers; property testing; visual regression; the layered stage idea (video, overlay canvas, HUD).

Changed:
1. Contract authoring. The blueprint defines the contract in TypeBox or Zod inside the UI repo. That makes TypeScript the source of truth, which conflicts with principle P2. The contract should be a neutral schema that the Rust server also consumes (OQ-2).
2. Sync thresholds. The blueprint uses 250 ms and 1 s in one place and 100 ms and 1.5 s in another, with a hard switch between 0.95 and 1.05 at plus or minus 100 ms. A hard switch at a single threshold oscillates around that threshold. This PRD specifies hysteresis, a proportional bounded rate, and one set of named constants.
3. Property test examples. In the blueprint, the first test never uses the woot count, and the second tests Array.filter rather than the queue. Section 9.2 replaces them with invariants over the real reducer.
4. Playwright component testing for Svelte. The experimental Playwright component-testing package for Svelte had a reported Svelte 5 incompatibility (it relied on a Svelte internal module that Svelte 5 removed), and the blueprint's slot-based mounting does not match Svelte 5 snippets. This PRD uses real-browser component tests (Vitest browser mode with Playwright) and screenshot tests against gallery routes. Re-verify current Playwright component testing status before choosing otherwise.
5. Penpot token format. Penpot advertises design token support based on the W3C Design Tokens Community Group format, but a community report states the actual export follows the Tokens Studio multi-set shape, with numbers stored as strings and some value types differing from the DTCG spec. The adapter (T1) must validate and normalize rather than assume either format.
6. MSW and similar mocking. A scriptable fake room (Q6) replaces request interception because the contract is stateful and real-time.

Deferred or out of scope for tint:
- LiveKit or any WebRTC SFU, forking the Jellyfin transcoder, Yjs or Automerge for queue state, yt-dlp, Tauri, and the AI avatar pipeline (vision, ASR, TTS, visemes). Several of these also conflict with existing decisions: a pure Rust YouTube path rather than heavy yt-dlp dependency, in-process broker, rooms as channels, and the dependency-minimization principle. The contract stays transport-agnostic so these can be decided later.
- The Plug.dj style DJ queue (waitlist rotation, woot and meh voting) and the 3D theater are not in the recorded decisions for shared watch channels. They are kept here as candidate surfaces that exercise the library (OQ-3), not as committed product scope.

## 12. Existing decisions this PRD must respect

- Rooms are channels: a watch session lives on an existing workspace channel.
- Playback pauses for everyone until all participants are ready.
- Magic links grant guest access without sign-on.
- First pass supports 1080p and 4K streams.
- TintPlayer is ported from React to Svelte.
- No pill-style interface designs in artifacts or mockups.
- core stays decoupled from Elixir/Phoenix and runs in plain Node.
- The docs site includes a Svelte/React toggle and tracks each build release.

## 13. Milestones and exit criteria

Milestones are sequenced, not dated. Each has a checkable exit.

M0 Audit and baseline (WS0). Exit: inventory published; assumptions in section 2 replaced by facts; parity table seeded.
M1 Contract v0 and tokens v0 (WS1, WS2). Exit: schema, envelope, fixtures for all core states; Penpot adapter produces committed CSS and TS; drift check green.
M2 Core logic with property tests (WS3, WS5). Exit: drift controller, playback machine, queue reducer pass all section 9.2 invariants; import-boundary test green; fault-injection pass shows tests can fail.
M3 Primitives and gallery (WS4, WS6). Exit: primitives specced and in the gallery with full state matrix; visual baselines committed; accessibility checks green.
M4 Room composites (WS4). Exit: TheaterStage, QueueRail, SyncStatus, Chat, Presence run against the fake room through all scripted scenarios; visual baselines committed.
M5 Automation workspace set (WS4). Exit: game panel tabs with grid view, terminal, object inspector, Lua editor and debugger panel, Frida hooks panel, notifications, chat, framebuffer overlay specced, built, and baselined.
M6 Docs site and migration gates (WS6, WS7). Exit: docs generated from specs with the build toggle; cutover criteria evaluated per surface.

### Server gate

Server implementation of a surface begins only when all hold:
1. Contract at v1.0 for that surface, with fixtures for every state in C5.
2. All section 9.2 invariants for that surface pass in CI.
3. Fake room scenarios (Q6) pass end to end on the Svelte build.
4. Visual baselines committed for every component the surface uses, for the full state matrix.
5. Token drift check green against the latest Penpot export.
6. Open questions OQ-1 through OQ-4 are resolved and recorded.

## 14. Success metrics

- Server gate passed with zero contract changes required during first server implementation of a surface (target; measure actual breaking changes after gate).
- Share of components with complete spec, gallery, and baselines: 100 percent of components used by in-scope surfaces.
- Visual regression flake rate (failures not caused by a code change) below 1 percent of runs.
- Time for a Claude Code session to produce a correct panel from a domain description, measured before and after the skill rebuild on a fixed set of prompts.

## 15. Risks

R1. Spec drift: docs diverge from code. Mitigation: generated API tables (D3), docs build gating releases (D5).
R2. Penpot export format differs from documentation or changes between versions. Mitigation: validating adapter (T1), pinned Penpot version recorded in the repo, drift check (T4).
R3. Visual test flakiness erodes trust. Mitigation: section 9.4 determinism rules; flake rate metric.
R4. Dual-build maintenance load during the transitory period. Mitigation: shared core, parity table, criteria-based cutover, no new features in React except as required by shipped surfaces.
R5. Contract churn after the gate. Mitigation: fixtures for every state, compatibility tests, semver discipline.
R6. Scope creep from the imported blueprint (3D theater, AI avatar). Mitigation: section 11 deferral list and OQ-3.
R7. Over-fitting the contract to one transport. Mitigation: transport-agnostic envelope; no WebRTC or HLS specifics in the contract.

## 16. Open questions

OQ-1. Dependency policy for tooling. The principle is to avoid external dependencies, but this plan assumes tools such as a unit and browser test runner, a property-testing library, a browser automation tool, and Penpot. Proposed default: runtime dependencies in core and binding are forbidden unless vendored; test, build, and design tooling are allowed behind thin adapters so they can be replaced. Needs a decision.
OQ-2. Contract authoring. Options: (a) hand-maintained JSON Schema as the neutral artifact, with TS and Rust generated from it; (b) Rust types as the source, emitting JSON Schema; (c) a small in-house schema DSL. Option (b) matches principle P2 best but ties contract changes to Rust work; option (a) keeps the UI-first flow. Needs a decision.
OQ-3. Is the Plug.dj style DJ queue, voting, and 3D theater part of the tint R&D scope, or only a stress-test surface? This changes M4 contents.
OQ-4. Penpot hosting and versioning: self-hosted instance, which version, and where exported token files are stored.
OQ-5. Baseline storage: in-repo images versus an artifact store, given repo size over time.
OQ-6. React visual baselines: keep through the transitory period, or freeze and retire early?
OQ-7. Are additional themes beyond Tinted Glass in scope this cycle?
OQ-8. Readiness semantics: how long does the room wait for a stalled participant before offering to proceed without them? The contract needs a rule even if the server implements it later.
OQ-9. Shape exception: the component docs propose a radius.round token used only by Avatar and StatusDot, so the no-pill rule (P6) does not forbid circular avatars. Confirm or remove the exception.

## 17. Appendix: references

- Penpot file format and tokens: help.penpot.app (technical guide and user guide), penpot.app blog on design tokens, Penpot community thread on export format.
- Meta Astryx (components, including Tokenizer), IBM Carbon (including Svelte Carbon and FluidForm), Notion branding: design references.
- Svelte UX Shine card and jis3r/icons: component references.
