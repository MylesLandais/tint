import { useEffect, useId, useRef, useState } from 'react'
import { createCollabSession, type CollabSession } from '../../components/collab'
import { CodeBlock } from '../components/CodeBlock'
import { DocsNav } from '../components/DocsNav'

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
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <DocsNav current="components/collab" />

        <section className="mb-8 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
            Components
          </p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">
            Collab
          </h1>
          <p className="m-0 text-base leading-7 text-tint-muted">
            Host-owned <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">CollabConfig</code>
            {' '}creates a Yjs document, an optional awareness map, and meshable providers.
            These two textareas share one room over BroadcastChannel — no Quill, no public
            demo websocket. TipTap / y-prosemirror binding comes later.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <CollabPane label="Peer A" room={room} />
          <CollabPane label="Peer B" room={room} />
        </section>

        <section className="mt-14 max-w-3xl">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">
            Usage
          </h2>
          <p className="mb-4 text-sm leading-6 text-tint-muted">
            Websocket sync is an injected constructor so tint never depends on y-websocket.
            Persistence (<code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">persist</code>)
            is reserved; v1 ignores it.
          </p>
          <CodeBlock code={usageCode} />
        </section>
      </div>
    </main>
  )
}
