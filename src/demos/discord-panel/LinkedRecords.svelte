<script lang="ts">
  import { formatTickAge } from './fixtures'
  import type { CorrelationBundle } from './types'
  let { bundle }: { bundle: CorrelationBundle | null } = $props()
</script>

<section aria-label="Linked records" class="rounded-lg border border-tint-border bg-tint-panel">
  <header class="flex flex-wrap items-center justify-between gap-2 border-b border-tint-border px-4 py-3"><h2 class="m-0 text-sm font-semibold">Linked records</h2>{#if bundle}<code class="break-all text-xs text-tint-muted">{bundle.correlationId}</code>{/if}</header>
  {#if !bundle}<p class="p-4 text-sm text-tint-muted">Nothing selected</p>
  {:else if bundle.audit.length === 0 && bundle.moderation.length === 0}<p class="p-4 text-sm text-tint-muted">No other subsystem recorded this id</p>
  {:else}<ol class="m-0 grid list-none gap-3 p-4">
    {#each bundle.moderation as event (event.id)}<li class="grid gap-1"><strong class="text-xs">{event.kind}{event.automated ? ' · automated' : ''}</strong><p class="m-0 text-sm">{event.detail}</p><small class="text-tint-muted">{event.actor}{event.subject ? ` → ${event.subject}` : ''} · {formatTickAge(event.tick)}</small></li>{/each}
    {#each bundle.audit as row (row.id)}<li class="grid gap-1"><code class="break-all text-xs">{row.action}</code><small class="text-tint-muted">{row.actor} · {formatTickAge(row.tick)}</small></li>{/each}
  </ol>{/if}
</section>
