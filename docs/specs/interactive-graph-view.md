---
title: Interactive Graph View Developer Specification
document_id: APP-GRAPH-CLIENT-001
version: 0.1.0
status: draft
owners:
  - tint-client
  - application-platform
  - data-platform
reviewers:
  - security-architecture
  - developer-experience
  - database-engineering
created: 2026-08-10
updated: 2026-08-10
target_runtime:
  client: React 19 and TypeScript
  library: tint (Vite component library)
  database: PostgreSQL 19 Beta 2
  graph_query: SQL/PGQ (GRAPH_TABLE)
primary_vendor:
  repository: https://github.com/xyflow/xyflow
  packages:
    - packages/system
    - packages/react
  license: MIT
architecture:
  rendering: DOM nodes with SVG edges
  persistence: host-injected GraphRepository
  graph_projection: PostgreSQL property graph (server-side)
  query_transport: structured intents over application API
  execution: external runtime services
stability:
  client_contract: pre-1.0
  database_feature: beta
references:
  - https://github.com/xyflow/xyflow
  - https://github.com/retejs
  - https://github.com/newcat/baklavajs
  - https://github.com/didi/logicflow
  - https://github.com/excalidraw/excalidraw
  - https://github.com/Flipboard/react-canvas
---

# Interactive Graph View Developer Specification

## 1. Purpose

This specification defines the contracts, component boundaries, vendoring process,
promise semantics, persistence interfaces, and delivery plan for an interactive graph
view in the tint React TypeScript client.

The graph view MUST support:

- Interactive node, edge, port, group, and annotation rendering
- Domain-neutral graph documents
- Ontology-grounded node and connection constraints
- Automation workflows without coupling the canvas to an execution engine
- Custom node definitions, including Lua, Python, and TypeScript script nodes
- Graph expansion and pattern queries backed by PostgreSQL 19 SQL/PGQ through a
  host-injected query service
- Read-only, editable, and presentation modes
- Replaceable rendering and persistence adapters
- Versioned contracts across the client, host API, and database

The graph view MUST NOT treat the rendering library, execution engine, or PostgreSQL
property graph definition as the canonical application model.

Tint is a single-service Vite + React 19 component library with no backend. Persistence,
SQL/PGQ translation, and script execution MUST remain host-supplied seams, following the
same pattern as `AudioTranscriber`, collab network providers, and auth transports.

---

## 2. Architectural Decision

### 2.1 Rendering pattern selection

Candidate libraries were evaluated as client interface patterns:

| Candidate | Primary pattern | React fit | Execution coupling | Recommendation |
| --- | --- | --- | --- | --- |
| xyflow | React DOM nodes + SVG edges + interaction system | Excellent | Low | **Primary substrate** |
| Rete.js | Plugin-based visual programming core | Good | Medium–high | Architecture reference |
| LogicFlow | Business diagram models + plugins (Preact) | Moderate | Optional | Architecture reference |
| Baklava.js | Typed graph core + optional engine + Vue renderer | Poor for React UI | Optional | Concept reference |
| Excalidraw | Whiteboard / drawing scene | Poor for rich graph nodes | None | UX reference |
| React Canvas | React-to-canvas rendering (archived) | Poor | None | **Reject** |

**Decision:** Vendor xyflow (`@xyflow/system` + `@xyflow/react`) as the implementation
dependency for spatial interaction. Keep Rete, Baklava, LogicFlow, and Excalidraw as
pattern references only.

**Rejected composition:** Do not combine Rete editor state, Baklava node classes, xyflow
interactions, and LogicFlow history into one runtime. That creates overlapping graph
authorities and incompatible mutation semantics.

### 2.2 Core principle

> The canvas owns spatial interaction. The Application owns graph meaning.
> PostgreSQL owns durable graph facts and graph-query evaluation.

| Owner | Responsibilities |
| --- | --- |
| Canvas (xyflow adapter) | Pan/zoom, placement, selection gestures, marquee, connection gestures, edge presentation, coordinate conversion, viewport culling, measurement, resize |
| Application (tint graph package) | Node kinds, ports, ontology refs, connection policy, commands, transactions, validation presentation, permissions metadata, script metadata, inspector UI |
| Host / server | Durable records, revision concurrency, property graph definitions, SQL/PGQ evaluation, authorization-aware queries |
| Execution services | Lua / Python / TypeScript runtimes — never the canvas |

### 2.3 Tint package layout

Align with existing vendor + adapter seams (`src/vendor/yjs` → `createCollabSession`,
`src/vendor/tanstack-table-core` → `useDataTable`):

```text
src/
├── vendor/
│   └── xyflow/
│       ├── PROVENANCE.md
│       ├── LICENSE
│       ├── system/                 # @xyflow/system
│       ├── react/                  # @xyflow/react
│       └── patches/                # optional patch series
└── components/
    └── graph/
        ├── contracts/              # GraphDocument, commands, queries, errors
        ├── registry/               # NodeDefinition registry
        ├── adapter/                # ONLY place that imports vendor/xyflow
        ├── components/             # InteractiveGraphView, NodeShell, ports, edges
        ├── nodes/                  # generic + script node presentations
        ├── hooks/                  # selection, viewport, dispatch
        ├── testing/                # fake adapters, fixtures, contract tests
        ├── SPEC.md                 # pointer to this document
        └── index.ts                # public exports
```

Public import surface:

```ts
import {
  InteractiveGraphView,
  type GraphDocument,
  type GraphCommand,
  type GraphRepository,
  type GraphQueryService,
  type NodeDefinition,
} from 'tint/graph'
```

### 2.4 Import rule

The following import is forbidden outside `src/components/graph/adapter/`:

```ts
import { ReactFlow } from '../../../vendor/xyflow/react'
// or any @xyflow/* path
```

Application and docs code MUST import only from `tint/graph` / `src/components/graph`.
Enforce with oxlint / dependency-boundary checks (tint uses oxlint, not ESLint).

---

## 3. Canonical Graph Document

The canonical graph document MUST remain independent of React, xyflow, SQL/PGQ, and
execution runtimes. xyflow `Node` / `Edge` types are adapter outputs, never the persisted
document.

```ts
export type GraphId = string
export type RevisionToken = string

export type Point = { x: number; y: number }
export type Size = { width: number; height: number }
export type Rect = Point & Size

export type GraphDocument = {
  schemaVersion: string
  id: GraphId
  revision: RevisionToken
  nodes: GraphNode[]
  edges: GraphEdge[]
  groups: GraphGroup[]
  viewport?: GraphViewport
  metadata: Record<string, unknown>
}

export type GraphNode<TConfig = unknown> = {
  id: string
  kind: string
  position: Point
  size?: Size
  parentId?: string
  presentation?: NodePresentation
  configuration: TConfig
  ports: GraphPort[]
  capabilities?: NodeCapabilities
}

export type GraphPort = {
  id: string
  key: string
  direction: 'input' | 'output' | 'bidirectional'
  cardinality: 'single' | 'multiple'
  dataType?: TypeReference
  required?: boolean
}

export type EndpointReference = {
  nodeId: string
  portId: string
}

export type GraphEdge = {
  id: string
  source: EndpointReference
  target: EndpointReference
  kind?: string
  metadata?: Record<string, unknown>
}

export type GraphGroup = {
  id: string
  label?: string
  childIds: string[]
  bounds?: Rect
}

export type GraphViewport = {
  x: number
  y: number
  zoom: number
}

export type NodePresentation = {
  label?: string
  description?: string
  icon?: string
  accent?: string
  collapsed?: boolean
}

export type NodeCapabilities = {
  movable?: boolean
  connectable?: boolean
  deletable?: boolean
  resizable?: boolean
  editable?: boolean
}

export type TypeReference = {
  ontologyIri?: string
  localName?: string
  mediaType?: string
}
```

### 3.1 Persistence rule

The client document MUST NOT be the only opaque JSON blob in durable storage.

Hosts SHOULD store nodes, edges, ports, revisions, and ontology references in relational
tables. JSONB MAY store node-specific configuration and presentation data. This lets
PostgreSQL 19 property graph definitions map relational tables to vertices and edges
without a second graph store.

### 3.2 Script configuration

Keep large script payloads out of high-frequency canvas state:

```ts
export type ScriptLanguage = 'lua' | 'python' | 'typescript'

export type ScriptNodeConfiguration = {
  language: ScriptLanguage
  /** External source artifact id — prefer over inlining large source strings. */
  sourceRef: string
  entrypoint?: string
  runtimeProfileId?: string
  permissions: string[]
  inputSchema?: JsonSchemaReference
  outputSchema?: JsonSchemaReference
}
```

`sourceRef` avoids forcing the canvas store, undo history, and collaboration channel to
repeatedly copy large source strings.

---

## 4. Public React Component Contract

### 4.1 `InteractiveGraphView`

```ts
export type GraphViewMode = 'select' | 'connect' | 'pan' | 'annotate' | 'readonly' | 'present'

export type InteractiveGraphViewProps = {
  document: GraphDocument
  mode?: GraphViewMode
  selection?: GraphSelection
  registry: NodeRegistry
  repository?: GraphRepository
  queryService?: GraphQueryService
  commandBus?: GraphCommandBus
  readonly?: boolean
  className?: string
  onSelectionChange?: (selection: GraphSelection) => void
  onViewportChange?: (viewport: GraphViewport) => void
  onCommand?: (envelope: GraphCommandEnvelope<GraphCommand>) => void
  onError?: (error: GraphError) => void
}
```

### 4.2 Component promises

`InteractiveGraphView` SHALL provide the following behavioral promises:

1. It SHALL NOT execute Lua, Python, or TypeScript code.
2. It SHALL NOT construct raw SQL or SQL/PGQ queries.
3. It SHALL NOT expose xyflow node or edge objects through its public API.
4. It SHALL render optimistic local movement without waiting for a server response.
5. It SHALL submit durable mutations through the command bus (when provided).
6. It SHALL reconcile server-authoritative revisions without silently discarding local changes.
7. It SHALL surface rejected commands as typed errors.
8. It SHALL preserve selection when a refresh returns the same entity identifiers.
9. It SHALL isolate embedded controls from canvas drag, wheel, and keyboard gestures.
10. It SHALL remain operable in read-only mode without constructing mutation commands.

---

## 5. Node Registry Contract

```ts
export type NodeDefinition<TConfiguration = unknown> = {
  kind: string
  version: string
  displayName: string
  category: string

  createDefault(context: NodeCreationContext): TConfiguration

  derivePorts(
    configuration: TConfiguration,
    context: PortDerivationContext,
  ): readonly GraphPort[]

  validate(
    node: GraphNode<TConfiguration>,
    context: GraphValidationContext,
  ): Promise<readonly ValidationIssue[]>

  render: React.ComponentType<NodeViewProps<TConfiguration>>

  inspector?: React.ComponentType<NodeInspectorProps<TConfiguration>>

  migrate?: NodeConfigurationMigrator<TConfiguration>
}

export type NodeViewProps<TConfiguration = unknown> = {
  node: GraphNode<TConfiguration>
  selected: boolean
  focused: boolean
  readonly: boolean
  validation: readonly ValidationIssue[]
  runtime?: NodeRuntimeSummary
  dispatch(command: GraphCommand): void
}

export type NodeRegistry = {
  get(kind: string): NodeDefinition | undefined
  require(kind: string): NodeDefinition
  list(filter?: NodeDefinitionFilter): readonly NodeDefinition[]
  register(definition: NodeDefinition): void
}
```

### 5.1 Node rendering rules

Node view components:

- MUST be presentation-focused
- MUST receive commands rather than mutable graph state
- MUST NOT import the graph repository directly
- MUST NOT execute scripts
- MUST NOT issue SQL/PGQ queries
- MUST NOT persist their own position
- MUST declare interactive regions through the node interaction contract
- MUST support compact, normal, and detailed zoom detail levels

### 5.2 Script node rule

A full code editor SHOULD open in an inspector or dedicated editor surface — not inside
every visible node body.

The normal canvas node SHOULD display:

- Language
- Source reference
- Entry point
- Validation state
- Runtime profile
- Permission profile
- Input / output ports
- Execution summary (read-only presentation)

This avoids multiple Monaco / CodeMirror instances inside zoom-transformed node bodies,
and avoids keyboard / wheel / drag conflicts with the canvas.

```tsx
function ScriptNodeView({ node, validation }: NodeViewProps<ScriptNodeConfiguration>) {
  return (
    <NodeShell>
      <NodeHeader
        title={node.presentation?.label ?? 'Script'}
        status={validation.length ? 'invalid' : 'ready'}
      />
      <ScriptSummary
        language={node.configuration.language}
        sourceRef={node.configuration.sourceRef}
        entrypoint={node.configuration.entrypoint}
      />
      <PortList ports={node.ports} />
    </NodeShell>
  )
}
```

### 5.3 Adapter wrapper (anti-lock-in)

xyflow-specific props stay inside the adapter. Node implementations never import xyflow:

```tsx
function XyflowNodeAdapter(props: { id: string; selected?: boolean }) {
  const node = useGraphNode(props.id)
  const definition = useNodeDefinition(node.kind)

  return (
    <ApplicationNodeShell node={node}>
      <definition.render
        node={node}
        selected={Boolean(props.selected)}
        focused={useNodeFocus(node.id)}
        readonly={useGraphReadonly()}
        validation={useNodeValidation(node.id)}
        runtime={useNodeRuntimeSummary(node.id)}
        dispatch={useGraphDispatch()}
      />
    </ApplicationNodeShell>
  )
}
```

---

## 6. Canvas Adapter Contract

```ts
export type GraphCanvasCapabilities = {
  panZoom: boolean
  marqueeSelect: boolean
  connectPorts: boolean
  keyboardNavigation: boolean
  fitBounds: boolean
  nodeResize: boolean
}

export type GraphCanvasAdapter = {
  readonly id: string
  readonly version: string
  readonly capabilities: GraphCanvasCapabilities
  mount(context: GraphCanvasMountContext): Promise<GraphCanvasSession>
}

export type GraphCanvasSession = {
  setDocument(document: GraphDocument): Promise<CanvasUpdateResult>
  applyChanges(changes: readonly GraphCanvasChange[]): Promise<CanvasUpdateResult>
  setMode(mode: GraphViewMode): Promise<void>
  setSelection(selection: GraphSelection): Promise<void>
  setViewport(
    viewport: GraphViewport,
    options?: ViewportTransitionOptions,
  ): Promise<ViewportResult>
  fitBounds(bounds: Rect, options?: FitGraphOptions): Promise<ViewportResult>
  graphToScreen(point: Point): Point
  screenToGraph(point: Point): Point
  dispose(): Promise<void>
}
```

### 6.1 Adapter guarantees

The adapter MUST:

- Resolve `mount()` only after the viewport container is measurable
- Resolve `setDocument()` only after internal indexes are synchronized
- Resolve viewport promises after the requested transform is applied
- Reject operations after `dispose()` with `GRAPH_SESSION_DISPOSED`
- Keep rendering-library identifiers internal
- Deliver interaction changes through typed events
- Avoid durable persistence
- Avoid domain-specific validation
- Avoid direct execution-state mutations

### 6.2 Selection (application concept)

```ts
export type GraphEntityReference =
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }
  | { kind: 'group'; id: string }

export type GraphSelection = {
  nodeIds: ReadonlySet<string>
  edgeIds: ReadonlySet<string>
  groupIds: ReadonlySet<string>
  primary?: GraphEntityReference
}
```

Selection drives inspector routing, bulk editing, deletion, clipboard, keyboard commands,
command history, and collaborative presence. It MUST NOT be only a local React boolean on
a node component.

### 6.3 Viewport API

```ts
export type CanvasViewportApi = {
  getViewport(): GraphViewport
  setViewport(viewport: GraphViewport, options?: ViewportTransitionOptions): Promise<ViewportResult>
  fitBounds(bounds: Rect, options?: FitGraphOptions): Promise<ViewportResult>
  screenToGraph(point: Point): Point
  graphToScreen(point: Point): Point
}
```

---

## 7. Promise and Cancellation Semantics

All asynchronous graph contracts MUST accept cancellation where the operation may cross a
network, worker, layout engine, or animation boundary.

```ts
export type AsyncOperationOptions = {
  signal?: AbortSignal
  requestId?: string
  deadlineMs?: number
}

export type OperationResult<T> = {
  requestId: string
  revision?: RevisionToken
  value: T
  warnings: readonly GraphWarning[]
  timing?: OperationTiming
}

export type OperationTiming = {
  startedAt: string
  completedAt: string
  serverDurationMs?: number
}
```

### 7.1 Promise rules

1. A promise MUST settle exactly once.
2. Cancellation MUST reject with typed `GraphAbortError`.
3. Validation failures MUST resolve as validation results unless the service itself failed.
4. Authorization failures MUST reject with `GraphAuthorizationError`.
5. Revision conflicts MUST reject with `GraphRevisionConflictError`.
6. Transport failures MUST reject with `GraphTransportError`.
7. Partial graph queries MUST resolve with `complete: false` and a continuation token.
8. Empty query results MUST resolve successfully with an empty entity set.
9. View animations superseded by later animations MUST reject with reason `SUPERSEDED`.
10. Repository methods MUST NOT retry non-idempotent writes unless supplied with an
    idempotency key.

### 7.2 Error taxonomy

```ts
export type GraphErrorCode =
  | 'GRAPH_ABORT'
  | 'GRAPH_AUTHORIZATION'
  | 'GRAPH_REVISION_CONFLICT'
  | 'GRAPH_TRANSPORT'
  | 'GRAPH_VALIDATION'
  | 'GRAPH_SESSION_DISPOSED'
  | 'GRAPH_UNKNOWN_NODE_KIND'
  | 'GRAPH_SUPERSEDED'

export type GraphError = {
  code: GraphErrorCode
  message: string
  requestId?: string
  details?: Record<string, unknown>
  cause?: unknown
}
```

---

## 8. Commands and Transactions

Canvas callbacks MUST be translated into application commands. Node components MUST NOT
mutate graph state directly.

```ts
export type GraphCommand =
  | { type: 'node.move'; nodeIds: string[]; delta: Point }
  | { type: 'node.resize'; nodeId: string; size: Size }
  | { type: 'node.create'; kind: string; position: Point; configuration?: unknown }
  | { type: 'node.configure'; nodeId: string; patch: JsonPatch[] }
  | { type: 'edge.connect'; source: EndpointReference; target: EndpointReference }
  | { type: 'entity.delete'; entities: GraphEntityReference[] }
  | { type: 'selection.replace'; selection: GraphSelection }
  | { type: 'viewport.set'; viewport: GraphViewport }

export type GraphCommandEnvelope<TCommand extends GraphCommand = GraphCommand> = {
  commandId: string
  graphId: GraphId
  baseRevision: RevisionToken
  actorId: string
  issuedAt: string
  idempotencyKey: string
  command: TCommand
}

export type GraphCommandBus = {
  validate(
    envelope: GraphCommandEnvelope,
    options?: AsyncOperationOptions,
  ): Promise<CommandValidationResult>

  dispatch(
    envelope: GraphCommandEnvelope,
    options?: AsyncOperationOptions,
  ): Promise<CommandCommitResult>
}
```

### 8.1 Command guarantees

The command bus MUST:

- Apply authorization before durable mutation
- Validate ontology and topology rules
- Use optimistic concurrency via `baseRevision`
- Return the authoritative revision
- Return normalized node and edge changes
- Support idempotent replay by `idempotencyKey`
- Produce audit metadata
- Prevent client-provided SQL from reaching the database

Position changes MAY be coalesced during dragging. The final drag position MUST be
committed when the gesture ends — not on every pointer move.

---

## 9. Repository and Query Contracts

### 9.1 Repository

```ts
export type GraphRepository = {
  load(
    graphId: GraphId,
    options?: LoadGraphOptions & AsyncOperationOptions,
  ): Promise<OperationResult<GraphDocument>>

  apply(
    transaction: GraphTransaction,
    options?: AsyncOperationOptions,
  ): Promise<OperationResult<GraphCommit>>

  query(
    request: StructuredGraphQuery,
    options?: AsyncOperationOptions,
  ): Promise<OperationResult<GraphQueryResult>>

  subscribe(
    graphId: GraphId,
    listener: GraphRepositoryListener,
    options?: GraphSubscriptionOptions,
  ): Promise<GraphSubscription>
}
```

Repository guarantees:

- `load()` returns a self-consistent revision
- `apply()` is atomic and compares the base revision
- `query()` does not mutate the graph
- `subscribe()` provides ordered revision notifications
- Duplicate revision notifications are safe
- Consumers can request a full reload after detecting a revision gap

### 9.2 Structured graph query service

The client MUST submit structured query intents. It MUST NOT submit raw SQL or PGQ strings.

```ts
export type GraphQueryService = {
  expand(
    request: ExpandGraphRequest,
    options?: AsyncOperationOptions,
  ): Promise<GraphQueryResult>

  findPaths(
    request: FindPathsRequest,
    options?: AsyncOperationOptions,
  ): Promise<GraphPathResult>

  match(
    request: StructuredGraphMatchRequest,
    options?: AsyncOperationOptions,
  ): Promise<GraphQueryResult>

  resolveNeighborhood(
    request: NeighborhoodRequest,
    options?: AsyncOperationOptions,
  ): Promise<GraphQueryResult>
}

export type ExpandGraphRequest = {
  graphId: GraphId
  origin: GraphEntityReference
  direction: 'incoming' | 'outgoing' | 'both'
  edgeKinds?: string[]
  nodeKinds?: string[]
  maxDepth: number
  limit: number
  continuationToken?: string
}

export type StructuredGraphMatchRequest = {
  graphId: GraphId
  pattern: GraphPattern
  projections: readonly GraphProjection[]
  filters: readonly GraphFilter[]
  ordering?: readonly GraphOrdering[]
  limit: number
}

/** Forbidden — never part of the public client contract. */
type ForbiddenRawQuery = {
  sql: string
  pgq: string
}
```

---

## 10. PostgreSQL 19 SQL/PGQ Boundary

PostgreSQL 19 Beta 2 (announced 2026-07-16) adds SQL/PGQ property graph queries:
`CREATE PROPERTY GRAPH` over existing relational tables, and `GRAPH_TABLE` / `MATCH`
pattern evaluation that rewrites to relational plans.

Because PostgreSQL 19 is still beta as of this document's `updated` date:

- SQL/PGQ syntax and behavior MUST remain isolated behind the server repository layer
- The tint client MUST NOT depend on beta SQL syntax
- CI MUST pin the exact PostgreSQL 19 beta / RC build used for compatibility tests

### 10.1 Known PG19 limitations (document for hosts)

Hosts integrating SQL/PGQ SHOULD treat the following as current product constraints until
verified against GA docs:

- Property graph definitions are logical / read-oriented over relational tables; writes
  remain ordinary SQL against base tables
- Fixed-depth pattern matching is the supported exploration shape in early PG19; do not
  assume variable-length path quantifiers or built-in shortest-path algorithms in client UX
  until the pinned server build proves them
- `ExpandGraphRequest.maxDepth` MUST be enforced by the server planner (unrolled fixed
  patterns or relational recursion), never by sending open-ended PGQ from the browser

### 10.2 Server translation boundary

```text
Structured client query intent
        │
        ▼
Authorization + limit enforcement
        │
        ▼
Graph-query planner (allowlisted labels / properties)
        │
        ▼
Parameterized SQL/PGQ (GRAPH_TABLE / MATCH)
        │
        ▼
Relational result rows
        │
        ▼
GraphQueryResult DTO
```

### 10.3 Query safety requirements

The server MUST:

- Resolve graph names from an allowlisted registry
- Resolve labels and property names from server metadata
- Parameterize values
- Enforce maximum depth and result limits
- Enforce query timeout
- Apply tenant predicates and row-level authorization
- Reject arbitrary identifiers
- Return stable public entity identifiers
- Support cancellation
- Record query diagnostics without logging sensitive property values

---

## 11. Vendoring Specification

Follow tint's established vendor provenance pattern (`src/vendor/*/PROVENANCE.md`).

### 11.1 Directory layout

```text
src/vendor/xyflow/
├── PROVENANCE.md
├── LICENSE
├── SECURITY.md                 # if present upstream / mirrored
├── system/                     # published @xyflow/system artifact or packages/system
├── react/                      # published @xyflow/react artifact or packages/react
├── patches/
│   ├── 0001-tint-build-integration.patch
│   └── 0002-tint-accessibility-fixes.patch
└── verification/
    ├── checksums.json
    └── provenance.json
```

### 11.2 `PROVENANCE.md` requirements

Record at minimum:

| Field | Example |
| --- | --- |
| Package | `@xyflow/react`, `@xyflow/system` |
| Version / commit | pinned semver **and** full upstream SHA when vendoring from git |
| License | MIT — retain verbatim `LICENSE` |
| Upstream | https://github.com/xyflow/xyflow |
| Tarball / checksum | SHA-256 of imported artifact |
| Vendored date | ISO date |
| Local modifications | mechanical only, or explicit patch list |
| How tint uses it | Only through `src/components/graph/adapter/` |

### 11.3 Vendoring rules

1. Vendor from an immutable commit SHA or published tarball checksum.
2. Preserve all required license notices.
3. Prefer published build artifacts when upstream TypeScript does not typecheck under tint's
   `verbatimModuleSyntax` settings (same lesson as `@tanstack/table-core`).
4. Store behavioral local modifications as patches; do not silently edit vendored source.
5. Do not expose vendored types from tint public contracts.
6. Retain or re-run upstream tests for imported packages where practical.
7. Add adapter-level contract tests as the regression net for engine upgrades.
8. Review upstream security advisories on a recurring schedule.
9. Upgrade policy: quarterly, or immediately for security-triggered updates.

### 11.4 Upgrade process

1. Select a reviewed upstream version / commit.
2. Verify license and provenance.
3. Import into a temporary branch.
4. Reapply the internal patch series.
5. Run upstream tests (if retained) and tint `graph` contract tests.
6. Run interaction and accessibility regression tests.
7. Compare bundle size and interaction performance.
8. Update `PROVENANCE.md` and checksums.
9. Record behavioral changes in the PR.
10. Merge through normal code review.

### 11.5 What NOT to vendor

| Source | Reason |
| --- | --- |
| Flipboard/react-canvas | Archived (~2015); incomplete events/a11y; not a graph editor |
| Excalidraw editor core | Whiteboard document model; wrong interaction semantics for ports/nodes |
| Full Baklava Vue renderer | Vue-specific; core concepts only |
| Full LogicFlow runtime | Preact-coupled monolith; Apache-2.0 model useful as reference only |
| Rete React renderer + engine | Useful ideas; adopting it as second graph authority violates §2.1 |
| Isolated xyflow utility files copied into random folders | Destroys provenance and upgrade path |

---

## 12. Performance Contracts

Initial targets (measure before treating as guarantees):

| Metric | Target |
| --- | --- |
| Visible DOM nodes under normal interaction | ~1,000 |
| Total loaded nodes with viewport culling | ~5,000 |
| SVG edges under degradation testing | up to ~10,000 |
| Pointer response for normal drag | within one animation frame |
| Repository writes during drag | none per pointer move; commit on gesture end |
| Expensive auto-layout | Web Worker |
| Graph-query expansion | progressive / incremental insertion |
| Low zoom | detail reduction (compact node chrome) |

For larger read-only result graphs, the product MAY introduce a separate canvas or WebGL
renderer behind `GraphCanvasAdapter` without changing `GraphDocument`.

---

## 13. Accessibility Contracts

The graph view MUST:

- Provide a keyboard-reachable node list
- Expose selected state
- Expose node labels and validation state
- Provide keyboard alternatives for connecting ports
- Provide a non-spatial entity inspector
- Preserve visible focus
- Avoid trapping keyboard focus inside nodes
- Respect `prefers-reduced-motion`
- Support read-only traversal without drag gestures
- Provide an accessible fallback for operations that cannot be represented meaningfully
  through the spatial canvas

DOM + SVG is the default rendering pattern specifically so rich node content, embedded
controls, browser semantics, and accessibility integration remain first-class.

---

## 14. Testing Requirements

### 14.1 Adapter contract tests

Every `GraphCanvasAdapter` implementation MUST pass the same tests for:

- Mount and disposal
- Coordinate conversion
- Selection synchronization
- Node movement
- Connection gestures
- Viewport transitions
- Read-only enforcement
- Cancellation
- Superseded operations
- Unknown node kinds
- Missing ports
- Document replacement
- Revision refresh

### 14.2 Repository / host fake tests

- Atomic commits
- Revision conflicts
- Idempotent replay
- Authorization rejection
- Query limits
- Cancellation
- Empty and partial results
- Continuation tokens

### 14.3 PostgreSQL compatibility tests (host / data-platform)

- Pin exact PostgreSQL 19 beta / RC build in CI
- Property graph creation over relational tables
- Vertex- and edge-table mapping
- Directed pattern matching
- Label filtering and property projection
- Composition of `GRAPH_TABLE` with relational joins
- Query cancellation and timeout enforcement
- Upgrade rehearsal against each adopted beta / RC / GA

### 14.4 Tint component tests

- Public API does not leak xyflow types (`package-portability`-style guard)
- Script nodes never import execution runtimes
- Adapter is the only `src/vendor/xyflow` importer
- Docs demo runs offline with fixture graphs (no outbound network)

---

## 15. Developer Plan

### Phase 0 — Architecture and provenance

**Deliverables**

- This specification approved as working draft
- Vendoring policy aligned with existing `PROVENANCE.md` practice
- Canonical `GraphDocument` TypeScript types in `contracts/`
- Host PostgreSQL relational schema draft + property graph PoC (data-platform)
- Dependency and license review for xyflow MIT packages

**Exit criteria**

- No public contract imports xyflow types
- SQL/PGQ isolated behind host repository
- Canonical identifiers map consistently across client DTOs and database keys

### Phase 1 — Read-only graph view

**Deliverables**

- Vendored `@xyflow/system` + `@xyflow/react` under `src/vendor/xyflow`
- `adapter/` xyflow session implementation
- `InteractiveGraphView` read-only surface
- Generic node / edge rendering
- Pan, zoom, fit, focus, selection
- In-memory `GraphRepository` fake + fixture document
- Docs page under `src/docs/graph/`

**Exit criteria**

- A fixture graph loads and navigates at `http://tint.localhost`
- Selection synchronizes with a side inspector stub
- Adapter contract tests pass

### Phase 2 — Editing and command bus

**Deliverables**

- Node move / create / delete
- Port connections with `isValidConnection` policy hook
- Command envelopes + optimistic local apply
- Undo / redo transaction model (application-owned)
- Revision conflict handling against fake repository

**Exit criteria**

- Every durable edit passes through the command bus
- Dragging does not write on every pointer event
- Rejected commands return typed errors

### Phase 3 — Ontology grounding

**Deliverables**

- `NodeDefinition` registry
- Typed ports / `TypeReference`
- Connection policy service
- Async validation + validation chrome on nodes/edges
- Server-compatible rule identifiers (documented for hosts)

**Exit criteria**

- Invalid edges cannot be committed
- Unknown ontology terms degrade safely
- Client and host validation share rule id vocabulary

### Phase 4 — SQL/PGQ graph exploration (host-integrated)

**Deliverables**

- Structured query DTOs in `contracts/queries.ts`
- Expansion / neighborhood / path-finding UI intents
- Result limits, continuation tokens, cancellation
- Incremental canvas insertion of query results
- Host reference implementation translating intents → parameterized `GRAPH_TABLE`

**Exit criteria**

- No client request accepts raw SQL or PGQ
- Queries enforce tenant and authorization filters on the host
- Partial results are distinguishable from complete results
- PG19 beta compatibility suite green on the pinned build

### Phase 5 — Script-node experience

**Deliverables**

- Lua / Python / TypeScript `NodeDefinition`s
- `sourceRef`-based configuration
- Dedicated script inspector (reuse tint `code` / editor surfaces where appropriate)
- Runtime-profile and permission-profile UI
- Execution-summary event presentation (read-only)

**Exit criteria**

- Canvas components never execute scripts
- Script source is not duplicated through high-frequency canvas state
- Runtime events cannot mutate the graph without commands

### Phase 6 — Scale, accessibility, and hardening

**Deliverables**

- Viewport culling
- Worker-based layout (ELK or dagre behind a layout port)
- Keyboard graph navigation + accessible entity list
- Interaction performance suite
- Visual regression suite
- Vendored dependency upgrade rehearsal
- PostgreSQL 19 GA upgrade rehearsal

**Exit criteria**

- Performance budgets documented from measured results
- Accessibility test gates pass
- PostgreSQL beta-specific behavior covered by compatibility tests
- xyflow upgrade procedure rehearsed once end-to-end

---

## 16. Definition of Done

The interactive graph view is complete when:

1. Tint owns a versioned canonical graph schema and public `tint/graph` export.
2. xyflow is isolated behind `src/components/graph/adapter/`.
3. Vendored source has provenance, licensing, checksums, and reproducible patches.
4. Graph rendering remains independent of workflow execution.
5. Script nodes do not execute code in the canvas component hierarchy.
6. Client mutations use commands and revision tokens.
7. Hosts store durable graph entities relationally; SQL/PGQ remains server-side.
8. Graph-query requests are structured and bounded.
9. Adapter, repository-fake, accessibility, and (host) database compatibility tests pass.
10. The team can replace the renderer without changing persistence or API contracts.
11. The team can upgrade PostgreSQL without changing React component contracts.

---

## 17. Main Design Constraints (Summary)

- **One graph authority:** Do not combine Rete, Baklava, and xyflow runtime models.
- **Stable abstraction boundary:** Vendor xyflow as a package boundary; hide it behind an
  internal adapter, matching tint's Yjs and TanStack seams.
- **Explicit promise behavior:** Cancellation, revision conflicts, partial results,
  superseded viewport operations, and typed failures are defined.
- **PostgreSQL 19 isolation:** SQL/PGQ is a host implementation detail; the client submits
  structured graph intents only.
- **Beta protection:** Pin PG19 builds in CI; do not leak beta SQL into tint contracts.
- **Script-node safety:** Lua, Python, and TypeScript nodes describe execution but never run
  code inside the canvas tree.
- **Host injection:** `GraphRepository`, `GraphQueryService`, and `GraphCommandBus` are
  optional props / ports — tint does not ship a database.
