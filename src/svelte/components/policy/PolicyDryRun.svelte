<script lang="ts">
  import { untrack } from 'svelte'
  import { countMatches, mockDryRun, type DryRunResult } from '../../../core/policy'
  import Badge from '../badge/Badge.svelte'
  import type { PolicyDryRunProps } from './types'

  let { rule, entries, class: className }: PolicyDryRunProps = $props()
  let entryId = $state(untrack(() => entries[0]?.id ?? ''))
  let entry = $derived(entries.find((item) => item.id === entryId) ?? entries[0])
  let result = $state<DryRunResult>(untrack(() => entries[0] ? mockDryRun(entries[0], rule) : { matched: false, note: 'No entries.' }))
  let matchTotal = $derived(countMatches(entries, rule))

  function run() {
    if (entry) result = mockDryRun(entry, rule)
  }
</script>

<div data-tint-policy-dry-run="" class={['dry-run', className].filter(Boolean).join(' ')}>
  <div class="controls">
    <label><span>Fixture entry</span><select value={entry?.id ?? ''} onchange={(event) => entryId = event.currentTarget.value}>
      {#each entries as item (item.id)}<option value={item.id}>{item.title}</option>{/each}
    </select></label>
    <button type="button" class="run" disabled={!entry} onclick={run}>Run dry-run</button>
  </div>
  <p class="summary">Builder / mocked Lua would match <strong>{matchTotal}</strong> of {entries.length} fixture entries for “{rule.name}”.</p>
  <div class="result" aria-live="polite">
    <div class="badges"><Badge tone={result.matched ? 'success' : 'neutral'}>{result.matched ? 'matched' : 'no match'}</Badge>{#if result.disposition}<Badge tone="accent">{result.disposition}</Badge>{/if}</div>
    {#if result.note}<p>{result.note}</p>{/if}
  </div>
</div>

<style>
  .dry-run { display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-3); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); padding: var(--tint-space-4); container-type: inline-size; }
  .controls { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: var(--tint-space-3); }
  label { display: flex; min-width: 12rem; flex: 1; flex-direction: column; gap: var(--tint-space-1); font-size: var(--tint-font-size-sm); }
  label span { color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-weight: 500; }
  select { min-width: 0; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); padding: var(--tint-space-1) var(--tint-space-2); color: var(--tint-ink); font: inherit; }
  .run { min-height: 2rem; border: 1px solid var(--tint-accent); border-radius: var(--tint-radius-sm); background: var(--tint-accent); padding: 0 var(--tint-space-3); color: var(--tint-on-accent); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); }
  .run:disabled { opacity: 0.5; cursor: not-allowed; }
  .summary { margin: 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .summary strong { color: var(--tint-ink); }
  .result { border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-surface); padding: var(--tint-space-3); font-size: var(--tint-font-size-sm); }
  .badges { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tint-space-2); }
  .result p { margin: var(--tint-space-2) 0 0; color: var(--tint-muted); }
  :is(select, button):focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  @container (max-width: 340px) { label { min-width: 0; width: 100%; } .run { width: 100%; } }
</style>
