<script lang="ts">
  import { BOARD_LAYOUT_OPTIONS } from '../../../core/board'
  import type { BoardLayoutToggleProps } from './types'

  let { value, onChange, disabled = false, class: className }: BoardLayoutToggleProps = $props()
</script>

<div data-tint-board-layout-toggle="" role="group" aria-label="Board layout" class={['layout-toggle', className].filter(Boolean).join(' ')}>
  {#each BOARD_LAYOUT_OPTIONS as option (option.value)}
    <button type="button" aria-pressed={value === option.value} {disabled} onclick={() => onChange(option.value)}>{option.label}</button>
  {/each}
</div>

<style>
  .layout-toggle { display: flex; flex-wrap: wrap; gap: var(--tint-space-1); }
  button { display: inline-flex; min-height: 2.25rem; align-items: center; justify-content: center; border: 1px solid transparent; border-radius: var(--tint-radius-sm); background: transparent; padding: 0 var(--tint-space-3); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); }
  button:hover:not(:disabled) { background: var(--tint-surface); }
  button[aria-pressed='true'] { border-color: var(--tint-accent); background: var(--tint-accent); color: var(--tint-on-accent); }
  button:disabled { cursor: not-allowed; opacity: 0.5; }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
