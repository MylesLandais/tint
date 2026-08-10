import { useCallback, useState } from 'react'
import {
  InteractiveGraphView,
  demoGraphDocument,
  type GraphCommand,
  type GraphDocument,
  type GraphSelection,
  type GraphViewport,
} from '../../components/graph'
import { CodeBlock } from '../components/CodeBlock'
import { DocsNav } from '../components/DocsNav'

const usageCode = `import {
  InteractiveGraphView,
  demoGraphDocument,
} from 'tint/graph'

export function Example() {
  return (
    <InteractiveGraphView
      document={demoGraphDocument}
      onCommand={(command) => console.log(command)}
    />
  )
}`

export function GraphDoc() {
  const [document, setDocument] = useState<GraphDocument>(demoGraphDocument)
  const [selection, setSelection] = useState<GraphSelection | undefined>()
  const [viewport, setViewport] = useState<GraphViewport | undefined>(
    demoGraphDocument.viewport,
  )
  const [lastCommand, setLastCommand] = useState<GraphCommand | null>(null)
  const [readonly, setReadonly] = useState(false)

  const onCommand = useCallback((command: GraphCommand) => {
    setLastCommand(command)
  }, [])

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <DocsNav current="components/graph" />

        <section className="mb-8 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
            Components
          </p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">
            Graph
          </h1>
          <p className="m-0 text-base leading-7 text-tint-muted">
            Interactive node canvas for domain-neutral graph documents. Spatial
            interaction is powered by a vendored xyflow engine behind an adapter;
            node meaning, scripting, and SQL/PGQ stay outside the view.
          </p>
        </section>

        <section id="preview" className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="m-0 text-lg font-semibold text-tint-ink">Live preview</h2>
            <label className="ml-auto inline-flex items-center gap-2 text-sm text-tint-muted">
              <input
                type="checkbox"
                checked={readonly}
                onChange={(event) => setReadonly(event.target.checked)}
              />
              Read-only
            </label>
            <button
              type="button"
              className="rounded-md border border-tint-border bg-tint-panel px-3 py-1.5 text-sm text-tint-ink"
              onClick={() => {
                setDocument(demoGraphDocument)
                setSelection(undefined)
                setLastCommand(null)
              }}
            >
              Reset fixture
            </button>
          </div>

          <InteractiveGraphView
            document={document}
            readonly={readonly}
            selection={selection}
            onDocumentChange={setDocument}
            onSelectionChange={setSelection}
            onViewportChange={setViewport}
            onCommand={onCommand}
          />

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <StatusCard
              label="Revision"
              value={document.revision}
            />
            <StatusCard
              label="Viewport"
              value={
                viewport
                  ? `${Math.round(viewport.x)}, ${Math.round(viewport.y)} · ${viewport.zoom.toFixed(2)}×`
                  : '—'
              }
            />
            <StatusCard
              label="Last command"
              value={lastCommand?.type ?? '—'}
            />
          </div>
        </section>

        <section id="usage" className="mb-10 max-w-3xl">
          <h2 className="mt-0 mb-3 text-lg font-semibold text-tint-ink">Usage</h2>
          <p className="mb-4 text-sm leading-6 text-tint-muted">
            Pass a canonical <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">GraphDocument</code>.
            Optional <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">onCommand</code> receives
            selection, viewport, and move events without leaking xyflow types.
          </p>
          <CodeBlock code={usageCode} language="tsx" />
        </section>

        <section id="api" className="max-w-3xl">
          <h2 className="mt-0 mb-3 text-lg font-semibold text-tint-ink">API notes</h2>
          <ul className="m-0 list-disc space-y-2 pl-5 text-sm leading-6 text-tint-muted">
            <li>
              Public import: <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">tint/graph</code>
            </li>
            <li>
              Script nodes show language, <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">sourceRef</code>,
              entrypoint, and permissions — they never execute code in the canvas.
            </li>
            <li>
              Only <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">src/components/graph/adapter/</code>
              may import the vendored xyflow bundle.
            </li>
            <li>
              Persistence and PostgreSQL SQL/PGQ remain host concerns via future
              repository / query service ports.
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-tint-border bg-tint-panel px-3 py-2">
      <p className="m-0 text-[0.68rem] font-semibold tracking-[0.08em] text-tint-muted uppercase">
        {label}
      </p>
      <p className="mt-1 mb-0 truncate font-mono text-sm text-tint-ink">{value}</p>
    </div>
  )
}
