<script lang="ts">
  import { formatMs, formatTickAge } from './fixtures'
  import type { CorrelationBundle } from './types'
  import TraceViewer from '../../svelte/components/telemetry/TraceViewer.svelte'
  import TraceServiceMap from '../../svelte/components/telemetry/TraceServiceMap.svelte'
  import LinkedRecords from './LinkedRecords.svelte'
  import ConversationTranscript from './ConversationTranscript.svelte'
  let { bundle }: { bundle: CorrelationBundle | null } = $props()
  let selectedSpanId = $state<string | null>(null)
  let previousCorrelationId: string | undefined
  $effect(() => {
    const id = bundle?.correlationId
    if (id !== previousCorrelationId) { previousCorrelationId = id; selectedSpanId = null }
  })
</script>

{#if !bundle}
  <p class="rounded-lg border border-tint-border bg-tint-panel p-4 text-sm text-tint-muted">Nothing selected. Pick a slash command from the feed to follow what the agent did with it.</p>
{:else}
  <div class="grid min-w-0 gap-4">
    <section class="grid gap-1 rounded-lg border border-tint-border bg-tint-panel p-4"><p class="m-0 text-xs uppercase tracking-wide text-tint-muted">Correlation {bundle.correlationId}</p><p class="m-0 text-lg font-medium">/{bundle.interaction?.subcommand ? `${bundle.interaction.command} ${bundle.interaction.subcommand}` : bundle.interaction?.command ?? 'unknown'}</p>
      {#if bundle.interaction}<p class="m-0 text-sm text-tint-muted">{bundle.interaction.actor} in #{bundle.interaction.channel} · {formatTickAge(bundle.interaction.tick)} · {formatMs(bundle.interaction.latencyMs)} · {bundle.interaction.agent ?? 'handled inline'}</p>{/if}
      {#if bundle.interaction?.error}<p class="m-0 text-sm text-tint-danger">{bundle.interaction.error}</p>{/if}</section>
    {#if bundle.trace}
      <section class="card"><h2>Where the time went</h2><div class="p-4"><TraceViewer trace={bundle.trace} {selectedSpanId} onSelectedSpanIdChange={(id) => { selectedSpanId = id }} /></div></section>
      <section class="card"><h2>What the agent said</h2><div class="p-4"><ConversationTranscript {bundle} {selectedSpanId} onSelectedSpanIdChange={(id) => { selectedSpanId = id }} /></div></section>
      <section class="card"><h2>Services this interaction touched</h2><div class="p-4"><TraceServiceMap trace={bundle.trace} /></div></section>
    {:else}<p class="rounded-lg border border-tint-border bg-tint-panel p-4 text-sm text-tint-muted">No trace for this correlation id</p>{/if}
    <LinkedRecords {bundle} />
  </div>
{/if}

<style>
  .card { min-width: 0; overflow: hidden; border: 1px solid var(--tint-border); border-radius: .5rem; background: var(--tint-panel); }
  .card h2 { margin: 0; padding: .75rem 1rem; border-bottom: 1px solid var(--tint-border); font-size: .875rem; }
</style>
