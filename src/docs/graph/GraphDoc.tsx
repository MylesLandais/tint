import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  InteractiveGraphView,
  createMockI2VRun,
  demoGraphDocument,
  flattenValidationIssues,
  loadComfyLtx23WithMockDiagnostics,
  viewportForNode,
  type GraphCommand,
  type GraphDocument,
  type GraphSelection,
  type GraphViewport,
  type MockI2VRunSnapshot,
  type NodeRuntimeSummary,
  type ValidationIssue,
} from '../../components/graph'
import { CodeBlock } from '../components/CodeBlock'
import { DocsNav } from '../components/DocsNav'

const usageCode = `import {
  InteractiveGraphView,
  createMockI2VRun,
  loadComfyLtx23WithMockDiagnostics,
} from 'tint/graph'

const { document, validationByNodeId } = loadComfyLtx23WithMockDiagnostics()
const run = createMockI2VRun(document, {
  onUpdate: (snapshot) => setRuntimeByNodeId(snapshot.runtimeByNodeId),
})
run.start() // mock image→video pass; canvas stays presentation-only`

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
  const [followViewport, setFollowViewport] = useState<GraphViewport | undefined>()
  const [lastCommand, setLastCommand] = useState<GraphCommand | null>(null)
  const [readonly, setReadonly] = useState(false)
  const [runtimeByNodeId, setRuntimeByNodeId] = useState<
    ReadonlyMap<string, NodeRuntimeSummary>
  >(new Map())
  const [runSnapshot, setRunSnapshot] = useState<MockI2VRunSnapshot | null>(null)
  const [followRun, setFollowRun] = useState(true)
  const followRunRef = useRef(followRun)
  followRunRef.current = followRun
  const runRef = useRef<ReturnType<typeof createMockI2VRun> | null>(null)

  const allIssues = useMemo(
    () => flattenValidationIssues(validationByNodeId),
    [validationByNodeId],
  )
  const errorIssues = allIssues.filter((issue) => issue.severity === 'error')
  const warnIssues = allIssues.filter((issue) => issue.severity === 'warning')
  const runActive = runSnapshot?.phase === 'running'

  const stopMockRun = useCallback(() => {
    runRef.current?.stop()
    runRef.current = null
    setRunSnapshot(null)
    setRuntimeByNodeId(new Map())
    setFollowViewport(undefined)
  }, [])

  const startMockI2VRun = useCallback(() => {
    stopMockRun()
    const controller = createMockI2VRun(document, {
      intervalMs: 520,
      onUpdate: (snapshot) => {
        setRunSnapshot(snapshot)
        setRuntimeByNodeId(snapshot.runtimeByNodeId)
        if (followRunRef.current && snapshot.current) {
          const next = viewportForNode(document, snapshot.current.nodeId)
          if (next) setFollowViewport(next)
        }
        if (snapshot.phase === 'completed' || snapshot.phase === 'failed') {
          runRef.current = null
        }
      },
    })
    runRef.current = controller
    controller.start()
  }, [document, stopMockRun])

  useEffect(() => () => {
    runRef.current?.stop()
    runRef.current = null
  }, [])

  const onCommand = useCallback((command: GraphCommand) => {
    if (command.type === 'viewport.set') return
    setLastCommand((previous) => {
      if (
        command.type === 'selection.replace' &&
        (previous?.type === 'node.move' || previous?.type === 'node.configure')
      ) {
        return previous
      }
      return command
    })
  }, [])

  const switchMode = (next: DemoMode) => {
    stopMockRun()
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
            parsed ComfyUI workflows. Edit prompts and latent size on the node, mock
            an image→video pass, or fullscreen the graph view from the canvas toolbar.
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
              className="mb-3 grid gap-2 rounded-xl border border-tint-border bg-tint-panel p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(16rem,20rem)]"
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
              <div className="grid gap-2 self-center">
                <p className="m-0 text-xs leading-5 text-tint-muted">
                  Mock a Comfy image→video pass to see idle → running → done on
                  Reference image, latent, sampler, and output nodes.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="comfy-mock-i2v-run"
                    className="rounded-md border border-tint-border-strong bg-tint-accent px-3 py-1.5 text-sm font-medium text-tint-on-accent disabled:opacity-50"
                    disabled={runActive}
                    onClick={startMockI2VRun}
                  >
                    {runActive ? 'Running…' : 'Mock I2V run'}
                  </button>
                  <button
                    type="button"
                    data-testid="comfy-mock-i2v-stop"
                    className="rounded-md border border-tint-border bg-tint-surface px-3 py-1.5 text-sm text-tint-ink disabled:opacity-40"
                    disabled={!runActive && !runSnapshot}
                    onClick={stopMockRun}
                  >
                    Stop
                  </button>
                  <label className="inline-flex items-center gap-1.5 text-xs text-tint-muted">
                    <input
                      type="checkbox"
                      checked={followRun}
                      onChange={(event) => setFollowRun(event.target.checked)}
                    />
                    Follow camera
                  </label>
                </div>
              </div>
            </aside>
          ) : null}

          {runSnapshot ? (
            <div
              data-testid="comfy-mock-i2v-progress"
              className="mb-3 rounded-xl border border-tint-border bg-tint-panel px-3 py-2"
            >
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                <p className="m-0 text-sm text-tint-ink">{runSnapshot.detail}</p>
                <p className="m-0 font-mono text-xs text-tint-muted">
                  {Math.round(runSnapshot.progress * 100)}% · {runSnapshot.phase}
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-tint-surface">
                <div
                  className="h-full bg-tint-accent transition-[width] duration-300"
                  style={{ width: `${Math.round(runSnapshot.progress * 100)}%` }}
                />
              </div>
            </div>
          ) : null}

          <InteractiveGraphView
            document={document}
            readonly={readonly}
            selection={selection}
            validationByNodeId={validationByNodeId}
            runtimeByNodeId={runtimeByNodeId}
            viewport={followViewport}
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
            Pass <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">runtimeByNodeId</code>{' '}
            for read-only execution chrome — the canvas never talks to Comfy.
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
              <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">createMockI2VRun</code> walks an
              image→video-ish queue and emits <code className="rounded bg-tint-surface px-1 py-0.5 text-[0.85em]">NodeRuntimeSummary</code>{' '}
              maps. Missing custom nodes (e.g. TextGenerateLTX2Prompt) mark as failed then continue.
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
