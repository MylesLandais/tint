<script lang="ts">
  import { ChevronLeft, ChevronRight, RotateCcw } from '@lucide/svelte'
  import type { ChatMessageAlternativesProps } from './types'

  let { alternatives, value, onValueChange, onRegenerate, disabled = false,
    label = 'Saved responses', class: className }: ChatMessageAlternativesProps = $props()
  let index = $derived(alternatives.findIndex((item) => item.id === value))
  const button = 'rounded p-1 text-tint-muted hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-tint-accent disabled:opacity-40'
</script>

<div role="group" aria-label={label} class={['inline-flex min-w-0 items-center gap-1 text-xs', className]}>
  <button type="button" class={button} aria-label="Previous saved response" disabled={disabled || index <= 0}
    onclick={() => onValueChange(alternatives[index - 1].id)}><ChevronLeft size={16} /></button>
  <span role="status" aria-live="polite" class="tabular-nums text-tint-muted">
    {index < 0 ? '—' : index + 1} / {alternatives.length}
    {#if index >= 0 && alternatives[index].label} · {alternatives[index].label}{/if}
  </span>
  <button type="button" class={button} aria-label="Next saved response" disabled={disabled || index < 0 || index >= alternatives.length - 1}
    onclick={() => onValueChange(alternatives[index + 1].id)}><ChevronRight size={16} /></button>
  {#if onRegenerate}<button type="button" class={button} {disabled} aria-label="Generate another response" onclick={onRegenerate}><RotateCcw size={16} /></button>{/if}
</div>
