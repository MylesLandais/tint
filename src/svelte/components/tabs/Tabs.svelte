<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { edgeEnabledIndex, nextEnabledIndex } from '../../../core/interaction/navigation'
  import type { TabItem } from './types'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    tabs: readonly TabItem[]
    value: string
    onValueChange: (value: string) => void
    label?: string
  }

  let { tabs, value, onValueChange, label = 'Tabs', class: className, ...rest }: Props = $props()
  const id = $props.id()
  let root = $state<HTMLDivElement>()
  let focusIndex = $state<number | undefined>()

  $effect(() => {
    const selectedIndex = tabs.findIndex((tab) => tab.id === value && !tab.disabled)
    focusIndex = selectedIndex >= 0 ? selectedIndex : edgeEnabledIndex(tabs, 'first')
  })

  function select(index: number) {
    const tab = tabs[index]
    if (!tab || tab.disabled) return
    focusIndex = index
    root?.querySelector<HTMLElement>(`[data-tab-index="${index}"]`)?.focus()
    if (tab.id !== value) onValueChange(tab.id)
  }

  function onTabKeydown(event: KeyboardEvent, index: number) {
    let next = -1
    if (event.key === 'ArrowRight') next = nextEnabledIndex(tabs, index, 1)
    else if (event.key === 'ArrowLeft') next = nextEnabledIndex(tabs, index, -1)
    else if (event.key === 'Home') next = edgeEnabledIndex(tabs, 'first')
    else if (event.key === 'End') next = edgeEnabledIndex(tabs, 'last')
    else return
    event.preventDefault()
    select(next)
  }
</script>

<div {...rest} bind:this={root} class={['tint-tabs', className].filter(Boolean).join(' ')}>
  <div role="tablist" aria-label={label} class="list">
    {#each tabs as tab, index (tab.id)}
      <button
        id={`${id}-tab-${index}`}
        type="button"
        role="tab"
        data-tab-index={index}
        aria-selected={value === tab.id}
        aria-controls={`${id}-panel-${index}`}
        disabled={tab.disabled}
        tabindex={focusIndex === index ? 0 : -1}
        onclick={() => select(index)}
        onkeydown={(event) => onTabKeydown(event, index)}
      >
        {#if typeof tab.label === 'string'}{tab.label}{:else}{@render tab.label()}{/if}
      </button>
    {/each}
  </div>
  {#each tabs as tab, index (tab.id)}
    <div
      id={`${id}-panel-${index}`}
      role="tabpanel"
      aria-labelledby={`${id}-tab-${index}`}
      tabindex={value === tab.id ? 0 : -1}
      hidden={value !== tab.id}
      class="panel"
    >
      {#if typeof tab.content === 'string'}{tab.content}{:else}{@render tab.content()}{/if}
    </div>
  {/each}
</div>

<style>
  .list { display: flex; gap: var(--tint-space-1); overflow-x: auto; border-bottom: 1px solid var(--tint-border); }
  .list button { position: relative; flex: none; border: 0; padding: var(--tint-space-2) var(--tint-space-3); background: transparent; color: var(--tint-muted); font: inherit; font-size: var(--tint-font-size-sm); cursor: pointer; }
  .list button[aria-selected='true'] { color: var(--tint-accent); font-weight: 600; }
  .list button[aria-selected='true']::after { position: absolute; right: 0; bottom: 0; left: 0; height: 2px; background: var(--tint-accent); content: ''; }
  .list button:focus-visible, .panel:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .list button:disabled { opacity: 0.5; cursor: not-allowed; }
  .panel { padding: var(--tint-space-3) 0; }
  .panel[hidden] { display: none; }
</style>
