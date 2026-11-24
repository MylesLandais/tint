# tint Design and Component Documentation

Status: Draft 0.1
Date: 2026-11-03
Companion document: tint-refactor-prd.md
Build: Svelte 5 (svelte-dev), with React parity tracked during the transitory period

How to read this document: sections 1 to 4 define the rules (language, architecture, tokens, spec template). Sections 5 to 8 apply them (inventory, worked specs, automation workspace requirements, helper modules). Sections 9 to 12 cover testing conventions, the docs site, the domain-to-component mapping, and the definition of done. Component names and token values here are proposals. WS0 (audit) reconciles names with the existing builds, and Penpot becomes authoritative for token values once the adapter lands (PRD requirement T1).

---

## 1. Design language

### 1.1 Sources and what each contributes

- IBM Carbon: structure. Grid, spacing rhythm, form patterns (FluidForm as a reference), density modes, accessibility discipline, Svelte component conventions.
- Meta Astryx: tool-grade density and developer-facing patterns, including the Tokenizer for entering and showing structured filters.
- Notion branding: warmth and typographic calm. Restraint in color, generous but not wasteful whitespace, content-first chrome.
- Tinted Glass: the baseline theme. Layered translucent surfaces over a dark base, with tinting that signals hierarchy rather than decoration.
- Reference for moving icons: jis3r/icons. Reference for emphasis cards: Svelte UX Shine.

### 1.2 Rules

1. No pill shapes. Controls and containers use the radius scale (section 3.4). Proposed narrow exception, to be confirmed: avatars and status dots may be circular via a dedicated radius.round token that only those two components may use.
2. Density first. The automation workspace is dense by default; the room surface is comfortable by default. Density is a token set (section 3.6), not a per-component prop.
3. Hierarchy comes from surface level and text weight, not from boxes inside boxes. Prefer one border or one surface step per nesting level.
4. Color carries meaning, not decoration. Accent marks the primary action and focus. Status colors (success, warning, danger, info) mark state only and always pair with text or an icon, never color alone.
5. Motion explains change. Durations come from tokens; every animation has a reduced-motion variant that is either instant or opacity-only. Animated icons follow the same rule.
6. Every interactive element has a visible focus state using the focus border token, at all densities.
7. Monospace is reserved for code, terminal output, identifiers, and numeric readouts that must align.

## 2. Architecture

### 2.1 Layers

```
core/        Pure TypeScript. No DOM, no framework, no direct Date.now/Math.random/timers.
             State machines, reducers, schedulers, geometry, terminal buffer, contract validators.
binding/     Framework adapters. For Svelte: runes modules (*.svelte.ts) wrapping core.
             Exposes reactive getters and dispatch functions only.
render/      Visual components (*.svelte). Consume tokens and bindings. No business logic.
```

Import direction: render -> binding -> core. Never the reverse. An import-boundary test enforces this (PRD K1).

### 2.2 Proposed repository layout

This is a proposal; reconcile with the real layout in WS0.

```
core/
  contract/            generated types and validators; fixtures/ (canonical JSON)
  sync/                drift.ts, clock-offset.ts
  playback/            machine.ts
  queue/               reducer.ts
  layout/              tree.ts
  terminal/            buffer.ts
  geometry/            framebuffer <-> screen transforms, hit testing
tokens/
  penpot/              exported token files, pinned Penpot version noted in README
  adapter/             validate + normalize + emit
  generated/           tokens.css, tokens.ts (committed, marked generated)
binding-svelte/        runes modules
render-svelte/
  primitives/  composites/  domain/
render-react/          existing build during the transitory period
gallery/               SvelteKit routes: /gallery/<component>/<state>
specs/                 <component>.spec.md, one per component
tests/                 mirrors core/ and render/ by name
```

### 2.3 Composition conventions (Svelte 5)

- Composition uses snippets (`{#snippet}` and `{@render}`), not slots.
- Props are declared with `$props()`; two-way props are explicit with `$bindable()` and are rare.
- Components accept callbacks (`onselect`, `onreorder`), not dispatched DOM events.
- A component that mounts an external canvas or engine passes the host element and its size to a snippet only after mount; it never passes a possibly-null element.
- Local stacking: components that layer content use `isolation: isolate` so their internal layers do not compete with global layers.

## 3. Tokens

### 3.1 Pipeline

```
Penpot (tokens panel)
  -> export (pinned Penpot version)
  -> tokens/adapter: validate shape, normalize known quirks, emit canonical file
  -> tokens/generated/tokens.css and tokens.ts (committed)
  -> CI drift check: regenerate and diff; any diff fails the build
```

Adapter behavior (PRD T1): accepts the Penpot export; does not assume the strict W3C Design Tokens Community Group shape, because reports indicate the export follows the Tokens Studio multi-set shape (numbers stored as strings, differing value types). The adapter converts numeric strings to numbers, resolves aliases, rejects unknown types with a clear error, and records the source Penpot version in the generated file header. It is written in-house (PRD P5).

### 3.2 Tiers

- Primitive: raw values (`color.gray.900`, `space.4`). Not used by components directly.
- Semantic: roles (`surface.raised`, `text.secondary`). Components use these.
- Component: overrides for one component (`tabs.indicator.height`). Used sparingly and listed in that component's spec.

### 3.3 Semantic color vocabulary

Names only. Values come from Penpot.

- surface: base, raised, overlay, inset, glass
- text: primary, secondary, disabled, inverse, link
- border: subtle, strong, focus
- accent: primary, primary-hover, primary-active, on-primary
- status: success, warning, danger, info; each with fg and bg
- selection, scrim, highlight (search match), diff-add, diff-remove (inspector and editor)

### 3.4 Scales

Spacing (4 px base), proposed: space.1 4, space.2 8, space.3 12, space.4 16, space.5 24, space.6 32, space.7 48, space.8 64.

Radius, proposed: radius.none 0, radius.sm 2, radius.md 4, radius.lg 8. radius.round exists only for the avatar and status-dot exception above. There is no radius.full.

Type, proposed: text.xs 12, text.sm 14, text.md 16, text.lg 20, text.xl 24, text.2xl 32, with paired line-height tokens; font.sans and font.mono.

Motion, proposed: duration.fast 100 ms, duration.base 160 ms, duration.slow 240 ms; easing.standard, easing.enter, easing.exit. Under reduced motion all durations resolve to 0 and spatial transitions become opacity changes.

### 3.5 Layers

Global layers: layer.base 0, layer.content 10, layer.sticky 100, layer.dropdown 200, layer.modal 300, layer.toast 400, layer.tooltip 500.

Stage-local layers (inside an isolated stacking context): stage.video 0, stage.canvas 10, stage.hud 20. These are separate from global layers so a stage never competes with menus or modals.

Render-layer files may not contain raw z-index numbers or raw hex colors (PRD T5); lint enforces it.

### 3.6 Density

Density is a token set swap. Proposed control heights: compact 24, default 32, comfortable 40. The same component renders at all three; the gallery matrix includes all three for any component with a height, padding, or row-based layout.

## 4. Component spec template

Every component has `specs/<name>.spec.md`. The docs site is generated from these files (PRD D1). Front matter is machine-read.

```
---
name: QueueRail
layer: render            # core | binding | render
tier: domain             # primitive | composite | domain | helper
status: draft            # draft | specced | built | baselined | stable
parity: { svelte: partial, react: none }
tokens: [surface.raised, border.subtle, text.primary, space.3]
contract: [queue.snapshot, queue.delta, vote.cast]
---
```

Required sections, in order:

1. Purpose. One paragraph.
2. Use when / Do not use when. The anti-use list is mandatory.
3. Domain situations. One-line mappings such as "show who plays next -> QueueRail". Aggregated into the skill mapping (section 11).
4. Anatomy. Named parts and their order.
5. API. Props table (name, type, default, description); snippets with argument types; callbacks with payload types; bindable props.
6. States. Complete list; this list is also the visual regression matrix (section 9.2).
7. Interaction and keyboard. Pointer behavior and key bindings, including the keyboard alternative for any drag interaction.
8. Accessibility. Roles, names, live regions, focus order, reduced motion.
9. Tokens used.
10. Contract dependencies. Messages consumed and emitted, with the minimum contract version.
11. Tests. Behavior tests, property invariants if core logic is involved, visual matrix dimensions.
12. Parity and changelog. Svelte and React status; notable changes by build version.

## 5. Component inventory

Tiers: primitive (no domain knowledge), composite (assembles primitives with layout logic), domain (bound to a contract or a tool), helper (non-visual). Origin: Port (from the React build), Carry (from another project), New. Names are proposed.

Primitives

| Component | Origin | Notes |
|---|---|---|
| Button, IconButton | Port | Rectangular only; icon button follows the radius scale |
| TextInput, Select, Checkbox, Toggle, Slider | Port | Carbon form conventions; FluidForm as reference |
| Tabs | Port | Used by layout manager and game panels |
| Tooltip, Menu, Dialog | Port | Global layer tokens |
| Tag | Port | Rectangular label; replaces any pill-style badge |
| Tokenizer | New | Astryx Tokenizer as reference; structured filter entry |
| Card | Port | Includes a shine variant (Svelte UX Shine as reference) |
| Icon, AnimatedIcon | Port, New | Moving-icon reference; reduced-motion safe |
| Avatar, StatusDot | Port | Only components permitted radius.round |
| Spinner, Skeleton, ProgressBar | Port | |
| SplitPane | Port | Drag and keyboard resize |

Composites

| Component | Origin | Notes |
|---|---|---|
| Shell, NavRail | Port | Workspace shell consolidation |
| LayoutManager | Port | Registry of components; split, tabs, resize, save and restore |
| ChatThread, Composer, ExecutionCard | Port | Agent chat; execution cards show tool steps |
| NotificationCenter, Toast | Port | Severity, dedupe key, actions |
| DataTable | Port | Media table columns reused by artist pages |

Domain: media and room

| Component | Origin | Notes |
|---|---|---|
| TheaterStage | New | Layered stage; worked spec in section 6.2 |
| TransportControls, SyncStatus | Port, New | TintPlayer port; SyncStatus shows drift mode and readiness |
| QueueRail | New | Worked spec in section 6.3 |
| PresenceList | New | Participants, readiness, speaking state |
| LyricsView, EqPanel | Port | Source-time lyrics modes; EQ profiles |
| VoteControls | New | Woot and meh, rectangular buttons |

Domain: automation workspace (priority)

| Component | Origin | Notes |
|---|---|---|
| GamePanelTabs | Port | Active and idle states, grid view toggle; section 7 |
| Terminal | Carry | From startpage; buffer logic in core |
| ObjectInspector | New | Lazy tree, change highlighting, pinned watches |
| LuaEditorPanel | New | Editor with debugger attached to the game |
| FridaHooksPanel | New | Hook list, hit counts, captured arguments |
| FramebufferOverlay | New | Bounding boxes, segmentation, computer vision layers |

Helpers (non-visual)

| Module | Layer | Notes |
|---|---|---|
| drift controller | core | Section 8.1 |
| clock offset estimator | core | Server time from ping round trips |
| contract client reducer | core | Envelope, seq, resync; section 8.2 |
| queue reducer | core | Section 8.3 |
| playback machine | core | Section 8.4 |
| terminal buffer | core | Scrollback, cursor, selection, no DOM |
| framebuffer geometry | core | Coordinate transforms and hit testing |
| fake room | test | Scriptable test double of the server |

## 6. Worked specs

### 6.1 Button (the template at its smallest)

```
name: Button | layer: render | tier: primitive | status: specced
tokens: accent.primary, accent.primary-hover, accent.primary-active, accent.on-primary,
        surface.raised, border.strong, border.focus, text.primary, text.disabled,
        radius.md, space.2, space.3, duration.fast, control.height.*
contract: none
```

Purpose. Trigger an action. Do not use to navigate (use a link) or to toggle state (use Toggle).

Use when / Do not use when. Use for a discrete user action. Do not use for a filter chip (use Tag or Tokenizer) or as a tab (use Tabs).

Domain situations. "Run the script -> Button, kind primary." "Cancel an execution -> Button, kind ghost, with confirm if destructive."

Anatomy. Optional leading icon, label, optional trailing icon. Rectangular with radius.md.

API.

| Prop | Type | Default | Notes |
|---|---|---|---|
| kind | 'primary' / 'secondary' / 'ghost' / 'danger' | 'secondary' | |
| size | 'sm' / 'md' / 'lg' | 'md' | Maps to control height tokens |
| disabled | boolean | false | |
| busy | boolean | false | Shows spinner, blocks activation, keeps width |
| onclick | (e: MouseEvent) => void | none | |
| children | Snippet | required | Label |
| icon | Snippet | none | Leading icon |

States. default, hover, active, focus-visible, disabled, busy. For each kind. Matrix: kind x state x density x theme.

Interaction and keyboard. Activates on Enter and Space. Busy and disabled do not activate.

Accessibility. Native button element. Busy sets aria-busy and keeps the accessible name. Disabled uses the native disabled attribute. Minimum hit target meets the density minimum.

Tests. Behavior: activation by pointer and keyboard; busy blocks activation. Visual: full state matrix.

### 6.2 TheaterStage

Purpose. A fixed-aspect stage that composes three layers: media, an overlay canvas for rendered content (avatars, annotations), and a HUD for controls. It owns layout, sizing, and layering; it does not own playback or rendering engines.

Use when / Do not use when. Use for any synchronized or single-user media surface that needs overlays. Do not use for audio-only players (use the player workspace panels) or as a general layout container.

Domain situations. "Show the room video with controls -> TheaterStage with video and hud." "Render avatars over the video -> TheaterStage with overlay." "Annotate a game framebuffer -> TheaterStage with FramebufferOverlay in overlay."

Anatomy. Root (isolated stacking context, fixed aspect ratio) containing: video layer (stage.video), overlay layer (stage.canvas, pointer-events none by default), HUD layer (stage.hud, pointer-events auto).

API.

| Prop | Type | Default | Notes |
|---|---|---|---|
| aspectRatio | string | '16 / 9' | CSS aspect-ratio value |
| fit | 'contain' / 'cover' | 'contain' | How media fits inside the stage |
| video | Snippet | none | Media layer content |
| overlay | Snippet<[{ host: HTMLElement, size: { width: number, height: number, dpr: number }, contentRect: DOMRectReadOnly }]> | none | Rendered only after mount; size updates reactively |
| hud | Snippet | none | Controls and status |
| onresize | (size) => void | none | Fires on stage size change |
| fullscreenTarget | 'stage' / 'parent' | 'stage' | Which element enters fullscreen so HUD stays visible |

Notes on the overlay snippet. The overlay receives the host element, the stage size with device pixel ratio, and the content rectangle of the media inside the stage. Overlays that must align to the picture (annotations, bounding boxes) use contentRect, which differs from the stage rectangle whenever the media is letterboxed. The snippet is not rendered with a null host.

States. empty (no media), loading, playing, paused, buffering, waiting-for-ready, error, fullscreen, letterboxed, cover-cropped. Matrix: state x aspect (16/9, 4/3, 21/9) x viewport (small, medium, large) x theme.

Interaction and keyboard. The stage itself is not focusable. HUD controls are focusable in DOM order. Fullscreen via a HUD control and the standard key; Escape exits.

Accessibility. The stage is a region labelled by the media title. Buffering and waiting-for-ready are announced through a polite live region in the HUD. Reduced motion removes HUD fade transitions.

Tokens used. surface.base, stage.video, stage.canvas, stage.hud, radius.lg, space.*.

Contract dependencies. Reads playback state (status, position, rate) for HUD display only. Playback control and sync belong to the bindings in section 8.

Tests. Behavior (real browser): resize updates the overlay size; contentRect is correct under letterboxing; pointer events pass through the overlay except on elements that opt in; fullscreen includes the HUD. Visual: state matrix above, with media replaced by a static frame fixture.

### 6.3 QueueRail

Purpose. Show the active item and the waitlist, with per-item actions and voting. It renders queue state received from the contract; it never decides queue outcomes.

Use when / Do not use when. Use for ordered, multi-contributor playback queues. Do not use for a personal playlist editor with no voting or rotation (use DataTable with reorder).

Domain situations. "Show who plays next -> QueueRail." "Let the current contributor skip -> QueueRail with onskip." "Show a guest read-only queue -> QueueRail with readonly."

Anatomy. Header (queue length, current contributor), active item row (media title, contributor, vote counts, VoteControls), waitlist rows (position, media title, contributor, actions), footer (add control).

API.

| Prop | Type | Default | Notes |
|---|---|---|---|
| snapshot | QueueSnapshot | required | From contract; active item and waitlist |
| currentUserId | string | required | Drives which actions are offered |
| readonly | boolean | false | Guests (magic link) are read-only |
| pendingOps | PendingOp[] | [] | Optimistic operations awaiting server ack |
| onreorder | (itemId: string, toIndex: number) => void | none | |
| onremove | (itemId: string) => void | none | |
| onvote | (itemId: string, value: 'woot' / 'meh') => void | none | |
| onskip | (itemId: string) => void | none | |
| onadd | () => void | none | Opens the add flow (owned by the host) |
| empty | Snippet | built-in | Custom empty state |

States. empty, populated, resyncing (gap detected, snapshot requested), dragging, pending-reorder (optimistic), reorder-rejected (rolled back with message), readonly, error, vote-pending. Matrix: state x density x theme, plus long-title and long-queue variants.

Interaction and keyboard. Pointer drag reorders. Keyboard alternative is required: focus a row, press a documented key combination to move it up or down, with a live-region announcement of the new position. Voting buttons are standard buttons, not drag handles.

Optimistic behavior. A reorder is applied locally and shown as pending. If the server rejects it (for example stale_seq), the rail rolls back to the last acknowledged order and shows the reject reason; it never silently keeps the local order.

Accessibility. The list is a list with positions announced. Vote counts are text, not only color. Drag handles have accessible names. Reduced motion removes drag settle animations.

Tokens used. surface.raised, surface.inset, border.subtle, text.*, status.warning (pending), status.danger (rejected), space.2, space.3.

Contract dependencies. queue.snapshot, queue.delta, vote.cast, queue.reorder.ack, queue.reorder.reject; minimum contract version per spec header.

Tests. Behavior (real browser): drag reorder and keyboard reorder produce the same callback payloads; rollback on reject; readonly offers no actions. Property: the reducer invariants in section 9.3 hold when driven through the contract client. Visual: state matrix.

## 7. Automation workspace set: requirements per component

These are the priority domain components. Each needs a full spec in the template before it is built; the notes below are the starting requirements.

GamePanelTabs. Tabs with active and idle status per game client panel, an unread or attention marker (rectangular, using status tokens), a grid view toggle that tiles panels, and keyboard reorder. Idle panels must be cheap to render in grid view (thumbnail or paused render). Domain situation: "list running game clients -> GamePanelTabs, grid view".

Terminal. Buffer logic in core (scrollback cap, cursor, selection, search); rendering is virtualized. Streams large output without blocking input. Copy, search, and clear are first-class. Carries forward the startpage terminal behavior.

ObjectInspector. Lazy-expanding tree for game objects and memory structures. Shows type with a rectangular Tag, highlights values that changed since the last update using the highlight token, supports pinned watches, and edit-in-place for writable values with an explicit commit. Large collections page rather than render fully.

LuaEditorPanel. Editor with a debugger attached to the game: breakpoint gutter, step controls, call stack, locals, watches, and a console. Debugger protocol handling lives in core behind an interface so the transport can change. The editor engine choice is an open decision (record in the spec before build).

FridaHooksPanel. List of hooks with enable toggle, hit count, last-hit time, captured arguments viewer, and a link to the script source. Filtering uses Tokenizer.

FramebufferOverlay. Draws bounding boxes, segmentation masks, and computer-vision layers over the game frame. Coordinate transforms between framebuffer space and screen space, and hit testing, live in core geometry. Layers toggle individually; labels remain legible at any scale; the overlay works inside TheaterStage through the overlay snippet and its contentRect.

NotificationCenter. Toasts for transient events and a persistent inbox. Severity levels, dedupe by key, optional actions, and a cap on simultaneous toasts. Announced through a live region.

ChatThread, Composer, ExecutionCard. Streaming messages, tool-execution cards with step status, and a composer with attachments and command entry. Execution cards share the status vocabulary used elsewhere (queued, running, succeeded, failed, canceled).

## 8. Helper modules

Code in this section is illustrative and meant to be adapted; it is not tested here.

### 8.1 Drift controller (core/sync/drift.ts)

Purpose. Decide how a client should correct its playback position relative to the server's target, without oscillating.

Design. Three outcomes: lock (do nothing), adjust rate (bounded, proportional), seek (hard correction). Entering correction requires crossing a higher threshold than leaving it (hysteresis). All thresholds are named constants documented alongside the contract.

```ts
export type DriftMode = 'locked' | 'correcting';
export interface DriftState { mode: DriftMode }

export type DriftAction =
  | { kind: 'lock' }
  | { kind: 'rate'; rate: number }
  | { kind: 'seek'; targetMs: number };

export const DRIFT_DEFAULTS = {
  enterMs: 120,       // start correcting above this
  exitMs: 40,         // stop correcting below this
  hardSeekMs: 1500,   // seek at or above this
  maxRateDelta: 0.05, // rate stays within 1 +/- this
  horizonMs: 2000,    // aim to remove drift over about this long
} as const;

// driftMs = clientPositionMs - serverTargetMs (positive means the client is ahead)
export function stepDrift(
  prev: DriftState,
  driftMs: number,
  serverTargetMs: number,
  cfg = DRIFT_DEFAULTS,
): [DriftState, DriftAction] {
  const abs = Math.abs(driftMs);
  if (abs >= cfg.hardSeekMs) {
    return [{ mode: 'locked' }, { kind: 'seek', targetMs: serverTargetMs }];
  }
  const correcting = prev.mode === 'correcting' ? abs > cfg.exitMs : abs > cfg.enterMs;
  if (!correcting) return [{ mode: 'locked' }, { kind: 'lock' }];
  const delta = Math.max(-cfg.maxRateDelta, Math.min(cfg.maxRateDelta, -driftMs / cfg.horizonMs));
  return [{ mode: 'correcting' }, { kind: 'rate', rate: 1 + delta }];
}
```

Server target position. When playing, target = mediaPositionMs + (serverNowEstimate - serverEpochMs) * playbackRate. When paused or buffering, target = mediaPositionMs. serverNowEstimate comes from the clock offset estimator, which derives an offset from ping round trips and prefers the sample with the lowest round-trip time. The estimator takes an injected clock.

Svelte binding (binding-svelte/runes/sync-clock.svelte.ts):

```ts
import { stepDrift, DRIFT_DEFAULTS, type DriftState, type DriftAction } from '../../core/sync/drift';

export function createSyncClock(config = DRIFT_DEFAULTS) {
  let state = $state<DriftState>({ mode: 'locked' });
  let driftMs = $state(0);
  let lastAction = $state<DriftAction>({ kind: 'lock' });

  function observe(clientPositionMs: number, serverTargetMs: number): DriftAction {
    driftMs = clientPositionMs - serverTargetMs;
    const [next, action] = stepDrift(state, driftMs, serverTargetMs, config);
    state = next;
    lastAction = action;
    return action;
  }

  return {
    get driftMs() { return driftMs; },
    get mode() { return state.mode; },
    get lastAction() { return lastAction; },
    observe,
  };
}
```

The binding applies nothing itself. The host component applies the returned action to the media element, so the binding stays testable without a DOM.

### 8.2 Contract client reducer (core/contract)

Applies envelopes to client state under the rules in the PRD (C2, C7, C8): duplicate id is a no-op; seq must be exactly the last seq plus one for deltas; a gap sets state to resyncing and emits a resync request; a snapshot replaces state and resets seq. Unsupported schemaVersion produces a typed error state. The reducer is pure; the I/O shell (socket or in-process broker) lives outside core.

### 8.3 Queue reducer (core/queue)

Events: add, remove, reorder, vote, skip, advance (track ended), user-joined, user-left. State: active item, waitlist, per-item votes, present users. Outcomes (skip, advance) are computed here from events, never in components. Invariants are listed in PRD section 9.2 and sketched under 9.3 below.

### 8.4 Playback machine (core/playback)

States: idle, loading, waiting-for-ready, playing, paused, buffering, ended. Transitions are a pure function of (state, event). waiting-for-ready exits only when every present participant is ready or has left. A bounded wait rule for stalled participants is an open question in the PRD (OQ-8).

### 8.5 Fake room (test only)

A scriptable in-process implementation of the contract used by the gallery and tests. Scenario API (sketch): `room.join(user)`, `room.leave(user)`, `room.advance(ms)`, `room.dropConnection(userId)`, `room.dropMessages(n)`, `room.castVote(user, value)`, `room.stall(user)`. Built-in scenarios: late join, reconnect with seq gap, readiness stall, simultaneous skip votes, duplicate delivery, reordered delivery. It uses the injected clock so scenarios are deterministic.

## 9. Testing conventions

### 9.1 File naming

- core/**/x.ts -> tests/core/x.property.test.ts (property) and x.model.test.ts (model-based, where applicable)
- render components -> tests/render/Name.browser.test.ts (behavior, real browser)
- gallery routes -> tests/visual/Name.visual.spec.ts (screenshots)
- tokens -> tests/tokens/drift.test.ts
- layer rules -> tests/arch/boundaries.test.ts

### 9.2 One source of truth for states

Each component exports a `states.ts` listing its named states (inputs plus fake room scenario if needed). The gallery renders one route per state, behavior tests import the same states, and visual tests iterate them. This keeps the spec's state list, the gallery, and the test matrix from diverging. A state added to the spec without an entry in states.ts fails a check.

Gallery route shape: `/gallery/<component>/<state>?theme=<theme>&density=<density>&build=<svelte|react>`. The build parameter powers the docs toggle and lets visual tests compare builds.

### 9.3 Property test patterns

Drift controller: bounds and direction.

```ts
import { test, expect } from 'vitest';
import * as fc from 'fast-check';
import { stepDrift, DRIFT_DEFAULTS } from '../../core/sync/drift';

test('rate stays within bounds and has the right sign', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: -5000, max: 5000 }),
      fc.constantFrom('locked', 'correcting'),
      (drift, mode) => {
        const [, action] = stepDrift({ mode }, drift, 0);
        if (action.kind === 'rate') {
          expect(action.rate).toBeGreaterThanOrEqual(1 - DRIFT_DEFAULTS.maxRateDelta);
          expect(action.rate).toBeLessThanOrEqual(1 + DRIFT_DEFAULTS.maxRateDelta);
          if (drift > 0) expect(action.rate).toBeLessThan(1);
          if (drift < 0) expect(action.rate).toBeGreaterThan(1);
        }
        expect(action.kind === 'seek').toBe(Math.abs(drift) >= DRIFT_DEFAULTS.hardSeekMs);
      },
    ),
  );
});
```

Hysteresis property (precondition: drift magnitudes stay below hardSeekMs, because a seek resets the mode): for any non-increasing sequence of absolute drift, the controller leaves the correcting mode at most once and never re-enters it.

Queue: votes from distinct users commute.

```ts
import fc from 'fast-check';
import { test, expect } from 'vitest';
import { reduceQueue, emptyQueue } from '../../core/queue/reducer';

const voteEvent = fc.record({
  type: fc.constant('vote' as const),
  itemId: fc.constant('item-1'),
  userId: fc.constantFrom('u1', 'u2', 'u3', 'u4', 'u5'),
  value: fc.constantFrom('woot', 'meh'),
});

const uniqueVotes = fc.uniqueArray(voteEvent, { selector: (e) => e.userId });

const votesAndPermutation = uniqueVotes.chain((events) =>
  fc
    .shuffledSubarray(events, { minLength: events.length, maxLength: events.length })
    .map((permuted) => [events, permuted] as const),
);

test('votes from distinct users commute', () => {
  fc.assert(
    fc.property(votesAndPermutation, ([events, permuted]) => {
      const a = events.reduce(reduceQueue, emptyQueue);
      const b = permuted.reduce(reduceQueue, emptyQueue);
      expect(b).toEqual(a);
    }),
  );
});
```

The fixture state used for these tests should start from a queue with an active item and present users u1 to u5; adjust emptyQueue accordingly. Other invariants (idempotency on event id, unique item ids, skip rule over present users, stable rotation) follow the list in PRD section 9.2 and each gets its own test. After writing them, run a fault-injection pass: break the reducer on purpose (for example, count departed users in the skip denominator) and confirm a property fails.

### 9.4 Component behavior tests

Run in a real browser. Query by role and accessible name. Cover pointer, keyboard, focus order, resize, and reduced motion. Anything involving drag, resize observers, or fullscreen must be here and not in a simulated DOM.

### 9.5 Visual regression

Follow PRD section 9.4. Per-component additions belong in the spec: the matrix dimensions, any tolerance override with a reason, and fixtures used in place of live media.

Update workflow: run the update command inside the pinned container, review the image diffs, commit baselines with the code change. A baseline update with no code or token change in the same change is rejected in review.

## 10. Docs site

- Generated from specs/*.spec.md. Front matter populates the header, parity table, and token list.
- Each page embeds the gallery states for that component and shows the live API table generated from types (PRD D3).
- Build toggle (Svelte or React) on every page, persisted in the URL (`?build=`), with parity status displayed. When a component has no React equivalent, the toggle shows that fact rather than hiding it.
- Pages: Instruction guide (how to build a panel with tint), Style guide (sections 1 and 3), Component breakdown (section 5 and specs), Domain mapping (section 11 of this document, rendered as a searchable table), Contract reference (generated from the schema), Changelog by build version.
- Release gate: the docs build runs in CI; failing docs fail the release (PRD D5).

## 11. Domain-to-component mapping (seed for the tint skill)

The tint skill is rebuilt around this table so a session starting from a domain request picks the correct components.

| Situation | Use | Do not use |
|---|---|---|
| List running game clients, show active and idle | GamePanelTabs, StatusDot, Tag | A custom list of cards |
| Show process or tool output | Terminal | A read-only textarea |
| Inspect game objects or memory structures | ObjectInspector | DataTable with nested rows |
| Edit and debug Lua attached to the game | LuaEditorPanel, with Terminal and ObjectInspector in the layout | A plain code block |
| Manage function hooks and see hits | FridaHooksPanel | Terminal log scraping |
| Draw detections or masks over a game frame | FramebufferOverlay inside TheaterStage overlay | Absolutely positioned divs |
| Tell the user something happened | Toast; NotificationCenter for history | Dialog |
| Talk to an agent and show its steps | ChatThread, ExecutionCard, Composer | Generic message list |
| Play synchronized media with controls | TheaterStage, TransportControls, SyncStatus | A bare media element |
| Show who plays next and let people vote | QueueRail, VoteControls | DataTable |
| Arrange panels by user choice | LayoutManager with registered components | Hard-coded split containers |
| Enter or display structured filters | Tokenizer | Pill-style chips (not allowed) |
| Summarize an item with emphasis | Card (shine variant) | Nested bordered boxes |

Each entry is backed by the "Use when / Do not use when" and "Domain situations" sections of the relevant spec; the table is generated from those sections once specs exist, so it cannot drift.

## 12. Definition of done (per component)

A component is done when all of the following are true:

1. Spec file exists, follows the template, and passes the spec linter (front matter complete, all sections present).
2. states.ts lists every state in the spec; the gallery renders each in all theme and density combinations that apply.
3. Behavior tests pass in a real browser, including keyboard and reduced motion.
4. Any core logic has property tests; fault injection confirmed they can fail.
5. Visual baselines committed for the full matrix.
6. Accessibility checks in the gallery run are green.
7. No raw hex colors or z-index numbers; no pill shapes; imports respect layer boundaries.
8. API tables generate without errors; parity row updated for both builds.
9. At least two domain situations listed, plus one anti-use.
10. Docs page builds and appears in the site with the build toggle.
