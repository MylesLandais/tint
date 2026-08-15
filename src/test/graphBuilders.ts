import type {
  GraphDocument,
  GraphEdge,
  GraphNode,
} from '../components/graph/contracts'

/**
 * Minimal builders for graph tests.
 *
 * Here rather than beside the projections because `package.json`'s `files`
 * excludes `src/test` but not every non-`.test.ts` module under
 * `src/components` — a helper sitting next to the code it tests would have been
 * published to consumers. Demo material has the same problem and the same
 * answer: it lives in `src/docs/graph/`. See the note at the top of the graph
 * barrel about the last fixture that shipped.
 */
export function node(id: string, kind = 'generic', label?: string): GraphNode {
  return {
    id,
    kind,
    position: { x: 0, y: 0 },
    configuration: {},
    ports: [
      { id: 'in', key: 'in', direction: 'input', cardinality: 'single' },
      { id: 'out', key: 'out', direction: 'output', cardinality: 'single' },
    ],
    ...(label != null ? { presentation: { label } } : {}),
  }
}

export function edge(
  id: string,
  source: string,
  target: string,
  sourcePort = 'out',
  targetPort = 'in',
  kind?: string,
): GraphEdge {
  return {
    id,
    source: { nodeId: source, portId: sourcePort },
    target: { nodeId: target, portId: targetPort },
    ...(kind != null ? { kind } : {}),
  }
}

export function documentOf(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
): GraphDocument {
  return {
    schemaVersion: '1',
    id: 'test',
    revision: 'r1',
    nodes,
    edges,
    groups: [],
    metadata: {},
  }
}
