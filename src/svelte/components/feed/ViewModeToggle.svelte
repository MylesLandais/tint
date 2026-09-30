<script lang="ts">
  import { DEFAULT_FEED_LAYOUT_OPTIONS, feedLayoutLabel } from '../../../core/feed'
  import type { ViewModeToggleProps } from './types'
  let { value, onChange, options = DEFAULT_FEED_LAYOUT_OPTIONS, disabled = false, class: className }: ViewModeToggleProps = $props()
</script>

<div data-tint-view-mode-toggle="" role="group" aria-label="Feed layout" class={['view-mode-toggle', className].filter(Boolean).join(' ')}>
  {#each options as variant (variant)}
    <button type="button" aria-pressed={value === variant} {disabled} onclick={() => onChange(variant)}>{feedLayoutLabel(variant)}</button>
  {/each}
</div>

<style>
  .view-mode-toggle { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); }
  button { display: inline-flex; min-height: 2.25rem; align-items: center; justify-content: center; border: 1px solid transparent; border-radius: var(--tint-radius-sm); background: transparent; padding: 0 var(--tint-space-3); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); }
  button:hover:not(:disabled) { background: var(--tint-surface); }
  button[aria-pressed='true'] { border-color: var(--tint-accent); background: var(--tint-accent); color: var(--tint-on-accent); }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
