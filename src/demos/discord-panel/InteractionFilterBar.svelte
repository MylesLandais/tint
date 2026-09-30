<script lang="ts">
  import { commandLabel } from './correlation'
  import { EMPTY_FILTERS, type InteractionFilters } from './filters'
  import type { SlashInteraction } from './types'
  let { interactions, filters, onFiltersChange }: {
    interactions: readonly SlashInteraction[]
    filters: InteractionFilters
    onFiltersChange: (filters: InteractionFilters) => void
  } = $props()
  let commands = $derived([...new Set(interactions.map(commandLabel))].sort())
  let agents = $derived([...new Set(interactions.map((item) => item.agent ?? 'inline'))].sort())
  let channels = $derived([...new Set(interactions.map((item) => item.channel))].sort())
  function set(patch: Partial<InteractionFilters>) { onFiltersChange({ ...filters, ...patch }) }
</script>

<div data-tint-filter-bar class="flex flex-wrap items-end gap-3 border-b border-tint-border bg-tint-panel p-3">
  <label class="field">Find<input type="search" value={filters.text} oninput={(event) => set({ text: event.currentTarget.value })} placeholder="correlation id, actor, or text" /></label>
  <label class="field">Command<select value={filters.command} onchange={(event) => set({ command: event.currentTarget.value })}><option value="all">All commands</option>{#each commands as command}<option value={command}>/{command}</option>{/each}</select></label>
  <label class="field">Status<select value={filters.status} onchange={(event) => set({ status: event.currentTarget.value })}><option value="all">Any status</option><option value="replied">Replied</option><option value="failed">Failed</option><option value="deferred">Deferred</option><option value="pending">Pending</option></select></label>
  <label class="field">Agent<select value={filters.agent} onchange={(event) => set({ agent: event.currentTarget.value })}><option value="all">Any agent</option>{#each agents as agent}<option value={agent}>{agent}</option>{/each}</select></label>
  <label class="field">Channel<select value={filters.channel} onchange={(event) => set({ channel: event.currentTarget.value })}><option value="all">Any channel</option>{#each channels as channel}<option value={channel}>#{channel}</option>{/each}</select></label>
  <button type="button" disabled={JSON.stringify(filters) === JSON.stringify(EMPTY_FILTERS)} onclick={() => onFiltersChange(EMPTY_FILTERS)} class="rounded-md border border-tint-border px-3 py-1.5 text-xs">Reset</button>
</div>

<style>
  .field { display: grid; gap: .25rem; color: var(--tint-muted); font-size: .72rem; }
  input, select { min-height: 2rem; max-width: 13rem; border: 1px solid var(--tint-border); border-radius: .4rem; background: var(--tint-panel); padding: .25rem .5rem; color: var(--tint-ink); font-size: .8rem; }
  input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
</style>
