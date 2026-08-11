import type {
  EndpointReference,
  GraphEntityReference,
  GraphSelection,
  GraphViewport,
  Point,
  Size,
} from './document'

/**
 * Everything a user can do to a graph, as data.
 *
 * The canvas reports these through `onCommand` and `applyCommand` turns one into
 * the next document — so a host can persist intent, undo it, or send it
 * somewhere, without the view ever owning state.
 *
 * Every variant here has a producer and a reducer. Four of them did not: they
 * described a shape nothing emitted and nothing applied, which is worse than
 * absent, because the union reads as a promise the component does not keep.
 */
export type GraphCommand =
  | { type: 'node.move'; nodeIds: readonly string[]; positions: Record<string, Point> }
  | { type: 'node.resize'; nodeId: string; size: Size }
  | { type: 'node.create'; kind: string; position: Point; configuration?: unknown }
  | { type: 'node.configure'; nodeId: string; configuration: unknown }
  | { type: 'edge.connect'; source: EndpointReference; target: EndpointReference }
  | { type: 'entity.delete'; entities: readonly GraphEntityReference[] }
  | { type: 'selection.replace'; selection: GraphSelection }
  | { type: 'viewport.set'; viewport: GraphViewport }
