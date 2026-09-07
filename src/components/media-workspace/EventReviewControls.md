# EventReviewControls

```tsx
import { EventReviewControls, type EventReviewControlsProps } from '@nebula/tint/media-workspace'
import '@nebula/tint/styles.css'
```

Also exported from `@nebula/tint`. This is the canonical source package, not the separate legacy `@tint/react` compiled package. Consumers need React 19, Tailwind v4, and a TypeScript-aware bundler as described in the repository README.

## Controlled contract

- `quickFilters: readonly { id: string; label: string }[]` — unique, stable host IDs.
- `selectedQuickFilterId: string | null`; `onQuickFilterChange(id: string)` — single quick-filter intent. Unknown current IDs are allowed; no filter is then pressed.
- `historyDate?: { dateTime: string; label: string } | null` — display-only HTML time metadata and host-formatted label. The host owns timezone and localization. Never converted to an offset or seek.
- `mediaTimestampSeconds?: number | null`; `onSeek?: (seconds: number) => void` — finite nonnegative media offset, including zero. Invalid/missing offsets show unavailable. Without a callback the timestamp is display-only. Labels truncate fractional seconds to m:ss; emitted intent preserves full precision.
- `candidatePeople: readonly { id: string; label: string }[]` — available candidates.
- `selectedCandidatePersonIds: readonly string[]`; `onCandidatePersonIdsChange(ids: string[])` — multiple selections. Unknown selected IDs are displayed as `Unknown person (ID)`, remain removable, and survive other changes. Input arrays are never mutated.
- `disabled?: boolean` — disables all intents.
- `className?: string` — outer section styling.

The host must rerender with authoritative values after callbacks. Selection never means confirmed identity, training eligibility, consent, or persistence. The component always displays **Review required · Training not approved** and exposes no approval action. It performs no fetching, storage, player access, or inference.

## Verification

```sh
npm test -- src/components/media-workspace/EventReviewControls.test.tsx
npm test
npm run build
npm run lint
# With npm run dev running separately:
node scripts/verify-event-review.mjs
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if a system Chromium is needed. The browser smoke runs an isolated generic consumer at a 390px viewport, exercising pointer filters/candidates and keyboard seeking. It reports the known proxy-only Vite HMR socket warning separately when the canonical reverse proxy is unavailable.
