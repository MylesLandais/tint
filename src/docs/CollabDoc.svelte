<script lang="ts">
  import { onMount } from 'svelte'
  import { createCollabSession, type CollabSession } from '../core/collab'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let left = $state('')
  let right = $state('')
  let leftSession: CollabSession | undefined
  let rightSession: CollabSession | undefined

  onMount(() => {
    const room = `tint:docs:collab:${crypto.randomUUID()}`
    const config = { room, network: { kind: 'broadcast' as const, channel: room } }
    leftSession = createCollabSession(config)
    rightSession = createCollabSession(config)
    const syncLeft = () => { left = leftSession?.fragment.toString() ?? '' }
    const syncRight = () => { right = rightSession?.fragment.toString() ?? '' }
    leftSession.fragment.observe(syncLeft)
    rightSession.fragment.observe(syncRight)
    syncLeft()
    syncRight()
    return () => {
      leftSession?.fragment.unobserve(syncLeft)
      rightSession?.fragment.unobserve(syncRight)
      leftSession?.destroy()
      rightSession?.destroy()
      leftSession = undefined
      rightSession = undefined
    }
  })

  function update(session: CollabSession | undefined, value: string): void {
    if (!session) return
    const current = session.fragment.toString()
    if (current === value) return
    session.doc.transact(() => {
      session.fragment.delete(0, current.length)
      if (value) session.fragment.insert(0, value)
    })
  }

  const api: ApiRow[] = [
    { prop: 'createCollabSession(config)', type: 'CollabSession', description: 'Owns the Yjs document, text fragment, optional awareness, and network provider.' },
    { prop: 'config.room / fragment', type: 'string', description: 'Stable room key and optional shared text name.' },
    { prop: 'config.network', type: 'none | broadcast | websocket', description: 'Host-selected transport. WebSocket creation is injected by the host.' },
    { prop: 'config.awareness', type: 'boolean', description: 'Ephemeral presence; excluded from the document snapshot.' },
    { prop: 'session.destroy()', type: 'void', description: 'Disposes the transport, awareness, and document when its host scope ends.' },
  ]
  const usage = `import { createCollabSession } from '@nebula/tint/collab'

const session = createCollabSession({
  room: 'workspace:42:note:7',
  network: { kind: 'broadcast' },
})
const sync = () => { text = session.fragment.toString() }
session.fragment.observe(sync)

// On host teardown:
session.fragment.unobserve(sync)
session.destroy()`
</script>

<DocPage title="Collaboration" description="Two independent Yjs sessions share text through the plain TypeScript broadcast provider. The Svelte view owns only text input and subscribes to fragment changes; the host owns document and transport lifetimes." importPath="@nebula/tint/collab" {usage} {api} accessibility="Each editor has a visible label and native multiline text input. Remote updates appear as ordinary text, without moving focus or turning presence color into the only state signal.">
  <div class="collab-demo">
    <label>Editor A<textarea value={left} oninput={(event) => update(leftSession, event.currentTarget.value)} spellcheck="false"></textarea></label>
    <label>Editor B<textarea value={right} oninput={(event) => update(rightSession, event.currentTarget.value)} spellcheck="false"></textarea></label>
  </div>
</DocPage>

<style>
  .collab-demo { display: grid; gap: 1rem; }
  label { display: grid; gap: .5rem; color: var(--tint-ink); font-size: .85rem; font-weight: 600; }
  textarea { box-sizing: border-box; min-height: 9rem; width: 100%; resize: vertical; border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-sm); background: var(--tint-surface); color: var(--tint-ink); padding: .75rem; font: inherit; font-weight: 400; }
  textarea:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  @container (min-width: 700px) { .collab-demo { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
