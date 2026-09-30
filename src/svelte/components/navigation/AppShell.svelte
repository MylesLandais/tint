<script lang="ts">
  import { tick } from 'svelte'
  import { sidebarPresentation } from '../../../core/navigation'
  import type { AppShellProps } from './types'

  let {
    brand, header, search, actions, sidebar, breadcrumbs, children,
    sidebarOpen, onSidebarOpenChange, sidebarLabel = 'Navigation',
    class: className, ...rest
  }: AppShellProps = $props()

  let root = $state<HTMLDivElement>()
  let sidebarElement = $state<HTMLElement>()
  let toggleElement = $state<HTMLButtonElement>()
  let containerWidth = $state(0)
  let presentation = $derived(sidebarPresentation(containerWidth, Boolean(sidebar)))
  let wasOverlayOpen = false
  const sidebarId = $props.id()

  $effect(() => {
    const node = root
    if (!node) return
    const measure = () => { containerWidth = node.clientWidth }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  })

  $effect(() => {
    const open = sidebarOpen && presentation === 'overlay'
    const node = sidebarElement
    if (open && !wasOverlayOpen && node) {
      void tick().then(() => {
        if (!sidebarOpen || presentation !== 'overlay') return
        const first = node.querySelector<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
        ;(first ?? node).focus()
      })
    }
    wasOverlayOpen = open
  })

  function requestClose() {
    onSidebarOpenChange(false)
    void tick().then(() => toggleElement?.focus())
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (!sidebarOpen || presentation !== 'overlay' || !sidebarElement) return
    if (event.key === 'Escape') {
      event.preventDefault()
      requestClose()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = Array.from(sidebarElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ))
    if (!focusable.length) {
      event.preventDefault()
      sidebarElement.focus()
      return
    }
    const first = focusable[0]
    const last = focusable.at(-1)!
    const current = document.activeElement
    if (event.shiftKey && (current === first || !sidebarElement.contains(current))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (current === last || !sidebarElement.contains(current))) {
      event.preventDefault()
      first.focus()
    }
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div {...rest} bind:this={root} data-tint-app-shell="" data-sidebar-presentation={presentation} class={['tint-app-shell', className].filter(Boolean).join(' ')}>
  <header class="shell-header">
    {#if sidebar}
      <button
        bind:this={toggleElement}
        type="button"
        class="sidebar-toggle"
        aria-label={`${sidebarOpen ? 'Close' : 'Open'} ${sidebarLabel}`}
        aria-expanded={sidebarOpen}
        aria-controls={sidebarId}
        onclick={() => onSidebarOpenChange(!sidebarOpen)}
      ><span aria-hidden="true">{sidebarOpen ? '×' : '☰'}</span></button>
    {/if}
    {#if brand}<div class="brand">{#if typeof brand === 'string'}{brand}{:else}{@render brand()}{/if}</div>{/if}
    <div class="header-content">{#if typeof header === 'string'}{header}{:else if header}{@render header()}{/if}</div>
    {#if search}<div class="search">{#if typeof search === 'string'}{search}{:else}{@render search()}{/if}</div>{/if}
    {#if actions}<div class="actions">{#if typeof actions === 'string'}{actions}{:else}{@render actions()}{/if}</div>{/if}
  </header>
  <div class:with-sidebar={Boolean(sidebar)} class="shell-layout">
    {#if sidebar}
      {#if sidebarOpen}
        <button type="button" class="backdrop" aria-label={`Close ${sidebarLabel}`} onclick={requestClose}></button>
      {/if}
      <aside
        bind:this={sidebarElement}
        id={sidebarId}
        class="sidebar"
        aria-label={sidebarLabel}
        role={presentation === 'overlay' && sidebarOpen ? 'dialog' : undefined}
        aria-modal={presentation === 'overlay' && sidebarOpen ? 'true' : undefined}
        aria-hidden={presentation === 'overlay' && !sidebarOpen ? 'true' : undefined}
        inert={presentation === 'overlay' && !sidebarOpen}
        data-open={sidebarOpen || undefined}
        tabindex="-1"
      >{#if typeof sidebar === 'string'}{sidebar}{:else}{@render sidebar()}{/if}</aside>
    {/if}
    <main class="main" aria-hidden={presentation === 'overlay' && sidebarOpen ? 'true' : undefined} inert={presentation === 'overlay' && sidebarOpen}>
      {#if breadcrumbs}<div class="breadcrumbs">{#if typeof breadcrumbs === 'string'}{breadcrumbs}{:else}{@render breadcrumbs()}{/if}</div>{/if}
      {@render children?.()}
    </main>
  </div>
</div>

<style>
  .tint-app-shell { container-type: inline-size; position: relative; min-width: 0; min-height: 100dvh; overflow-x: clip; background: var(--tint-bg); color: var(--tint-ink); }
  .shell-header { position: sticky; top: 0; z-index: 30; display: flex; min-height: 3.5rem; align-items: center; gap: var(--tint-space-3); border-bottom: 1px solid var(--tint-border); background: var(--tint-panel); padding: 0 var(--tint-space-4); }
  .sidebar-toggle { display: inline-flex; width: 2.25rem; height: 2.25rem; flex: none; align-items: center; justify-content: center; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: var(--tint-ink); cursor: pointer; font: inherit; font-size: 1.25rem; line-height: 1; }
  .sidebar-toggle:hover { background: var(--tint-surface); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .brand, .actions { flex: none; }
  .header-content { min-width: 0; flex: 1; }
  .search { display: none; min-width: 0; flex: 1; }
  .actions { display: flex; align-items: center; gap: var(--tint-space-2); }
  .shell-layout { display: grid; min-height: calc(100dvh - 3.5rem); grid-template-columns: minmax(0, 1fr); }
  .backdrop { position: absolute; z-index: 20; inset: 3.5rem 0 0; width: 100%; border: 0; background: color-mix(in srgb, var(--tint-ink) 40%, transparent); cursor: pointer; }
  .sidebar { position: absolute; z-index: 21; top: 3.5rem; bottom: 0; left: 0; width: min(18rem, 100%); min-width: 0; overflow: auto; border-right: 1px solid var(--tint-border); background: var(--tint-panel); padding: var(--tint-space-3); transform: translateX(-100%); visibility: hidden; transition: transform var(--tint-motion-base) var(--tint-ease), visibility var(--tint-motion-base); }
  .sidebar[data-open] { transform: translateX(0); visibility: visible; }
  .main { min-width: 0; }
  .breadcrumbs { border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-2) var(--tint-space-4); }
  @container (min-width: 768px) { .search { display: block; } }
  @container (min-width: 1024px) {
    .sidebar-toggle, .backdrop { display: none; }
    .shell-layout.with-sidebar { grid-template-columns: 17rem minmax(0, 1fr); }
    .sidebar { position: static; width: auto; overflow: auto; transform: none; visibility: visible; transition: none; }
  }
  @media (prefers-reduced-motion: reduce) { .sidebar { transition: none; } }
</style>
