<script lang="ts">
  import { formatTickAge } from './fixtures'
  import type { ModerationEvent } from './types'
  let { events, selectedId, onSelect }: { events: readonly ModerationEvent[]; selectedId: string | null; onSelect: (id: string) => void } = $props()
</script>

{#if events.length === 0}<p class="p-4 text-sm text-tint-muted">Nothing has happened in range</p>
{:else}
  <ol aria-label="Guild activity events" class="m-0 grid list-none gap-2 p-0">
    {#each events as event (event.id)}
      <li class={['grid gap-1 rounded-lg border p-3', event.correlationId === selectedId ? 'border-tint-accent' : 'border-tint-border']}>
        <div class="flex flex-wrap items-center gap-2 text-sm"><strong class="font-medium">{event.kind}</strong>{#if event.automated}<span class="rounded bg-tint-info-soft px-1.5 py-0.5 text-xs text-tint-info">automated</span>{/if}<span>{event.actor}{event.subject ? ` → ${event.subject}` : ''}</span><small class="ml-auto text-tint-muted">#{event.channel} · {formatTickAge(event.tick)}</small></div>
        <p class="m-0 text-sm text-tint-muted">{event.detail}</p>
        {#if event.correlationId}<div><button type="button" onclick={() => onSelect(event.correlationId!)} class="rounded px-1.5 py-1 text-xs text-tint-accent hover:underline">Follow {event.correlationId}</button></div>{/if}
      </li>
    {/each}
</ol>

<style>
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
{/if}
