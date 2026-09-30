# Svelte migration, Step 1: baseline and follow-up

Branch `svelte-dev`, based on `feat/publish-nebula-package`. Step 1 landed as `2fe7a02`.

## Baseline (clean commits, before any Svelte change)

| Command | Result |
|---|---|
| `npm test` | 136 files, 1012 tests, all passed |
| `npm run lint` | exit 0, 10 pre-existing `jsx-a11y` warnings |
| `npm run build` | exit 0 |
| `npm run test:e2e` | 1 of 1 passed |

After Step 1: 138 files, 1019 tests (two new files, seven new tests), `check:svelte` 0 errors, lint and e2e unchanged.

## Observed intermittent failures

Recorded 2026-09-29 at `2fe7a02` (plus an `AGENTS.md`-only edit).

1. **During Step 1 verification:** one full-suite run reported `1 failed | 1018 passed`. The failing test was not captured. Three later runs were green.
2. **Five consecutive `npm test` runs:** all five reported `138 passed (138)` and `1019 passed (1019)`, but **runs 2 and 3 exited 1**. Runs 1, 4 and 5 exited 0.
   - Cause of the nonzero exit: one *unhandled error* after the tests finished, not a failed test:
     `ReferenceError: document is not defined` at `@tiptap/extension-bubble-menu` (`BubbleMenuView.shouldShow`, a debounced `window.setTimeout` in `updateHandler`), attributed to `src/components/editor/Editor.test.tsx`.
   - Reading of the cause: the BubbleMenu debounce timer outlives the jsdom environment when the file finishes early enough, so it depends on load and timing. It is in React and TipTap code that the Svelte work did not touch, but it was **not** confirmed to predate Step 1, because the baseline was only run once.
   - Fixed in `src/components/editor/Editor.test.tsx` by waiting 300 ms in `afterAll`, after React Testing Library has unmounted the editor and before Vitest tears down this file's jsdom. This lets TipTap's 250 ms BubbleMenu update timer complete while `document` still exists. The focused nine-test file passed after the change; the full suite passed (143 files, 1048 tests) at the next checkpoint.
   - The earlier single failed test (item 1) may or may not be the same problem.

3. **During the final Svelte-only docs cutover on 2026-09-30:** one `npm run test:e2e` run passed 47 of 48 cases; the Calendar docs case timed out before its grid appeared. Its failure screenshot was a blank page, while later docs routes passed. The Calendar case passed on an immediate focused rerun (`1 passed`, 5.1 seconds). A second full run after source edits settled again passed 47 of 48 cases; this time the Chat docs case showed a blank page before its heading appeared. The retained Chat trace recorded dozens of simultaneous Chromium `net::ERR_NETWORK_CHANGED` failures for Vite development module requests, with no recorded application exception. The Calendar trace had been cleared by its focused rerun, so its exact cause remains unconfirmed. Playwright now builds Tint and serves the production preview at port 45174, avoiding the development server's large module request graph. The first full run against that preview passed **48 of 48 cases** in 1.4 minutes.
