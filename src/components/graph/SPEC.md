# Graph component

Specification: [`docs/specs/interactive-graph-view.md`](../../../docs/specs/interactive-graph-view.md)

`InteractiveGraphView` is controlled — it holds no document state. It reports
every user intent through `onCommand` and offers the resulting document through
`onDocumentChange`; `applyCommand` is the reducer that connects them, and hosts
running their own store can use it directly.

Only `adapter/` may import `src/vendor/xyflow`, `graph.css` included. That is
checked by `src/vendor/boundary.test.ts`, not by convention.

The stylesheet ships to hosts as `tint/graph/styles.css`, like auth's — the
component does not import it.
