<script lang="ts">
  import { commandLabel } from './correlation'
  import { formatMs } from './fixtures'
  import type { SlashInteraction } from './types'
  import MetricCard from '../../svelte/components/charts/MetricCard.svelte'
  let { interactions }: { interactions: readonly SlashInteraction[] } = $props()
  let failed = $derived(interactions.filter((item) => item.status === 'failed').length)
  let outstanding = $derived(interactions.filter((item) => item.status === 'pending' || item.status === 'deferred').length)
  let agents = $derived(new Set(interactions.map((item) => item.agent).filter(Boolean)).size)
  let slowest = $derived(interactions.reduce<SlashInteraction | null>((worst, item) => worst === null || item.latencyMs > worst.latencyMs ? item : worst, null))
</script>

<div class="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-4">
  <MetricCard label="Interactions" value={String(interactions.length)} hint={`${agents} agents`} tone="accent" />
  <MetricCard label="Failed" value={String(failed)} hint={interactions.length ? `${Math.round(failed / interactions.length * 100)}% of traffic` : '—'} tone={failed ? 'danger' : 'default'} />
  <MetricCard label="In flight" value={String(outstanding)} hint={outstanding ? 'Awaiting a follow-up' : 'All settled'} />
  <MetricCard label="Slowest" value={slowest ? formatMs(slowest.latencyMs) : '—'} hint={slowest ? `/${commandLabel(slowest)}` : 'No traffic'} />
</div>
