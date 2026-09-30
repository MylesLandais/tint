# EventReviewControls

```svelte
<script lang="ts">
  import { EventReviewControls } from '@nebula/tint/media-workspace'
  import '@nebula/tint/styles.css'
</script>

<EventReviewControls
  {quickFilters}
  {selectedQuickFilterId}
  onQuickFilterChange={(id) => selectedQuickFilterId = id}
  {candidatePeople}
  {selectedCandidatePersonIds}
  onCandidatePersonIdsChange={(ids) => selectedCandidatePersonIds = ids}
/>
```

The same component is exported from `@nebula/tint`. Its host owns every selected value and persists changes if needed.

## Controlled contract

- `quickFilters` use unique, stable IDs. `selectedQuickFilterId` can be unknown; no filter is then pressed. `onQuickFilterChange` emits an ID.
- `historyDate` carries display-only HTML time metadata and a host-formatted label. It is never converted to a media offset.
- `mediaTimestampSeconds` is a finite nonnegative media offset. An invalid or missing offset shows unavailable. `onSeek` receives the full precision offset, while the label shows `m:ss`.
- `candidatePeople` lists available people. Unknown selected IDs remain visible and removable through `onCandidatePersonIdsChange`; input arrays are not mutated.
- `disabled` disables every intent. `class` styles the outer section.

The host must pass authoritative values back after callbacks. Selection does not confirm identity, training eligibility, consent, or persistence. The component displays **Review required · Training not approved** and has no approval action.

The live Svelte documentation page and `EventReviewControls.test.ts` cover pointer selection, keyboard seeking, unknown candidate IDs, history dates, and narrow layout.
