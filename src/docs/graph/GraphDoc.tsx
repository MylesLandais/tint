import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
// The graph ships its stylesheet as `tint/graph/styles.css`, like auth. Hosts
// import it themselves; the component does not pull it in.
import '../../components/graph/graph.css'
import '../../components/form/styles.css'
import { demoGraphDocument } from './fixtures/demoDocument'
import { GraphProjectionsDemo } from './GraphProjectionsDemo'
import { loadComfyLtx23WithMockDiagnostics } from './fixtures/comfy/loadComfyFixture'
import {
  createMockI2VRun,
  viewportForNode,
  type MockI2VRunSnapshot,
} from './mockI2VRun'
import {
  InteractiveGraphView,
  emptySelection,
  flattenValidationIssues,
  type GraphCommand,
  type GraphDocument,
  type GraphSelection,
  type GraphViewport,
  type NodeRuntimeSummary,
  type ValidationIssue,
} from '../../components/graph'
import { CodeBlock } from '../components/CodeBlock'
import {
  DocsCallout,
  DocsDemo,
  DocsFooter,
  DocsPage,
  DocsSection,
} from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'

const usageCode = `import { useState } from 'react'
import {
  InteractiveGraphView,
  applyCommand,
  createDefaultNodeRegistry,
  comfyNodeDefinition,
  parseComfyWorkflow,
} from 'tint/graph'
import 'tint/graph/styles.css'

// ComfyUI is opt-in: the default registry is domain-neutral.
const registry = createDefaultNodeRegistry()
registry.register(comfyNodeDefinition)

export function Workflow({ workflow }) {
  const [document, setDocument] = useState(() => parseComfyWorkflow(workflow))

  return (
    <InteractiveGraphView
      document={document}
      registry={registry}
      onDocumentChange={setDocument}
    />
  )
}

// Or own the reduction yourself — applyCommand is the same function
// the component would have used:
//   onCommand={(command) => store.dispatch(applyCommand(document, command, registry))}
`

const previewDemoCode = `// The host owns the document and feeds the result back in.
const [document, setDocument] = useState(() => parseComfyWorkflow(workflow))

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
/>`

const signatureCode = `export type InteractiveGraphViewProps = {
  document: GraphDocument
  registry?: NodeRegistry
  readonly?: boolean
  selection?: GraphSelection
  validationByNodeId?: NodeValidationMap
  runtimeByNodeId?: ReadonlyMap<string, NodeRuntimeSummary>
  viewport?: GraphViewport
  className?: string
  showInspector?: boolean
  showFullscreenControl?: boolean
  onDocumentChange?: (document: GraphDocument) => void
  onSelectionChange?: (selection: GraphSelection) => void
  onViewportChange?: (viewport: GraphViewport) => void
  onCommand?: (command: GraphCommand) => void
}`

const props = [
  {
    name: 'document',
    type: 'GraphDocument',
    required: true,
    description: 'The graph to render. The component holds no copy of it.',
  },
  {
    name: 'registry',
    type: 'NodeRegistry',
    defaultValue: 'createDefaultNodeRegistry()',
    description:
      'Node kinds and how to draw them. The default is domain-neutral — register comfyNodeDefinition to add ComfyUI nodes.',
  },
  {
    name: 'readonly',
    type: 'boolean',
    defaultValue: 'false',
    description:
      'Disables moving, connecting and deleting. Selection keeps working, so the graph stays inspectable.',
  },
  {
    name: 'selection',
    type: 'GraphSelection',
    description:
      'Controlled selection. Controlled-ness is latched on the first render; clear with emptySelection(), not undefined.',
  },
  {
    name: 'validationByNodeId',
    type: 'NodeValidationMap',
    description: 'Per-node issues. Drives the error and warning chrome on nodes and in the inspector.',
  },
  {
    name: 'runtimeByNodeId',
    type: 'ReadonlyMap<string, NodeRuntimeSummary>',
    description: 'Read-only execution state, if something is running the graph.',
  },
  {
    name: 'viewport',
    type: 'GraphViewport',
    description:
      "Moves the camera; each distinct value is applied once, so the user can pan away afterwards. Distinct from document.viewport, the graph's authored camera.",
  },
  {
    name: 'showInspector',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Renders the side panel listing the current selection.',
  },
  {
    name: 'showFullscreenControl',
    type: 'boolean',
    defaultValue: 'true',
    description:
      'Shows the canvas fullscreen button. Falls back to an in-page theater mode where the platform refuses fullscreen.',
  },
  { name: 'className', type: 'string', description: 'Extra classes for the graph root.' },
  {
    name: 'onCommand',
    type: '(command: GraphCommand) => void',
    description: 'Every user intent, before it is applied. Reduce it yourself with applyCommand if you own a store.',
  },
  {
    name: 'onDocumentChange',
    type: '(document: GraphDocument) => void',
    description:
      'The document a command produced. Return it through `document` for edits to stick — nothing is applied otherwise.',
  },
  {
    name: 'onSelectionChange',
    type: '(selection: GraphSelection) => void',
    description: 'Selection changed, whether controlled or not.',
  },
  {
    name: 'onViewportChange',
    type: '(viewport: GraphViewport) => void',
    description: 'The user panned or zoomed.',
  },
]

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
  const [selection, setSelection] = useState<GraphSelection>(emptySelection)
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
  const previewRef = useRef<HTMLDivElement>(null)

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
          // Measured, not assumed: the camera has to know how big the canvas
          // actually is, or it centres nodes correctly at one breakpoint only.
          const canvas = previewRef.current?.getBoundingClientRect()
          const next = viewportForNode(document, snapshot.current.nodeId, {
            width: canvas?.width ?? 0,
            height: canvas?.height ?? 0,
          })
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
    setSelection(emptySelection())
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
    <DocsPage
      route="components/graph"
      title="Graph"
      intro="An interactive node canvas for graph documents the host owns. It renders nodes and edges, reports what the user did, and hands back the document that results — it never holds document state of its own."
      note={
        <>
          Import <code>tint/graph/styles.css</code> alongside{' '}
          <code>tint/styles.css</code>; the component does not pull its own
          stylesheet in. ComfyUI support is composed in via{' '}
          <code>comfyNodeDefinition</code> rather than shipped in the default
          registry.
        </>
      }
    >
        <DocsSection
          id="preview"
          title="Preview"
          description="Two fixtures, one surface: a ComfyUI LTX-2.3 workflow with mock diagnostics, and a small domain-neutral demo graph. Toggle read-only to see the graph stay inspectable while editing is disabled."
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
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

          <DocsDemo code={previewDemoCode}>
            <div ref={previewRef}>
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
            </div>
          </DocsDemo>

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
        </DocsSection>

        <DocsSection
          id="usage"
          title="Usage"
          description="The host owns the document: pass it in, take the next one out. Nothing is applied behind your back."
        >
          <div className="space-y-6">
            <CodeBlock code={usageCode} language="tsx" />
            <DocsCallout variant="warning" title="Controlled-state contracts">
              The document a command produces only sticks if you return it through{' '}
              <code>document</code> — nothing is applied otherwise. Controlled{' '}
              <code>selection</code> is latched on the first render; clear it with{' '}
              <code>emptySelection()</code>, not <code>undefined</code>.
            </DocsCallout>
          </div>
        </DocsSection>

        <DocsSection
          id="projections"
          title="Projections"
          description="The canvas is one reading of a graph document — the dependency one. These are the others: a force-directed network, and a single interval model rendered as a schedule, a trace, and an editable range. All four share one document and one selection; none of them knows the others exist."
        >
          <div className="space-y-6">
            <GraphProjectionsDemo />
            <DocsCallout variant="note" title="Time is an overlay, not a document field">
              <code>GraphDocument</code> describes structure; a run describes
              time. Spans are passed beside the document, like{' '}
              <code>runtimeByNodeId</code> already is, so one graph can carry as
              many runs as you keep. That is also why an edit in the{' '}
              <code>range</code> variant arrives as <code>onSpanChange</code> and
              not as a <code>GraphCommand</code> — a scheduled range is authored
              configuration, an observed one is runtime, and collapsing the two
              into the command union would erase the difference.
            </DocsCallout>
          </div>
        </DocsSection>

        <DocsSection id="api" title="API">
          <div className="space-y-4">
            <p className="m-0 text-sm text-tint-muted">
              The full prop signature, from the source:
            </p>
            <CodeBlock code={signatureCode} language="tsx" />
            <PropsTable rows={props} />
          </div>
        </DocsSection>

        <DocsFooter>
          <span>
            Demo fixtures: ComfyUI LTX-2.3 workflow, a domain-neutral demo graph, and the
            projections ontology seed
          </span>
        </DocsFooter>
    </DocsPage>
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
