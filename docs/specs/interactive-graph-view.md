---
title: Interactive Graph View
document_id: APP-GRAPH-CLIENT-001
version: 1.0.0
status: as-built
owners:
  - tint-client
created: 2026-08-10
updated: 2026-08-10
target_runtime:
  client: React 19 and TypeScript
  library: tint (Vite component library)
primary_vendor:
  repository: https://github.com/xyflow/xyflow
  packages:
    - packages/react
    - packages/system
  license: MIT
architecture:
  rendering: DOM nodes with SVG edges, behind an adapter
  state: controlled — the host owns the document
stability:
  client_contract: pre-1.0
---

# Interactive Graph View

**Status: as-built.** This describes `src/components/graph` as it ships. Design
material that was specified but not built is in [Appendix A](#appendix-a--future-direction),
clearly separated — the first version of this document mixed the two, and
disagreed with the code on the component's props, its directory layout, the
adapter's shape, and the existence of a repository, a query service, and a
command bus. A spec that contradicts the code teaches the wrong thing to
everyone who reads it, including its own authors.

## 1. Purpose

An interactive node canvas for graph documents the host owns. It renders nodes
and edges, reports what the user did, and computes the document that results. It
does not persist anything, execute anything, or know what a node means.

`tint/graph` is domain-neutral. A ComfyUI workflow parser ships alongside it as a
worked example of mapping an external format onto the contracts — it is opt-in,
not part of the default registry.

## 2. Architecture

```
src/components/graph/
  contracts/     document, commands, applyCommand, registry — no React, no xyflow
  adapter/       the only code that imports src/vendor/xyflow
  nodes/         node views + the default registry
  comfy/         ComfyUI workflow parsing (a consumer of the contracts)
  graph.css      shipped to hosts as `tint/graph/styles.css`
src/vendor/xyflow/  the vendored engine — see PROVENANCE.md
src/docs/graph/     the demo: fixtures, mock run, and the docs page
```

Three rules hold this together, and each is enforced by a test rather than a
comment:

| Rule | Enforced by |
| --- | --- |
| Only `adapter/` imports `src/vendor/xyflow` (including from CSS) | `src/vendor/boundary.test.ts` |
| No barrel re-exports a vendored type | `src/vendor/boundary.test.ts` |
| The vendored bundle matches its recorded checksum | `src/vendor/checksums.test.ts` |
| The root barrel re-exports everything `tint/graph` exposes | `src/exports.test.ts` |

`contracts/` is React-free and xyflow-free: it is the part a host can depend on
without pulling the canvas — and without inheriting a rendering engine. Node
kinds may declare an optional `formSchema`; the inspector renders `FormLayout`
and Apply becomes `node.configure`. That is the as-built form submit path.
Command buses, repositories, and SQL/PGQ stay in Appendix A.

## 3. The graph document

Defined in `contracts/document.ts` — read the types there rather than a copy
here. The previous version of this document reproduced them inline and had
already drifted.

What matters about the shape:

- **Replaced, never mutated.** All collections are `readonly`, and `revision` is
  what tells a host something changed. An in-place mutation leaves it stale.
- **`configuration` is `unknown`.** The document does not know what a node means;
  the `NodeDefinition` registered for its `kind` does.
- **Ports are declared on the node.** A `'bidirectional'` port renders as two
  handles; document-level `portId`s are unaffected (see `adapter/mappers.ts`).
- **`metadata` is the host's.** Nothing in tint reads it.

## 4. Component contract

`InteractiveGraphView` is a controlled component. It holds no document state.

| Prop | Meaning |
| --- | --- |
| `document` | The graph to render. Required. |
| `registry` | Node kinds. Defaults to `createDefaultNodeRegistry()` — trigger, action, script, ontology. Comfy is composed in, not included. |
| `readonly` | Disables movement, connection and deletion. **Selection still works.** |
| `selection` / `onSelectionChange` | Controlled selection. Controlled-ness is latched on first render; pass `emptySelection()` to clear, not `undefined`. |
| `validationByNodeId` | Per-node issues, driving node and inspector chrome. |
| `runtimeByNodeId` | Read-only execution state, if something is running the graph. |
| `viewport` | Moves the camera; each distinct value applied once. Distinct from `document.viewport`, the graph's authored camera, applied when the graph identity changes. |
| `onCommand` | Every user intent, before it is applied. |
| `onDocumentChange` | The document that intent produces. |
| `showInspector`, `showFullscreenControl`, `className` | Presentation. |

### Ownership

There is exactly one rule, and it is the one the first implementation broke:
**the component applies nothing.** It reports a command through `onCommand` and
offers the resulting document through `onDocumentChange`. A host either

- returns the new document through `document` (the simple path), or
- ignores `onDocumentChange` and reduces `onCommand` itself with `applyCommand`,
  which is the same function the component would have used.

Both are correct. What is not available — deliberately — is a mode where the
component mutates some commands and reports others, which is what made a host
running its own store double-apply moves and configures while silently dropping
deletes and connections.

## 5. Node registry

`NodeDefinition` (see `contracts/registry.ts`) describes a node kind: how to
create one (`createDefault`), what ports it has (`derivePorts`), what is wrong
with it (`validate`), and how to draw it (`render`, and optionally `inspector`).

`createDefault` and `derivePorts` are called by `applyCommand` for `node.create`.
This matters: they were previously declared on every definition and invoked
nowhere, while the demo fixture hand-wrote the ports its own registry claimed to
derive — two sources of truth kept in step by hand.

`validate` is host-invoked; the component renders `validationByNodeId` rather
than running validation on a timer it does not own.

## 6. Canvas adapter

`adapter/XyflowCanvas` is a React component, not a session object with
`mount`/`dispose`. It:

- maps the document to flow nodes and edges (`adapter/mappers.ts`),
- keeps `nodeTypes` at module scope and passes node data through
  `GraphAdapterContext`, so node views are not rebuilt on every render,
- commits drags on `onNodeDragStop` against a baseline captured on
  `onNodeDragStart`, so a pointer drag is one document revision and not one per
  frame,
- translates xyflow's events into `GraphCommand`s.

Swapping the engine means rewriting this directory **and** `graph.css`, which
styles eight xyflow-internal class names. The stylesheet is part of the seam.

## 7. Vendoring

`@xyflow/react` and `@xyflow/system` are vendored, matching the existing
decisions for `yjs` and `@tanstack/table-core`: the engine is held in-tree and
upgrades are a manual re-vendor. `src/vendor/xyflow/PROVENANCE.md` records
versions, checksums, local modifications, and the upgrade recipe.

The declaration trees are vendored **verbatim**. An earlier attempt hand-wrote
"the subset the adapter uses", which drifted from the bundle immediately — it
declared `Node` with `width`/`height` and no `measured`, and the build broke on
the first change that used it.

## 8. Performance

Holds at the ~50-node scale the demo exercises, with these properties:

- Node lookup is indexed, not a scan per node per revision.
- `onlyRenderVisibleElements` is on.
- Drags commit once, on release.
- Flow node `data` carries three fields, not the whole configuration.

Not yet measured at the 1,000-visible / 5,000-loaded scale Appendix A targets.
Treat that as unproven rather than met.

## 9. Accessibility

- Nodes and edges are focusable; arrows move a focused node; Enter selects. The
  canvas carries `role="application"`, which is only honest because that keyboard
  model exists — `nodesFocusable`, `edgesFocusable` and `disableKeyboardA11y` are
  set explicitly for that reason, and a visually-hidden description states the
  keys.
- `:focus-visible` styling, and a `prefers-reduced-motion` block that degrades
  the running-node pulse to a static outline rather than removing the signal.
- Fullscreen falls back to an in-page theater mode where the platform refuses it
  (iOS Safari has no element fullscreen at all). Theater mode is a real modal:
  focus moves in, Tab cycles, focus is restored.

Known gap: there is no keyboard path for *creating* a connection, and no
non-spatial list of entities. Both are in Appendix A.

## 10. Testing

Co-located, plus the repo-invariant suites named in §2. The reducer
(`contracts/applyCommand.test.ts`) is where the ownership rules are pinned; the
parser tests use the LTX-2.3 fixture from `src/docs/graph/`, which is demo
content and is not published.

---

# Appendix A — Future direction

**Nothing below is implemented.** It is the original design intent, retained as a
design record. It describes a host application — persistence, a command bus, and
a PostgreSQL property-graph projection — that does not exist in this repository,
and the component deliberately does not assume it: `onCommand` reports plain
commands, not envelopes, and there is no `commandBus`, `repository`, or
`queryService` prop.

If any of this is built, move the section up into the body and delete it here.

## A.1 Promise and Cancellation Semantics

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

## A.2 Commands and Transactions

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

## A.3 Repository and Query Contracts

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

## A.4 PostgreSQL 19 SQL/PGQ Boundary

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
