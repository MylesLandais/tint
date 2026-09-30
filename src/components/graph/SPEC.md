# Graph component

Specification: [`docs/specs/interactive-graph-view.md`](../../../docs/specs/interactive-graph-view.md)

`InteractiveGraphView` is the Svelte SVG canvas. It receives a host-owned
`GraphDocument`, reports each user intent through `onCommand`, and offers the
reduced document through `onDocumentChange`. The host passes the new document
back to persist it. `applyCommand`, the node registry, and projection math live
in plain TypeScript under `src/core/graph`.

The Svelte renderer and its inspector live under `src/svelte/components/graph`.
Its styles are scoped to those components. The legacy
`@nebula/tint/graph/styles.css` subpath remains a semantic compatibility file
for consumers that still import it; it no longer loads a graph engine.

## Projections

| Projection | Pure function | Svelte view |
| --- | --- | --- |
| Dependency | `topologicalLanes` | `InteractiveGraphView` |
| Network | `forceLayout`, `createForceLayout`, `stepForceLayout` | `ForceGraphView` |
| Schedule, trace, range | `projectTimeline` | `TimelineView` |

All three views read the same `GraphDocument`. Timeline spans are a separate
host-owned overlay. Range edits report `onSpanChange`, while graph document edits
report `GraphCommand` values. The force layout sorts stable node IDs before
seeding positions so the same document has a deterministic layout.
