# Client-only DJ Demo Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build and verify a client-only React/TypeScript “Midnight 128” demo that imports local or generated tracks, authors deterministic transitions, auditions and performs them through Web Audio, schedules the set for radio playout, and leaves Playwright and audio evidence.

**Architecture:** Tint owns controlled, serializable React components and musical-time contracts. A separate framework-free engine module owns transition compilation, clocking, Web Audio scheduling, diagnostics, analysis workers, and offline rendering; React observes coarse snapshots with `useSyncExternalStore`, while canvas animation reads the engine clock directly. The committed synthetic fixture drives CI; private purchased tracks stay outside Git and are selected through the same visible file-input path.

**Tech Stack:** React 19, TypeScript 6, Web Audio API, Canvas 2D, Web Workers, Vitest, Testing Library, Playwright.

---

## Reused components and constraints

- Reuse `src/components/media/Waveform.tsx` drawing behavior, but introduce one shared beats-to-pixels viewport contract before adding DJ overlays.
- Reuse `src/components/media-assets/UploadDropzone.tsx` / `UploadQueue.tsx` for import presentation where their controlled contracts fit.
- Follow the immutable document/command style in `src/components/board/contracts.ts`.
- Keep audio graph ownership outside Tint components; no React transport clock and no 60 Hz `setState` loop.
- No matching DJ transition engine or Playwright actor exists in Tint, `Workspace-public`, `Workspace-internal`, or `Workspace-fast`.
- Do not commit purchased Beatport/SoundCloud media or release artwork.

## Phase 1 — Musical document and deterministic compiler

### Task 1: Define the set/transition contract and compile the two reference presets

**Objective:** Make transition timing and automation serializable and testable without React or Web Audio.

**Files:**
- Create: `src/components/dj/contracts.ts`
- Create: `src/components/dj/transitionCompiler.ts`
- Create: `src/components/dj/transitionCompiler.test.ts`
- Create: `src/components/dj/index.ts`
- Modify: `package.json`
- Modify: `src/index.ts`

**Steps:**
1. Write a failing Vitest case for 32 bars at 128 BPM compiling to 60 seconds, downbeat-aligned bounds, equal-power gain lanes, and a bar-17 bass swap.
2. Run `npm test -- src/components/dj/transitionCompiler.test.ts` and confirm failure because the compiler does not exist.
3. Implement the smallest framework-free contract and compiler for `long-bass-swap`.
4. Run the focused test and confirm pass.
5. Add a failing test for the 16-bar `filter-echo-exit` preset, including independent echo-send tail metadata.
6. Implement that preset and reject non-finite/non-positive tempo, invalid bar counts, and unknown track references.
7. Run the focused test, then `npm run test`, `npm run lint`, and `npm run build`.

### Task 2: Add immutable set commands and JSON round-trip validation

**Objective:** Ensure UI edits are undoable and exported documents compile identically after reload.

**Files:**
- Create: `src/components/dj/commands.ts`
- Create: `src/components/dj/commands.test.ts`
- Create: `src/components/dj/serialization.ts`
- Create: `src/components/dj/serialization.test.ts`

**Steps:** TDD track insertion/reorder, auto-transition generation, automation-point movement, revision increments, schema validation, JSON round-trip, and schedule equivalence.

## Phase 2 — Shared musical timeline primitives

### Task 3: Introduce one beats/pixels viewport contract

**Files:**
- Create: `src/components/timeline/contracts.ts`
- Create: `src/components/timeline/viewport.ts`
- Create: `src/components/timeline/viewport.test.ts`
- Create: `src/components/timeline/index.ts`

**Steps:** TDD beat↔pixel conversion, zoom, scroll, clamping, and fractional beat precision.

### Task 4: Build controlled canvas and accessible overlays

**Files:**
- Create: `src/components/timeline/WaveformCanvas.tsx`
- Create: `src/components/timeline/BeatGridOverlay.tsx`
- Create: `src/components/timeline/TransitionRegion.tsx`
- Create: `src/components/timeline/AutomationLane.tsx`
- Create: `src/components/timeline/timeline.test.tsx`

**Steps:** TDD controlled props, keyboard-accessible companion controls, touch targets, ResizeObserver drawing, and no internal transport state.

## Phase 3 — Client-only import, analysis, and audio engine

### Task 5: Generate deterministic redistributable fixtures

**Files:**
- Create: `scripts/generate-dj-fixtures.mjs`
- Create: `tests/fixtures/dj/reference-manifest.json`
- Modify: `.gitignore`
- Modify: `package.json`

**Steps:** Generate three short 128 BPM WAV tracks with distinct tonal/percussion signatures; hash them; validate manifest before tests.

### Task 6: Decode and analyze selected files in a worker

**Files:**
- Create: `src/dj-engine/analysis/analysis.worker.ts`
- Create: `src/dj-engine/analysis/client.ts`
- Create: `src/dj-engine/analysis/analysis.test.ts`

**Steps:** TDD waveform peaks, duration, coarse BPM/downbeat detection, cancellation, malformed media errors, and deterministic fixture tolerances. Key detection remains explicitly provisional until a validated analyzer or WASM implementation exists.

### Task 7: Implement Web Audio scheduling and diagnostics

**Files:**
- Create: `src/dj-engine/AudioEngine.ts`
- Create: `src/dj-engine/AutomationScheduler.ts`
- Create: `src/dj-engine/diagnostics.ts`
- Create: `src/dj-engine/audioEngine.test.ts`

**Steps:** TDD graph construction behind injected audio interfaces, cancellation on seek/re-audition, finite AudioParam values, outgoing-deck retirement after effect tail, and coarse diagnostics snapshots.

### Task 8: Add the React engine bridge

**Files:**
- Create: `src/dj-client/AudioEngineProvider.tsx`
- Create: `src/dj-client/hooks.ts`
- Create: `src/dj-client/audioReact.test.tsx`

**Steps:** TDD provider lifecycle, `useSyncExternalStore` snapshots, user-gesture resume, capability states, and teardown. Keep playhead/meters outside React’s high-frequency state path.

## Phase 4 — Interactive vertical slice

### Task 9: Build library import and set builder

**Files:**
- Create: `src/components/music/TrackRow.tsx`
- Create: `src/components/music/NowPlayingBar.tsx`
- Create: `src/components/dj/ImportTracksDialog.tsx`
- Create: `src/components/dj/SetList.tsx`
- Create: `src/components/dj/SetOverview.tsx`
- Create: `src/components/dj/libraryAndSet.test.tsx`

**Steps:** TDD visible multi-file input, analysis status, reorder, “Midnight 128” creation, duration, and Auto Transitions.

### Task 10: Build quick and advanced transition editing

**Files:**
- Create: `src/components/dj/QuickTransitionCard.tsx`
- Create: `src/components/dj/TransitionEditor.tsx`
- Create: `src/components/dj/DualWaveform.tsx`
- Create: `src/components/dj/TransitionPresetPicker.tsx`
- Create: `src/components/dj/TransitionAuditionControls.tsx`
- Create: `src/components/dj/transitionEditor.test.tsx`

**Steps:** TDD progressive disclosure, preset/bar selection, breakpoint adjustment via commands, and audition intent callbacks.

### Task 11: Compose performance and radio workspaces

**Files:**
- Create: `src/docs/dj/DJClientDemo.tsx`
- Create: `src/components/dj/PerformanceWorkspace.tsx`
- Create: `src/components/radio/RadioStudio.tsx`
- Create: `src/components/dj/workspaces.test.tsx`
- Modify: `src/docs/routes.ts`
- Modify: `src/docs/pages.tsx`

**Steps:** TDD navigation through Library, Set, Transition, Perform, and Broadcast; schedule the same set document as a playout block; regenerate `src/docs/generated/docsGraph.ts`.

## Phase 5 — Offline proof and Playwright acceptance

### Task 12: Render and validate the whole set offline

**Files:**
- Create: `src/dj-engine/OfflineSetRenderer.ts`
- Create: `src/dj-engine/offlineSetRenderer.test.ts`

**Steps:** Render faster than real time; assert non-silence, finite samples, peak ceiling, duration, transition boundaries, and schedule equivalence after export/reload.

### Task 13: Install Playwright and add the DJActor

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/actors/DJActor.ts`
- Create: `tests/e2e/fixtures/referenceTracks.ts`
- Create: `tests/e2e/dj-client.spec.ts`
- Modify: `package.json`

**Steps:** Install `@playwright/test`; configure screenshots, trace, video, HTML report, web server at port 45173; drive all actions through visible UI using `setInputFiles`; use diagnostics only for audio facts inaccessible to the DOM.

### Task 14: Produce acceptance evidence

**Files produced (gitignored):**
- `artifacts/midnight-128.set.json`
- `artifacts/midnight-128-analysis.json`
- `artifacts/midnight-128-transition-plan.json`
- `artifacts/midnight-128-master.webm`
- `artifacts/diagnostics/midnight-128-audio-diagnostics.json`
- `artifacts/screenshots/*.png`
- `artifacts/traces/midnight-128-e2e.zip`
- `artifacts/videos/midnight-128-actor.webm`
- `playwright-report/`

**Steps:** Run synthetic acceptance in CI; skip private-reference suite when `DJ_REFERENCE_TRACK_DIR` is absent; validate private filenames and hashes before use; seek around transition windows in normal E2E; reserve tagged 16:06 real-time soak for release acceptance.

## Completion gate

The goal is complete only when the Playwright DJActor imports three tracks through the visible UI, obtains analysis, builds and reorders “Midnight 128,” generates both transitions, edits and auditions automation, plays through both boundaries, schedules the set in Broadcast, exports and reloads equivalent JSON, and produces browser plus audio evidence with no engine error, invalid automation value, dropped worklet block, clipping violation, or stale scheduled event.
