<script lang="ts">
  import { edgeEnabledIndex, nextEnabledIndex } from '../../../core/interaction/navigation'
  import type { SelectionToolbarProps } from './types'
  let { position, open, actions, onAction, class: className, ...rest }: SelectionToolbarProps = $props()
  let bar = $state<HTMLDivElement>()

  function onToolbarKeydown(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || !bar) return
    const buttons = Array.from(bar.querySelectorAll<HTMLButtonElement>('button'))
    const current = buttons.indexOf(event.target as HTMLButtonElement)
    if (current < 0) return
    const next = event.key === 'Home' ? edgeEnabledIndex(actions, 'first')
      : event.key === 'End' ? edgeEnabledIndex(actions, 'last')
      : nextEnabledIndex(actions, current, event.key === 'ArrowRight' ? 1 : -1)
    if (next < 0) return
    event.preventDefault()
    buttons[next]?.focus()
  }
</script>

{#if open && position}
  <div {...rest} bind:this={bar} data-tint-selection-toolbar="" role="toolbar" tabindex="-1" aria-label="Selection actions" class={['selection-toolbar', className].filter(Boolean).join(' ')} style:left={`${position.x}px`} style:top={`${position.y}px`} onkeydown={onToolbarKeydown}>
    {#each actions as action (action.id)}
      <button type="button" class:danger={Boolean(action.danger)} disabled={action.disabled} onclick={() => onAction(action.id)}>
        {#if action.icon}<span class="icon" aria-hidden="true">{#if typeof action.icon === 'string'}{action.icon}{:else}{@render action.icon()}{/if}</span>{/if}
        {action.label}
      </button>
    {/each}
  </div>
{/if}

<style>
  .selection-toolbar { position: fixed; z-index: 40; display: flex; gap: var(--tint-space-1); transform: translate(-50%, -100%); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); padding: var(--tint-space-1); box-shadow: 0 4px 10px -2px var(--tint-shadow-color); }
  button { display: inline-flex; min-height: 2.25rem; align-items: center; gap: var(--tint-space-1); border: 0; border-radius: var(--tint-radius-sm); background: transparent; padding: 0 var(--tint-space-2); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); white-space: nowrap; }
  button:hover { background: var(--tint-surface); }
  button.danger { color: var(--tint-danger-ink); }
  button.danger:hover { background: var(--tint-danger-soft); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .icon { display: inline-flex; }
</style>
