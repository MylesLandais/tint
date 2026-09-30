<script lang="ts">
  import { ActivityFeed, type ActivityEvent, type ActivitySort } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const events: ActivityEvent[] = [
    { id: 'mix', title: 'Night Drive mix is ready', href: '#mix', publishedAt: '2026-09-30T10:00:00Z', signals: ['hot', 'artifact'], score: 42, commentCount: 12, shareCount: 4, attribution: 'Studio updates' },
    { id: 'forum', title: 'Forum arrangement notes', href: '#forum', publishedAt: '2026-09-30T11:00:00Z', signals: ['new', 'rising'], score: 18, commentCount: 8, shareCount: 1, attribution: 'Community' },
    { id: 'release', title: 'October release schedule', href: '#release', publishedAt: '2026-09-29T14:00:00Z', signals: ['top'], score: 64, commentCount: 20, shareCount: 7, attribution: 'Releases' },
  ]
  let sort = $state<ActivitySort>('hot')
  let selectedId = $state<string | null>(null)
  const api: ApiRow[] = [
    { prop: 'events', type: 'readonly ActivityEvent[]', description: 'Host-owned activity records; ranking is derived in plain TypeScript.' },
    { prop: 'sort / onSortChange', type: "'hot' | 'new' | 'top' / callback", description: 'Controlled ranking choice.' },
    { prop: 'selectedId / onSelect', type: 'string | null / (id) => void', description: 'Controlled selected activity row.' },
    { prop: 'renderActions / empty', type: 'Snippet / string | Snippet', description: 'Optional row actions and empty state.' },
    { prop: 'now', type: 'number', description: 'Reference time for deterministic hot ranking.' },
  ]
  const usage = `import { ActivityFeed } from '@nebula/tint/activity'

let sort = $state<ActivitySort>('hot')
let selectedId = $state<string | null>(null)
<ActivityFeed {events} {sort} {selectedId}
  onSortChange={(next) => sort = next}
  onSelect={(id) => selectedId = id} />`
</script>

<DocPage title="Activity" description="Ranked activity with host-controlled sort and selection. Hot, new, and top ranking stay in the plain TypeScript model." importPath="@nebula/tint/activity" {usage} {api} accessibility="Sort choices expose pressed state and visible focus. Each row keeps article semantics, while its separate selection button supports Enter and Space and exposes pressed state. Title links and host actions remain independent. Event signals include readable text labels.">
  <ActivityFeed {events} {sort} {selectedId} now={Date.parse('2026-09-30T12:00:00Z')} onSortChange={(next) => sort = next} onSelect={(id) => selectedId = id} />
  <p aria-live="polite">Sort: {sort} · Selected: {selectedId ?? 'none'}</p>
</DocPage>

<style>
  p { margin: .75rem 0 0; color: var(--tint-muted); font-size: .84rem; }
</style>
