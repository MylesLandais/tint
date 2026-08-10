import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  InteractiveGraphView,
  demoGraphDocument,
  flattenValidationIssues,
  loadComfyLtx23WithMockDiagnostics,
  type GraphCommand,
  type GraphDocument,
  type GraphSelection,
  type GraphViewport,
  type ValidationIssue,
} from '../../components/graph'
import { CodeBlock } from '../components/CodeBlock'
import { DocsNav } from '../components/DocsNav'

const usageCode = `import {
  InteractiveGraphView,
  loadComfyLtx23WithMockDiagnostics,
} from 'tint/graph'

const { document, validationByNodeId } = loadComfyLtx23WithMockDiagnostics()

<InteractiveGraphView
  document={document}
  validationByNodeId={validationByNodeId}
  onDocumentChange={setDocument}
/>

// Edit prompt / resolution / reference image from the node drawer (Edit).`

type DemoMode = 'comfy' | 'demo'

function loadComfyState() {
  return loadComfyLtx23WithMockDiagnostics()
}

export function GraphDoc() {
  const initialComfy = useMemo(() => loadComfyState(), [])
  const [mode, setMode] = useState<DemoMode>('comfy')
  const [document, setDocument] = useState<GraphDocument>(initialComfy.document)
  const [validationByNodeId, setValidationByNodeId] = useState(
    initialComfy.validationByNodeId,
  )
  const [selection, setSelection] = useState<GraphSelection | undefined>()
  const [viewport, setViewport] = useState<GraphViewport | undefined>()
  const [lastCommand, setLastCommand] = useState<GraphCommand | null>(null)
  const [readonly, setReadonly] = useState(false)

  const allIssues = useMemo(
    () => flattenValidationIssues(validationByNodeId),
    [validationByNodeId],
  )
  const errorIssues = allIssues.filter((issue) => issue.severity === 'error')
  const warnIssues = allIssues.filter((issue) => issue.severity === 'warning')

  const onCommand = useCallback((command: GraphCommand) => {
    if (command.type === 'viewport.set') return
    setLastCommand((previous) => {
      if (command.type === 'selection.replace' && previous?.type === 'node.move') {
        return previous
      }
      return command
    })
  }, [])

  const switchMode = (next: DemoMode) => {
    setMode(next)
    setSelection(undefined)
    setLastCommand(null)
    if (next === 'comfy') {
      const loaded = loadComfyState()
      setDocument(loaded.document)
      setValidationByNodeId(loaded.validationByNodeId)
      setViewport(undefined)
      return
    }
    setDocument(demoGraphDocument)
    setValidationByNodeId(new Map())
    setViewport(demoGraphDocument.viewport)
  }

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
            Interactive node canvas for domain-neutral graph documents — including
            parsed ComfyUI workflows. Edit prompts, latent resolution, and reference
            images from the node drawer; diagnostics stay outside the canvas engine.
          </p>
        </section>

        <section id="preview" className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="m-0 text-lg font-semibold text-tint-ink">Live preview</h2>
            <div className="inline-flex rounded-md border border-tint-border p-0.5 text-sm">
              <ModeButton active={mode === 'comfy'} onClick={() => switchMode('comfy')}>
                Comfy LTX-2.3
              </ModeButton>
              <ModeButton active={mode === 'demo'} onClick={() => switchMode('demo')}>
                Demo graph
              </ModeButton>
            </div>
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
              onClick={() => switchMode(mode)}
            >
              Reset fixture
            </button>
          </div>

          {mode === 'comfy' ? (
            <aside
              data-testid="comfy-diagnostics"
              className="mb-3 grid gap-2 rounded-xl border border-tint-border bg-tint-panel p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(12rem,16rem)]"
            >
              <IssueList
                title={`ERROR (${errorIssues.length})`}
                issues={errorIssues}
                empty="No errors"
                tone="error"
              />
              <IssueList
                title={`WARN (${warnIssues.length})`}
                issues={warnIssues}
                empty="No warnings"
                tone="warning"
              />
              <p className="m-0 self-center text-xs leading-5 text-tint-muted">
                Select a Prompt, Width/Height, Latent, or Reference image node and use{' '}
                <strong>Edit</strong> to draw out in-node controls.
              </p>
            </aside>
          ) : null}

          <InteractiveGraphView
            document={document}
            readonly={readonly}
            selection={selection}
            validationByNodeId={validationByNodeId}
            onDocumentChange={setDocument}
            onSelectionChange={setSelection}
            onViewportChange={setViewport}
            onCommand={onCommand}
          />

          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <StatusCard label="Mode" value={mode === 'comfy' ? 'Comfy LTX-2.3' : 'Demo'} />
            <StatusCard
              label="Graph size"
              value={`${document.nodes.length} nodes · ${document.edges.length} edges`}
              testId="graph-status-size"
            />
            <StatusCard
              label="Revision"
              value={document.revision}
              testId="graph-status-revision"
            />
            <StatusCard
              label="Last command"
              value={lastCommand?.type ?? '—'}
              testId="graph-status-command"
            />
          </div>
          {viewport ? (
            <p className="mt-2 mb-0 text-xs text-tint-muted">
              Viewport {Math.round(viewport.x)}, {Math.round(viewport.y)} ·{' '}
              {viewport.zoom.toFixed(2)}×
            </p>
          ) : null}
        </section>

        <section id="usage" className="mb-10 max-w-3xl">
          <h2 className="mt-0 mb-3 text-lg font-semibold text-tint-ink">Usage</h2>
          <p className="mb-4 text-sm leading-6 text-tint-muted">
            Parse a ComfyUI workflow into{' '}
            <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">GraphDocument</code>.
            Common parameters open from the node itself — prompt text, latent/output
            resolution, and reference-image drop — without leaving the canvas.
          </p>
          <CodeBlock code={usageCode} language="tsx" />
        </section>

        <section id="api" className="max-w-3xl">
          <h2 className="mt-0 mb-3 text-lg font-semibold text-tint-ink">API notes</h2>
          <ul className="m-0 list-disc space-y-2 pl-5 text-sm leading-6 text-tint-muted">
            <li>
              In-node editors use xyflow <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">nodrag</code> /{' '}
              <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">nowheel</code> so typing and dropping
              do not pan the canvas.
            </li>
            <li>
              Prompt → <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">PrimitiveStringMultiline</code>;
              resolution → Width/Height primitives +{' '}
              <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">EmptyLTXVLatentVideo</code>;
              reference image → <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">EmptyImage</code> drop zone.
            </li>
            <li>
              Edits dispatch <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">node.configure</code> and
              update the document through <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">onDocumentChange</code>.
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-sm bg-tint-accent px-3 py-1.5 text-tint-on-accent'
          : 'rounded-sm px-3 py-1.5 text-tint-muted hover:text-tint-ink'
      }
    >
      {children}
    </button>
  )
}

function StatusCard({
  label,
  value,
  testId,
}: {
  label: string
  value: string
  testId?: string
}) {
  return (
    <div
      data-testid={testId}
      className="rounded-lg border border-tint-border bg-tint-panel px-3 py-2"
    >
      <p className="m-0 text-[0.68rem] font-semibold tracking-[0.08em] text-tint-muted uppercase">
        {label}
      </p>
      <p className="mt-1 mb-0 truncate font-mono text-sm text-tint-ink">{value}</p>
    </div>
  )
}

function IssueList({
  title,
  issues,
  empty,
  tone,
}: {
  title: string
  issues: readonly ValidationIssue[]
  empty: string
  tone: 'error' | 'warning'
}) {
  return (
    <div>
      <p className="m-0 mb-1 text-xs font-semibold text-tint-ink">{title}</p>
      {issues.length === 0 ? (
        <p className="m-0 text-xs text-tint-muted">{empty}</p>
      ) : (
        <ul className="m-0 grid list-none gap-1 p-0">
          {issues.map((issue) => (
            <li
              key={`${issue.code}:${issue.message}`}
              data-severity={tone}
              className={
                tone === 'error'
                  ? 'rounded-md bg-tint-danger-soft px-2 py-1.5 text-xs leading-5 text-tint-danger-ink'
                  : 'rounded-md bg-tint-warning-soft px-2 py-1.5 text-xs leading-5 text-tint-warning-ink'
              }
            >
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
