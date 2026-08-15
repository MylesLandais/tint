# Graph component

Specification: [`docs/specs/interactive-graph-view.md`](../../../docs/specs/interactive-graph-view.md)

`InteractiveGraphView` is controlled — it holds no document state. It reports
every user intent through `onCommand` and offers the resulting document through
`onDocumentChange`; `applyCommand` is the reducer that connects them, and hosts
running their own store can use it directly.

Only `adapter/` may import `src/vendor/xyflow`, `graph.css` included. That is
checked by `src/vendor/boundary.test.ts`, not by convention.

The stylesheet ships to hosts as `tint/graph/styles.css`, like auth's — the
component does not import it. Inspector `FormLayout`s also need
`tint/form/styles.css`.

## Projections

The canvas is one reading of a `GraphDocument` — the dependency one. The others
live in `projections/`, as pure functions, with thin views over them:

| Projection | Function | View |
| --- | --- | --- |
| Dependency | `topologicalLanes` | `InteractiveGraphView` |
| Network | `forceLayout` / `createForceLayout` + `stepForceLayout` | `ForceGraphView` |
| Schedule, trace, range | `projectTimeline` | `TimelineView` (`variant`) |

Three rules hold them together:

- **One document.** The projections read the same `GraphDocument` the canvas
  does. A projection that needs its own document shape is the whole premise
  failing, and should stay visible as such rather than get a second contract.
- **Time is an overlay.** Spans are passed beside the document, like
  `runtimeByNodeId` already is — a graph has as many runs as you keep. Edits to
  the `range` variant surface as `onSpanChange`, not `GraphCommand`, because
  `applyCommand` has nothing to reduce a span into. A host treating a range as
  *authored* schedule maps it to `node.configure` itself; that is the seam
  between a plan and a trace.
- **The layout is deterministic.** `forceLayout` seeds from hashed node ids, and
  sorts them, so the same node set lays out the same way across reloads, tests,
  and a host that reorders its list. Position reads as meaning.

`topologicalLanes` mirrors `lib/auto/src/compiler.rs` (`topological_order`) in
both traversal and issue codes — `DuplicateEdge`, `UnknownEdgeNode`, `Cycle`. A
client that disagreed with the executor about what a valid DAG is would draw
lanes for a graph the executor refuses.

Neither projection nor projection view may import the vendored xyflow; only
`adapter/` may, and `src/vendor/boundary.test.ts` enforces it for every file
under `src/`, these included.
