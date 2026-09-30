<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import { mobileNavigationForWidth } from '../../../core/shell/layout'
  import Dialog from '../dialog/Dialog.svelte'
  import NavRail from './NavRail.svelte'
  import type { NavRailItem } from './types'

  type Props = ComponentProps<typeof NavRail> & {
    mobileOpen: boolean
    onMobileOpenChange: (open: boolean) => void
    mobileLabel?: string
  }
  let {
    mobileOpen, onMobileOpenChange, mobileLabel = 'Navigation',
    header, onLinkClick, ...railProps
  }: Props = $props()
  let root = $state<HTMLDivElement | null>(null)
  let mobile = $state(false)

  $effect(() => {
    if (!root || typeof ResizeObserver === 'undefined') return
    const host = root.closest('[data-tint-app-shell]') ?? root
    const observer = new ResizeObserver(([entry]) => {
      mobile = mobileNavigationForWidth(entry.contentRect.width)
      if (!mobile && mobileOpen) onMobileOpenChange(false)
    })
    observer.observe(host)
    return () => observer.disconnect()
  })

  function mobileLinkClick(event: MouseEvent, item: NavRailItem) {
    onLinkClick?.(event, item)
    if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      onMobileOpenChange(false)
    }
  }
</script>

<div bind:this={root} data-tint-responsive-nav-rail>
  {#if mobile}
    <div data-tint-mobile-navigation>
      <div class="flex min-h-12 items-center justify-between border-b border-tint-border bg-tint-panel px-4">
        {@render header?.()}
        <button type="button" aria-expanded={mobileOpen} aria-haspopup="dialog" onclick={() => onMobileOpenChange(true)}>Menu</button>
      </div>
      <Dialog open={mobileOpen} onOpenChange={onMobileOpenChange} title={mobileLabel} placement="right">
        <NavRail {...railProps} collapsed={false} onCollapsedChange={undefined} onLinkClick={mobileLinkClick} />
      </Dialog>
    </div>
  {:else}
    <NavRail {...railProps} {header} {onLinkClick} />
  {/if}
</div>
