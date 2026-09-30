<script lang="ts">
  import { Popover as CarbonPopover, Portal } from 'carbon-components-svelte'
  import { tick, type Snippet } from 'svelte'
  import { positionOverlay } from '../../../core/interaction/position'
  import { observeOverlaySize } from '../overlay/observeSize'
  import type { PopoverContent, PopoverSide, PopoverTriggerProps } from './types'

  type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    trigger?: Snippet<[PopoverTriggerProps]>
    children?: Snippet
    title?: PopoverContent
    description?: PopoverContent
    /** Accessible name when no visible title is supplied. */
    label?: string
    side?: PopoverSide
    class?: string
  }

  let {
    open, onOpenChange, trigger, children, title, description,
    label = 'Popover', side = 'bottom', class: className,
  }: Props = $props()
  const id = $props.id()
  let anchor = $state<HTMLDivElement>()
  let panel = $state<HTMLElement>()
  let position = $state({ top: 0, left: 0 })

  function triggerNode() {
    return anchor?.querySelector<HTMLElement>('[data-tint-trigger]') ?? anchor
  }

  function updatePosition() {
    const node = triggerNode()
    if (!node || !panel) return
    position = positionOverlay(
      node.getBoundingClientRect(), panel.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight }, side,
    )
  }

  function focusPopup() {
    const first = panel?.querySelector<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')
    if (first) first.focus()
    else panel?.focus()
  }

  $effect(() => {
    if (!open) return
    let live = true
    let stopObserving = () => {}
    let tabExitArmed = false
    let tabExitTimer: ReturnType<typeof setTimeout> | undefined
    void tick().then(() => {
      if (!live) return
      updatePosition()
      focusPopup()
      stopObserving = observeOverlaySize(triggerNode(), panel, updatePosition)
    })
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
        triggerNode()?.focus()
      } else if (event.key === 'Tab' && event.target instanceof Node && panel?.contains(event.target)) {
        tabExitArmed = true
        clearTimeout(tabExitTimer)
        tabExitTimer = setTimeout(() => {
          if (tabExitArmed && !panel?.contains(document.activeElement)) onOpenChange(false)
          tabExitArmed = false
        }, 0)
      }
    }
    const onFocusin = (event: FocusEvent) => {
      if (!tabExitArmed) return
      tabExitArmed = false
      if (event.target instanceof Node && !panel?.contains(event.target)) onOpenChange(false)
    }
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('focusin', onFocusin)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      live = false
      stopObserving()
      clearTimeout(tabExitTimer)
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('focusin', onFocusin)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  })

  function onOutside(event: CustomEvent<{ target: HTMLElement }>) {
    const target = event.detail.target
    if (anchor?.contains(target)) return
    onOpenChange(false)
  }
</script>

<div bind:this={anchor} class="tint-popover-anchor">
  {#if trigger}
    {@render trigger({ id: `${id}-trigger`, 'aria-haspopup': 'dialog', 'aria-expanded': open, 'aria-controls': `${id}-popover`, 'data-tint-trigger': '', onclick: () => onOpenChange(!open) })}
  {:else}
    <button id={`${id}-trigger`} type="button" class="tint-button" data-variant="secondary" data-size="md" data-tint-trigger="" aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-popover`} onclick={() => onOpenChange(!open)}>{label}</button>
  {/if}
</div>

{#if open}
  <Portal>
    <CarbonPopover {open} closeOnOutsideClick={false} on:click:outside={onOutside}>
      <div
        bind:this={panel}
        id={`${id}-popover`}
        role="dialog"
        tabindex="-1"
        aria-labelledby={title ? `${id}-title` : undefined}
        aria-describedby={description ? `${id}-description` : undefined}
        aria-label={title ? undefined : label}
        class={['tint-popover-panel', className].filter(Boolean).join(' ')}
        style:top={`${position.top}px`}
        style:left={`${position.left}px`}
      >
        {#if title}
          <h2 id={`${id}-title`} class="title">{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}</h2>
        {/if}
        {#if description}
          <p id={`${id}-description`} class="description">{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}</p>
        {/if}
        {@render children?.()}
      </div>
    </CarbonPopover>
  </Portal>
{/if}

<style>
  .tint-popover-anchor { display: inline-flex; }
  .tint-popover-panel { position: fixed; z-index: 1000; width: max-content; max-width: min(24rem, calc(100vw - 1rem)); max-height: calc(100vh - 1rem); overflow: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); padding: var(--tint-space-3); background: var(--tint-panel); color: var(--tint-ink); box-shadow: 0 12px 24px -6px var(--tint-shadow-color); outline: none; }
  .title { margin: 0; font-size: var(--tint-font-size-sm); font-weight: 600; }
  .description { margin: var(--tint-space-1) 0 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
</style>
