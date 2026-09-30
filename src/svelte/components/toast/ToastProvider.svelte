<script lang="ts">
  import { Portal, ToastNotification } from 'carbon-components-svelte'
  import { onDestroy, setContext, type Snippet } from 'svelte'
  import {
    addToast, createToastRecord, removeToast, visibleToasts,
    type ToastInput, type ToastRecord, type ToastTone,
  } from '../../../core/toast/model'
  import { toastContextKey, type ToastController } from './context'

  type Props = { children?: Snippet; limit?: number }
  type Timer = { remaining: number; startedAt: number | null; handle?: ReturnType<typeof setTimeout> }

  let { children, limit = 3 }: Props = $props()
  let records = $state<ToastRecord[]>([])
  let viewport = $state<HTMLDivElement>()
  let hovering = false
  let focused = false
  let windowFocused = true
  let paused = false
  let nextId = 0
  const timers = new Map<string, Timer>()
  const visible = $derived(visibleToasts(records, limit))

  function dismiss(id: string) {
    const timer = timers.get(id)
    if (timer?.handle !== undefined) clearTimeout(timer.handle)
    timers.delete(id)
    records = removeToast(records, id)
    if (records.length === 0) {
      hovering = false
      focused = false
      syncTimers()
    }
  }

  function startTimer(id: string, timer: Timer) {
    if (timer.remaining <= 0) { dismiss(id); return }
    timer.startedAt = Date.now()
    timer.handle = setTimeout(() => dismiss(id), timer.remaining)
  }

  function syncTimers() {
    const shouldPause = hovering || focused || !windowFocused
    if (paused === shouldPause) return
    paused = shouldPause
    for (const [id, timer] of timers) {
      if (paused) {
        if (timer.handle !== undefined) clearTimeout(timer.handle)
        timer.handle = undefined
        if (timer.startedAt !== null) timer.remaining -= Date.now() - timer.startedAt
        timer.startedAt = null
      } else {
        startTimer(id, timer)
      }
    }
  }

  function push(input: ToastInput): string {
    const id = `tint-toast-${++nextId}`
    const record = createToastRecord(id, input)
    records = addToast(records, record)
    if (record.durationMs > 0) {
      const timer: Timer = { remaining: record.durationMs, startedAt: null }
      timers.set(id, timer)
      if (!paused) startTimer(id, timer)
    }
    return id
  }

  const controller: ToastController = { push, dismiss }
  setContext(toastContextKey, controller)

  function onFocusOut() {
    queueMicrotask(() => {
      focused = !!viewport?.contains(document.activeElement)
      syncTimers()
    })
  }

  onDestroy(() => {
    for (const timer of timers.values()) {
      if (timer.handle !== undefined) clearTimeout(timer.handle)
    }
    timers.clear()
  })

  const kindByTone: Record<ToastTone, 'info' | 'success' | 'warning' | 'error'> = {
    neutral: 'info', info: 'info', success: 'success', warning: 'warning', danger: 'error',
  }
</script>

<svelte:window onblur={() => { windowFocused = false; syncTimers() }} onfocus={() => { windowFocused = true; syncTimers() }} />

{@render children?.()}

<Portal>
  <div
    bind:this={viewport}
    class="tint-toast-viewport"
    role="region"
    aria-label="Notifications"
    onpointerenter={() => { hovering = true; syncTimers() }}
    onpointerleave={() => { hovering = false; syncTimers() }}
    onfocusin={() => { focused = true; syncTimers() }}
    onfocusout={onFocusOut}
  >
    {#each visible as toast (toast.id)}
      <ToastNotification
        class="tint-toast"
        data-tone={toast.tone}
        data-toast-id={toast.id}
        kind={kindByTone[toast.tone]}
        title={toast.title}
        subtitle={toast.description ?? ''}
        timeout={0}
        role={toast.tone === 'danger' ? 'alert' : 'status'}
        closeButtonDescription="Dismiss"
        on:close={() => dismiss(toast.id)}
      />
    {/each}
  </div>
</Portal>

<style>
  :global(.tint-toast-viewport) { position: fixed; right: var(--tint-space-4); bottom: var(--tint-space-4); z-index: 1200; display: flex; width: min(20rem, calc(100vw - 2rem)); max-height: calc(100dvh - 2rem); flex-direction: column; gap: var(--tint-space-2); pointer-events: none; }
  :global(.tint-toast) { display: flex; align-items: flex-start; gap: var(--tint-space-2); width: 100%; min-width: 0; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); padding: var(--tint-space-2) var(--tint-space-3); background: var(--tint-panel); color: var(--tint-ink); box-shadow: 0 12px 24px -6px var(--tint-shadow-color); pointer-events: auto; }
  :global(.tint-toast[data-tone='success']) { border-color: color-mix(in srgb, var(--tint-success) 40%, transparent); }
  :global(.tint-toast[data-tone='warning']) { border-color: color-mix(in srgb, var(--tint-warning) 40%, transparent); }
  :global(.tint-toast[data-tone='danger']) { border-color: color-mix(in srgb, var(--tint-danger) 40%, transparent); }
  :global(.tint-toast[data-tone='info']) { border-color: color-mix(in srgb, var(--tint-info) 40%, transparent); }
  :global(.tint-toast .bx--toast-notification__icon) { display: none; }
  :global(.tint-toast .bx--toast-notification__details) { min-width: 0; flex: 1; }
  :global(.tint-toast .bx--toast-notification__title) { margin: 0; font-size: var(--tint-font-size-sm); font-weight: 600; line-height: 1.35; }
  :global(.tint-toast .bx--toast-notification__subtitle) { margin-top: var(--tint-space-1); color: var(--tint-muted); font-size: var(--tint-font-size-xs); line-height: 1.4; }
  :global(.tint-toast .bx--toast-notification__close-button) { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; border: 0; border-radius: var(--tint-radius-sm); padding: 0; background: transparent; color: var(--tint-muted); cursor: pointer; }
  :global(.tint-toast .bx--toast-notification__close-button:hover) { color: var(--tint-ink); background: var(--tint-surface); }
  :global(.tint-toast .bx--toast-notification__close-button:focus-visible) { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
