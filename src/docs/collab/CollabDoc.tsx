import { useEffect, useId, useRef, useState } from 'react'
import { createCollabSession, type CollabSession } from '../../components/collab'
import { CodeBlock } from '../components/CodeBlock'
import { PropsTable } from '../components/PropsTable'
import {
  DocsCallout,
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from '../components/DocsPage'

const previewDemoCode = `const left = createCollabSession({
  room: 'workspace:demo:note:crate',
  network: { kind: 'broadcast' },
})
const right = createCollabSession({
  room: 'workspace:demo:note:crate',
  network: { kind: 'broadcast' },
})

left.fragment.insert(0, 'hello')
// right.fragment.toString() === 'hello'`

const usageCode = `import { createCollabSession } from 'tint/collab'

const left = createCollabSession({
  room: 'workspace:demo:note:crate',
  network: { kind: 'broadcast' },
})
const right = createCollabSession({
  room: 'workspace:demo:note:crate',
  network: { kind: 'broadcast' },
})

left.fragment.insert(0, 'hello')
// right.fragment.toString() === 'hello'
`

const configSignature = `type CollabNetwork =
  | { kind: 'none' }
  | { kind: 'broadcast'; channel?: string }
  | {
      kind: 'websocket'
      url: string
      room?: string
      createProvider: CreateWebsocketProvider
    }

type CollabConfig = {
  room: string
  fragment?: string
  persist?: boolean
  awareness?: boolean
  network?: CollabNetwork
}`

const sessionSignature = `type CollabSession = {
  doc: Y.Doc
  fragment: Y.Text
  awareness: TintAwareness | null
  destroy: () => void
}`

const configProps = [
  {
    name: 'room',
    type: 'string',
    required: true,
    description: 'Yjs room name / BroadcastChannel key. Prefer `workspace:{id}:note:{id}`.',
  },
  {
    name: 'fragment',
    type: 'string',
    defaultValue: "'tint'",
    description: 'Shared type name on the document.',
  },
  {
    name: 'persist',
    type: 'boolean',
    badge: 'reserved',
    description: 'Persistence provider (y-indexeddb). v1 ignores this — tint has no IndexedDB vendor yet.',
  },
  {
    name: 'awareness',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Ephemeral presence. Never written into the CRDT snapshot.',
  },
  {
    name: 'network',
    type: 'CollabNetwork',
    defaultValue: "{ kind: 'none' }",
    description: "Transport: 'none', 'broadcast' (optional channel), or 'websocket' with an injected createProvider. Defaults to none so tests stay deterministic.",
  },
]

const sessionProps = [
  {
    name: 'doc',
    type: 'Y.Doc',
    description: 'The underlying Yjs document.',
  },
  {
    name: 'fragment',
    type: 'Y.Text',
    description: 'The shared text type named by the fragment option.',
  },
  {
    name: 'awareness',
    type: 'TintAwareness | null',
    description: 'Presence map, null when the awareness option is false.',
  },
  {
    name: 'destroy',
    type: '() => void',
    description: 'Tears down providers and the document.',
  },
]

function CollabPane({
  label,
  room,
}: {
  label: string
  room: string
}) {
  const id = useId()
  const [value, setValue] = useState('')
  const sessionRef = useRef<CollabSession | null>(null)
  const applyingRemote = useRef(false)

  useEffect(() => {
    const session = createCollabSession({
      room,
      network: { kind: 'broadcast', channel: room },
    })
    sessionRef.current = session
    const sync = () => {
      applyingRemote.current = true
      setValue(session.fragment.toString())
      applyingRemote.current = false
    }
    sync()
    session.fragment.observe(sync)
    return () => {
      session.fragment.unobserve(sync)
      session.destroy()
      sessionRef.current = null
    }
  }, [room])

  const onChange = (next: string) => {
    const session = sessionRef.current
    if (!session || applyingRemote.current) return
    const current = session.fragment.toString()
    if (next === current) return
    session.doc.transact(() => {
      session.fragment.delete(0, current.length)
      if (next.length) session.fragment.insert(0, next)
    })
    setValue(next)
  }

  return (
    <label className="grid min-h-48 gap-2 rounded-xl border border-tint-border bg-tint-panel p-3">
      <span className="text-xs font-semibold tracking-[0.08em] text-tint-muted uppercase">
        {label}
      </span>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className="min-h-40 resize-y rounded-lg border border-tint-border bg-tint-surface px-3 py-2 font-mono text-sm text-tint-ink outline-none focus:border-tint-accent focus:ring-3 focus:ring-tint-accent-soft"
      />
    </label>
  )
}

export function CollabDoc() {
  const room = 'workspace:tint-docs:note:collab'

  return (
    <DocsPage
      route="components/collab"
      title="Collab"
      intro={
        <>
          Host-owned{' '}
          <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">CollabConfig</code>{' '}
          creates a Yjs document, an optional awareness map, and meshable providers.
          These two textareas share one room over BroadcastChannel — no Quill, no public
          demo websocket. TipTap / y-prosemirror binding comes later.
        </>
      }
    >
      <DocsSection
        id="preview"
        title="Preview"
        description="Two independent sessions joined to the same room. Type in either textarea and the other updates through the shared Yjs fragment."
      >
        <DocsDemo code={previewDemoCode}>
          <div className="grid gap-4 md:grid-cols-2">
            <CollabPane label="Peer A" room={room} />
            <CollabPane label="Peer B" room={room} />
          </div>
        </DocsDemo>
      </DocsSection>

      <DocsSection
        id="usage"
        title="Usage"
        description={
          <>
            Websocket sync is an injected constructor so tint never depends on y-websocket.
            Persistence (<code>persist</code>) is reserved; v1 ignores it.
          </>
        }
      >
        <div className="space-y-6">
          <CodeBlock code={usageCode} />
          <DocsCallout variant="note" title="Bring your own websocket provider">
            The <code>websocket</code> network kind takes a <code>createProvider</code> callback —
            tint ships no y-websocket dependency, so the host constructs and owns the provider.
          </DocsCallout>
        </div>
      </DocsSection>

      <DocsSection id="api" title="API" description="Options accepted by createCollabSession.">
        <div className="space-y-10">
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">
              CollabConfig
            </h3>
            <p className="mb-4 max-w-2xl text-sm text-tint-muted">
              The full prop signature, from the source:
            </p>
            <div className="mb-6">
              <CodeBlock code={configSignature} language="tsx" />
            </div>
            <PropsTable rows={configProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">
              CollabSession
            </h3>
            <p className="mb-4 max-w-2xl text-sm text-tint-muted">
              The value returned by <code>createCollabSession</code> — the full signature,
              from the source:
            </p>
            <div className="mb-6">
              <CodeBlock code={sessionSignature} language="tsx" />
            </div>
            <PropsTable rows={sessionProps} />
          </div>
        </div>
      </DocsSection>

      <DocsFooter />
    </DocsPage>
  )
}
