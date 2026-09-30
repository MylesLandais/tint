<script lang="ts">
  import { Portal } from 'carbon-components-svelte'
  import { tick } from 'svelte'
  import { edgeEnabledIndex, nextEnabledIndex, typeaheadIndex } from '../../../core/interaction/navigation'
  import { positionOverlay } from '../../../core/interaction/position'
  import { observeOverlaySize } from '../overlay/observeSize'
  import type { ContextMenuProps } from './types'

  let { open, position: point, onOpenChange, items, class: className, ...rest }: ContextMenuProps = $props()
  let menuNode = $state<HTMLDivElement>()
  let activeIndex = $state(-1)
  let coords = $state({ top: 0, left: 0 })
  let search = $state('')
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  let returnFocus: HTMLElement | null = null
  const options = $derived(items.map((item) => ({ disabled: 'type' in item || item.disabled })))

  function updatePosition() {
    if (!point || !menuNode) return
    const anchor = { top: point.y, right: point.x, bottom: point.y, left: point.x, width: 0, height: 0 }
    coords = positionOverlay(anchor, menuNode.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight }, 'bottom', 0)
  }

  function focusItem(index: number) {
    if (index < 0) return
    activeIndex = index
    menuNode?.querySelector<HTMLElement>(`[data-menu-index="${index}"]`)?.focus()
  }

  function selectItem(item: Exclude<ContextMenuProps['items'][number], { type: 'separator' }>) {
    if (item.disabled) return
    item.onSelect?.()
    onOpenChange(false)
    returnFocus?.focus()
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
    } else return
    event.preventDefault()
    focusItem(next)
  }

  $effect(() => {
    if (!open || !point) return
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const first = edgeEnabledIndex(options, 'first')
    activeIndex = first
    let live = true
    let stopObserving = () => {}
    void tick().then(() => {
      if (!live) return
      updatePosition()
      focusItem(first)
      stopObserving = observeOverlaySize(undefined, menuNode, updatePosition)
    })
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onOpenChange(false)
      returnFocus?.focus()
    }
    const onPointerdown = (event: PointerEvent) => {
      if (event.target instanceof Node && menuNode?.contains(event.target)) return
      onOpenChange(false)
    }
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('pointerdown', onPointerdown)
    window.addEventListener('resize', updatePosition)
    return () => {
      live = false
      clearTimeout(searchTimer)
      search = ''
      stopObserving()
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('pointerdown', onPointerdown)
      window.removeEventListener('resize', updatePosition)
    }
  })
</script>

{#if open && point}
  <Portal>
    <div
      {...rest}
      bind:this={menuNode}
      data-context-menu=""
      role="menu"
      tabindex="-1"
      aria-label="Context menu"
      class={['tint-context-menu', className].filter(Boolean).join(' ')}
      style:top={`${coords.top}px`}
      style:left={`${coords.left}px`}
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
  .tint-context-menu { position: fixed; z-index: 1000; min-width: 11rem; max-width: min(22rem, calc(100vw - 1rem)); max-height: min(26rem, calc(100vh - 1rem)); overflow: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: var(--tint-space-1) 0; background: var(--tint-panel); color: var(--tint-ink); box-shadow: 0 12px 24px -6px var(--tint-shadow-color); outline: none; }
  .tint-context-menu button[role='menuitem'] { display: block; width: 100%; border: 0; padding: var(--tint-space-2) var(--tint-space-3); background: transparent; color: inherit; font: inherit; font-size: var(--tint-font-size-sm); text-align: left; cursor: default; }
  .tint-context-menu button[role='menuitem']:is(:hover, :focus-visible) { background: var(--tint-accent-soft); outline: none; }
  .tint-context-menu button[role='menuitem']:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: calc(var(--tint-focus-width) * -1); }
  .tint-context-menu button[role='menuitem'][data-danger] { color: var(--tint-danger-ink); }
  .tint-context-menu button[role='menuitem'][data-danger]:is(:hover, :focus-visible) { background: var(--tint-danger-soft); }
  .tint-context-menu button[role='menuitem']:disabled { opacity: 0.5; cursor: not-allowed; }
  .separator { height: 1px; margin: var(--tint-space-1) 0; background: var(--tint-border); }
</style>
