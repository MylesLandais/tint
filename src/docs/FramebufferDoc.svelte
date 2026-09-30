<script lang="ts">
  import { onMount } from 'svelte'
  import { fetchWorkbenchSessions, workbenchFrameUrl } from '../core/framebuffer'
  import { Framebuffer, WorkspaceLayout } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let sessions = $state<string[]>([])
  let account = $state('')
  let error = $state('')
  let streamStatus = $state('')
  const frameUrl = $derived(account ? workbenchFrameUrl(location.href, account) : '')

  onMount(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    async function refresh() {
      try {
        const ids = await fetchWorkbenchSessions(controller.signal)
        if (controller.signal.aborted) return
        sessions = ids
        account = ids.includes(account) ? account : ids[0] ?? ''
        error = ''
      } catch (cause) {
        if (!controller.signal.aborted) error = cause instanceof Error ? cause.message : String(cause)
      }
      if (!controller.signal.aborted) timer = setTimeout(refresh, 5000)
    }
    void refresh()
    return () => { controller.abort(); if (timer) clearTimeout(timer) }
  })

  function onTabKey(event: KeyboardEvent, index: number) {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % sessions.length
    else if (event.key === 'ArrowLeft') next = (index + sessions.length - 1) % sessions.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = sessions.length - 1
    else return
    event.preventDefault()
    account = sessions[next]
    ;(event.currentTarget as HTMLButtonElement | null)?.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  const api: ApiRow[] = [
    { prop: 'url', type: 'string', description: 'WebSocket endpoint for account-bound frame envelopes.' },
    { prop: 'accountId', type: 'string', description: 'Expected account ID; mismatched frames are rejected.' },
    { prop: 'encoding / mode', type: "'rgba' | 'png' / FrameMode", description: 'Frame encoding and server request mode.' },
    { prop: 'onStatus / showStatus', type: '(status) => void / boolean', description: 'Stream state callback and optional visible status.' },
    { prop: 'canvasProps', type: 'HTMLCanvasAttributes', description: 'Canvas label and native attributes.' },
  ]
  const usage = `import { Framebuffer } from '@nebula/tint/framebuffer'

<Framebuffer url={frameSocketUrl} accountId={selectedAccount}
  encoding="rgba" onStatus={(status) => connectionStatus = status}
  canvasProps={{ 'aria-label': 'Game frame' }} />`
</script>

<DocPage title="Framebuffer" description="Account-bound game frames rendered by the shared TypeScript stream. This live preview discovers active workbench sessions when a local game runtime is available." importPath="@nebula/tint/framebuffer" {usage} {api} accessibility="Session tabs support arrow keys, Home, and End. The canvas has an accessible name and connection state is announced through a status region. Frame validation rejects the wrong account, mismatched session, and malformed pixel buffers.">
  <div class="frame-workspace"><WorkspaceLayout theme="pokeforce">
    {#snippet toolbar()}
      <div class="session-tabs" role="tablist" aria-label="Game clients">
        {#each sessions as id, index (id)}
          <button type="button" role="tab" aria-selected={id === account} aria-controls="pokeforce-session-view" tabindex={id === account ? 0 : -1} onclick={() => account = id} onkeydown={(event) => onTabKey(event, index)}>{id}</button>
        {/each}
      </div>
    {/snippet}
    {#snippet primary()}
      <div id="pokeforce-session-view" role="tabpanel" aria-label={account || 'Game session'} tabindex="0" class="frame-area">
        {#if account}
          {#key account}
            <Framebuffer accountId={account} url={frameUrl} showStatus={false} onStatus={(status) => streamStatus = status} />
          {/key}
        {:else}
          <p>Waiting for connected game clients…</p>
        {/if}
      </div>
    {/snippet}
  </WorkspaceLayout></div>
  {#if account}<p role="status">{account} · {streamStatus}</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
</DocPage>

<style>
  .frame-workspace { min-height: 18rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); }
  .session-tabs { display: flex; gap: .25rem; overflow-x: auto; padding: .5rem; }
  .session-tabs button { flex: none; padding: .5rem .75rem; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: var(--tint-ink); font: inherit; cursor: pointer; }
  .session-tabs button[aria-selected="true"] { background: var(--tint-accent); color: var(--tint-on-accent); }
  .session-tabs button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .frame-area { display: grid; place-items: center; width: 100%; min-height: 16rem; aspect-ratio: 16 / 9; background: var(--tint-surface); }
  .frame-area p { color: var(--tint-muted); }
  p[role="status"], p[role="alert"] { margin: .65rem 0 0; color: var(--tint-muted); font-size: .85rem; }
</style>
