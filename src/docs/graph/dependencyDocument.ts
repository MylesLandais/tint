import type { GraphDocument } from '../../core/graph'
import { docsGraphNodes } from '../generated/docsGraph'

/** A graph document from the generated component import adjacency list. */
export function dependencyDocument(): GraphDocument {
  return {
    schemaVersion: '0.1.0',
    id: 'graph:docs:component-dependencies',
    revision: 'r1',
    viewport: { x: 80, y: 260, zoom: .75 },
    metadata: {
      title: 'Tint component dependencies',
      purpose: 'Generated from the source import graph by scripts/gen-docs-graph.py',
    },
    groups: [],
    nodes: docsGraphNodes.map((node) => ({
      id: node.id,
      kind: 'action',
      position: node.position,
      presentation: {
        label: node.id,
        description: node.imports.length ? `Builds on ${node.imports.join(', ')}.` : 'No component imports.',
      },
      configuration: { action: 'docs.component' },
      ports: [
        { id: 'in:input', key: 'in', direction: 'input' as const, cardinality: 'multiple' as const },
        { id: 'out:output', key: 'out', direction: 'output' as const, cardinality: 'multiple' as const },
      ],
      capabilities: { movable: false, connectable: false, deletable: false },
    })),
    edges: docsGraphNodes.flatMap((node) => node.imports.map((dependency) => ({
      id: `e-${node.id}-${dependency}`,
      source: { nodeId: node.id, portId: 'out:output' },
      target: { nodeId: dependency, portId: 'in:input' },
      kind: 'control',
    }))),
  }
}
