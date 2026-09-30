<script lang="ts">
  import { ComposedModal, ModalBody, ModalHeader, Portal } from 'carbon-components-svelte'
  import { lockDialogScroll } from './scrollLock'
  import type { DialogProps } from './types'

  let {
    open, onOpenChange, title, titleLabel, description, actions, children,
    hideClose = false, placement = 'center', class: className,
    id, dir, lang, tabindex, tabIndex, style,
    'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby, 'aria-description': ariaDescription,
    'aria-roledescription': ariaRoleDescription, ...dataAttributes
  }: DialogProps = $props()
  const descriptionId = $props.id()
  let modalRoot = $state<HTMLDivElement | null>(null)

  function requestClose(event: CustomEvent<{ trigger: string }>) {
    // Carbon dispatches a cancelable event before changing its own open state.
    // Keep the host's `open` prop authoritative.
    event.preventDefault()
    onOpenChange(false)
  }

  $effect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const unlock = lockDialogScroll()
    return () => {
      if (unlock()) queueMicrotask(() => previous?.focus())
    }
  })

  $effect(() => {
    const panel = open ? modalRoot?.querySelector<HTMLElement>('[role="dialog"]') : null
    if (!panel) return
    const attributes: Record<string, unknown> = {
      id, dir, lang, tabindex: tabindex ?? tabIndex, style,
      'aria-label': ariaLabel ?? (typeof title === 'string' ? title : titleLabel),
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby ?? (description ? descriptionId : undefined),
      'aria-description': ariaDescription,
      'aria-roledescription': ariaRoleDescription,
    }
    for (const [name, value] of Object.entries(dataAttributes)) {
      if (name.startsWith('data-')) attributes[name] = value
    }
    const previous = new Map<string, string | null>()
    const applied = new Map<string, string>()
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined || value === null) continue
      const stringValue = String(value)
      previous.set(name, panel.getAttribute(name))
      applied.set(name, stringValue)
      panel.setAttribute(name, stringValue)
    }
    return () => {
      for (const [name, value] of previous) {
        if (panel.getAttribute(name) !== applied.get(name)) continue
        if (value === null) panel.removeAttribute(name)
        else panel.setAttribute(name, value)
      }
    }
  })
</script>

{#if open}
  <Portal>
    <ComposedModal
      {open}
      bind:ref={modalRoot}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : titleLabel)}
      class="tint-dialog-root"
      data-placement={placement}
      containerClass={['tint-dialog-panel', className].filter(Boolean).join(' ')}
      on:close={requestClose}
    >
      <ModalHeader
        title={typeof title === 'string' ? title : ''}
        hideCloseButton={hideClose}
        iconDescription="Close"
      >
        {#if typeof title !== 'string'}<h2 class="rich-title">{@render title()}</h2>{/if}
        {#if description}
          <p id={descriptionId} class="description">{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}</p>
        {/if}
      </ModalHeader>
      <ModalBody>{@render children?.()}</ModalBody>
      {#if actions}<footer class="actions">{@render actions()}</footer>{/if}
    </ComposedModal>
  </Portal>
{/if}

<style>
  :global(.tint-dialog-root) { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; padding: var(--tint-space-4); background: color-mix(in srgb, var(--tint-ink) 40%, transparent); }
  :global(.tint-dialog-root[data-placement='right']) { justify-content: flex-end; padding: 0; }
  :global(.tint-dialog-panel) { display: flex; width: 100%; max-width: 32rem; max-height: min(90dvh, 40rem); flex-direction: column; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); box-shadow: 0 12px 24px -6px var(--tint-shadow-color); outline: none; }
  :global(.tint-dialog-root[data-placement='right'] .tint-dialog-panel) { width: min(95vw, 32rem); height: 100dvh; max-height: 100dvh; border-radius: 0; }
  :global(.tint-dialog-panel .bx--modal-header) { position: relative; display: flex; flex-direction: column; gap: var(--tint-space-1); border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-3) var(--tint-space-4); }
  :global(.tint-dialog-panel .bx--modal-header__heading) { margin: 0; padding-right: 2rem; font-size: var(--tint-font-size-md); font-weight: 600; }
  :global(.tint-dialog-panel .bx--modal-close) { position: absolute; top: var(--tint-space-2); right: var(--tint-space-2); display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: var(--tint-muted); cursor: pointer; }
  :global(.tint-dialog-panel .bx--modal-close:hover) { background: var(--tint-surface); color: var(--tint-ink); }
  :global(.tint-dialog-panel .bx--modal-close:focus-visible) { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  :global(.tint-dialog-panel .bx--modal-content) { min-height: 0; flex: 1; overflow: auto; padding: var(--tint-space-3) var(--tint-space-4); font-size: var(--tint-font-size-sm); }
  .rich-title { margin: 0; padding-right: 2rem; font-size: var(--tint-font-size-md); font-weight: 600; }
  .description { margin: 0; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  .actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tint-space-2); border-top: 1px solid var(--tint-border); padding: var(--tint-space-3) var(--tint-space-4); }
</style>
