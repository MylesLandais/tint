<script lang="ts">
  import { Portal } from 'carbon-components-svelte'
  import { tick, type Snippet } from 'svelte'
  import { edgeEnabledIndex, nextEnabledIndex, typeaheadIndex } from '../../../core/interaction/navigation'
  import { positionOverlay } from '../../../core/interaction/position'
  import { observeOverlaySize } from '../overlay/observeSize'
  import type { MenuItem, MenuSeparator, MenuTriggerProps } from './types'

  type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    items: readonly (MenuItem | MenuSeparator)[]
    trigger?: Snippet<[MenuTriggerProps]>
    label?: string
    class?: string
  }

  let { open, onOpenChange, items, trigger, label = 'Menu', class: className }: Props = $props()
  const id = $props.id()
  let anchor = $state<HTMLDivElement>()
  let menuNode = $state<HTMLDivElement>()
  let activeIndex = $state(-1)
  let position = $state({ top: 0, left: 0 })
  let search = $state('')
  let searchTimer: ReturnType<typeof setTimeout> | undefined

  const options = $derived(items.map((item) => ({ disabled: 'type' in item || item.disabled })))

  function triggerNode() {
    return anchor?.querySelector<HTMLElement>('[data-tint-trigger]') ?? anchor
  }

  function updatePosition() {
    const node = triggerNode()
    if (!node || !menuNode) return
    position = positionOverlay(
      node.getBoundingClientRect(), menuNode.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight }, 'bottom', 6,
    )
  }

  function focusItem(index: number) {
    if (index < 0) return
    activeIndex = index
    menuNode?.querySelector<HTMLElement>(`[data-menu-index="${index}"]`)?.focus()
  }

  function selectItem(item: MenuItem) {
    if (item.disabled) return
    item.onSelect?.()
    onOpenChange(false)
    triggerNode()?.focus()
  }

  function onMenuKeydown(event: KeyboardEvent) {
    let next = -1
    if (event.key === 'ArrowDown') next = nextEnabledIndex(options, activeIndex, 1)
    else if (event.key === 'ArrowUp') next = nextEnabledIndex(options, activeIndex, -1)
    else if (event.key === 'Home') next = edgeEnabledIndex(options, 'first')
    else if (event.key === 'End') next = edgeEnabledIndex(options, 'last')
    else if (event.key === 'Tab') { onOpenChange(false); return }
    else if (event.key.length === 1 && event.key !== ' ' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      search += event.key.toLocaleLowerCase()
      clearTimeout(searchTimer)
      searchTimer = setTimeout(() => { search = '' }, 500)
      const labels = items.map((item, index) => ({
        disabled: options[index].disabled,
        label: 'type' in item ? '' : menuNode?.querySelector<HTMLElement>(`[data-menu-index="${index}"]`)?.textContent ?? '',
      }))
      let match = typeaheadIndex(labels, search, activeIndex)
      if (match < 0 && search.length > 1) {
        search = event.key.toLocaleLowerCase()
        match = typeaheadIndex(labels, search, activeIndex)
      }
      if (match >= 0) { event.preventDefault(); focusItem(match) }
      return
    }
    else return
    event.preventDefault()
    focusItem(next)
  }

  $effect(() => {
    if (!open) return
    const first = edgeEnabledIndex(options, 'first')
    activeIndex = first
    let live = true
    let stopObserving = () => {}
    void tick().then(() => {
      if (!live) return
      updatePosition()
      focusItem(first)
      stopObserving = observeOverlaySize(triggerNode(), menuNode, updatePosition)
    })
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onOpenChange(false)
      triggerNode()?.focus()
    }
    const onPointerdown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && (anchor?.contains(target) || menuNode?.contains(target))) return
      onOpenChange(false)
    }
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('pointerdown', onPointerdown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      live = false
      stopObserving()
      clearTimeout(searchTimer)
      search = ''
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('pointerdown', onPointerdown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  })
</script>

<div bind:this={anchor} class="tint-menu-anchor">
  {#if trigger}
    {@render trigger({ id: `${id}-trigger`, 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': `${id}-menu`, 'data-tint-trigger': '', onclick: () => onOpenChange(!open) })}
  {:else}
    <button id={`${id}-trigger`} type="button" class="tint-button" data-variant="secondary" data-size="md" data-tint-trigger="" aria-haspopup="menu" aria-expanded={open} aria-controls={`${id}-menu`} onclick={() => onOpenChange(!open)}>{label}</button>
  {/if}
</div>

{#if open}
  <Portal>
    <div
      bind:this={menuNode}
      id={`${id}-menu`}
      role="menu"
      tabindex="-1"
      aria-label={label}
      class={['tint-menu', className].filter(Boolean).join(' ')}
      style:top={`${position.top}px`}
      style:left={`${position.left}px`}
      onkeydown={onMenuKeydown}
    >
      {#each items as item, index (item.id)}
        {#if 'type' in item}
          <div role="separator" class="separator"></div>
        {:else}
          <button
            type="button"
            role="menuitem"
            data-menu-index={index}
            data-danger={item.danger || undefined}
            disabled={item.disabled}
            tabindex={activeIndex === index ? 0 : -1}
            onclick={() => selectItem(item)}
          >
            {#if typeof item.label === 'string'}{item.label}{:else}{@render item.label()}{/if}
          </button>
        {/if}
      {/each}
    </div>
  </Portal>
{/if}

<style>
  .tint-menu-anchor { display: inline-flex; }
  .tint-menu { position: fixed; z-index: 1000; min-width: 11rem; max-width: min(22rem, calc(100vw - 1rem)); max-height: min(26rem, calc(100vh - 1rem)); overflow: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: var(--tint-space-1) 0; background: var(--tint-panel); color: var(--tint-ink); box-shadow: 0 12px 24px -6px var(--tint-shadow-color); }
  .tint-menu button[role='menuitem'] { display: block; width: 100%; border: 0; padding: var(--tint-space-2) var(--tint-space-3); background: transparent; color: inherit; font: inherit; font-size: var(--tint-font-size-sm); text-align: left; cursor: default; }
  .tint-menu button[role='menuitem']:is(:hover, :focus-visible) { background: var(--tint-accent-soft); outline: none; }
  .tint-menu button[role='menuitem']:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: calc(var(--tint-focus-width) * -1); }
  .tint-menu button[role='menuitem'][data-danger] { color: var(--tint-danger-ink); }
  .tint-menu button[role='menuitem']:disabled { opacity: 0.5; cursor: not-allowed; }
  .separator { height: 1px; margin: var(--tint-space-1) 0; background: var(--tint-border); }
</style>
