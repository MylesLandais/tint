<script lang="ts">
  import Skeleton from '../svelte/components/status/Skeleton.svelte'
  import EmptyState from '../svelte/components/status/EmptyState.svelte'
  import ErrorState from '../svelte/components/status/ErrorState.svelte'
  import ConnectionStatus from '../svelte/components/status/ConnectionStatus.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let retries = $state(0)
  const api: ApiRow[] = [
    { prop: 'Skeleton.lines', type: 'number', description: 'Number of placeholder lines.' },
    { prop: 'Skeleton.label', type: 'string', description: 'Accessible loading name for the skeleton status.' },
    { prop: 'EmptyState.title', type: 'string', description: 'Visible empty-state heading.' },
    { prop: 'EmptyState.description / icon / action', type: 'string / Snippet / Snippet', description: 'Optional supporting text, decorative icon, and host-provided action.' },
    { prop: 'ErrorState.onRetry', type: '() => void', description: 'Optional retry intent from the host.' },
    { prop: 'ErrorState.description / icon / action', type: 'string / Snippet / Snippet', description: 'Optional error detail, decorative icon, and custom action; a custom action replaces the default retry button.' },
    { prop: 'ErrorState.retryLabel', type: 'string', description: 'Copy for the default retry button when onRetry is supplied.' },
    { prop: 'ConnectionStatus.state', type: 'ConnectionState', description: 'Current connection state from the client.' },
    { prop: 'ConnectionStatus.labels', type: 'Partial<Record<ConnectionState, string>>', description: 'Optional readable state labels overriding Tint defaults.' },
  ]
  const usage = `import { ErrorState, ConnectionStatus } from '@nebula/tint/status'

<ConnectionStatus state="offline" />
<ErrorState title="Could not load" onRetry={retry} />`
</script>

<DocPage title="Status" description="Consistent loading, empty, error, and connection feedback for host-owned state." importPath="@nebula/tint/status" {usage} {api} accessibility="Skeleton and connection indicators expose polite status text. ErrorState is announced as an alert. Use a specific title and retry label to explain the next action.">
  <div class="grid">
    <div class="cell"><ConnectionStatus state="offline" /></div>
    <div class="cell"><Skeleton lines={3} label="Loading entries" /></div>
    <div class="cell"><EmptyState title="No entries" description="Change a filter to see more results." /></div>
    <div class="cell"><ErrorState title="Could not load" description="Try this request again." onRetry={() => retries += 1} /></div>
  </div>
  <p aria-live="polite">Retries requested: {retries}</p>
</DocPage>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: .75rem; }
  .cell { min-height: 6rem; padding: .75rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); }
  p { color: var(--tint-muted); font-size: .85rem; }
</style>
