import type { GraphDocument, GraphEdge, GraphNode } from '../../../components/graph'
import type { GraphSpan } from '../../../components/graph'

/**
 * The seed ontology for the projections demo — deliberately small.
 *
 * ```
 * Project ── Component ── Contract
 *    │            └─────── Implementation
 *    ├── Pipeline ── Task ── Artifact
 *    └── Agent ── Tool ── Run
 * ```
 *
 * Twelve nodes is enough to tell whether one document survives being read five
 * ways, and small enough that a wrong answer is visible rather than buried. The
 * `governed_by` edges are the point of interest: they put a permission in the
 * same graph as the thing it governs, rather than in a side table keyed by id.
 * If a projection has to special-case them, the claim that policy is just
 * another relationship is what failed.
 */
function entity(
  id: string,
  kind: OntologyKind,
  label: string,
  position: { x: number; y: number },
): GraphNode {
  return {
    id,
    kind,
    position,
    presentation: { label },
    configuration: {},
    ports: [
      { id: 'in', key: 'in', direction: 'input', cardinality: 'multiple' },
      { id: 'out', key: 'out', direction: 'output', cardinality: 'multiple' },
    ],
  }
}

export type OntologyKind =
  | 'Project'
  | 'Component'
  | 'Contract'
  | 'Implementation'
  | 'Pipeline'
  | 'Task'
  | 'Artifact'
  | 'Agent'
  | 'Tool'
  | 'Run'
  | 'Capability'

export type OntologyEdgeKind =
  | 'contains'
  | 'depends_on'
  | 'implements'
  | 'produces'
  | 'invokes'
  | 'governed_by'

function relation(
  id: string,
  source: string,
  target: string,
  kind: OntologyEdgeKind,
): GraphEdge {
  return {
    id,
    source: { nodeId: source, portId: 'out' },
    target: { nodeId: target, portId: 'in' },
    kind,
  }
}

const nodes: readonly GraphNode[] = [
  entity('project', 'Project', 'Endless Space', { x: 0, y: 0 }),
  entity('component', 'Component', 'Gateway', { x: 220, y: -120 }),
  entity('contract', 'Contract', 'automation-v1', { x: 440, y: -180 }),
  entity('implementation', 'Implementation', 'endless-auto', { x: 440, y: -60 }),
  entity('pipeline', 'Pipeline', 'youtube_watch_ab', { x: 220, y: 40 }),
  entity('task-fetch', 'Task', 'Fetch captions', { x: 440, y: 20 }),
  entity('task-judge', 'Task', 'Judge output', { x: 640, y: 20 }),
  entity('artifact', 'Artifact', 'Eval row', { x: 840, y: 20 }),
  entity('agent', 'Agent', 'Maya', { x: 220, y: 200 }),
  entity('tool', 'Tool', 'CallTool: transcribe', { x: 440, y: 200 }),
  entity('run', 'Run', 'Run 4f21', { x: 640, y: 200 }),
  entity('cap-network', 'Capability', 'network.fetch', { x: 640, y: 340 }),
]

const edges: readonly GraphEdge[] = [
  relation('e-project-component', 'project', 'component', 'contains'),
  relation('e-project-pipeline', 'project', 'pipeline', 'contains'),
  relation('e-project-agent', 'project', 'agent', 'contains'),
  relation('e-component-contract', 'component', 'contract', 'contains'),
  relation('e-impl-contract', 'implementation', 'contract', 'implements'),
  relation('e-pipeline-fetch', 'pipeline', 'task-fetch', 'contains'),
  relation('e-fetch-judge', 'task-fetch', 'task-judge', 'depends_on'),
  relation('e-judge-artifact', 'task-judge', 'artifact', 'produces'),
  relation('e-agent-tool', 'agent', 'tool', 'contains'),
  relation('e-tool-run', 'tool', 'run', 'invokes'),
  relation('e-run-fetch', 'run', 'task-fetch', 'depends_on'),
  // Policy, as a relationship. Both a task and a tool are governed by the same
  // capability — which is exactly the shape a side table makes hard to see.
  relation('e-fetch-cap', 'task-fetch', 'cap-network', 'governed_by'),
  relation('e-tool-cap', 'tool', 'cap-network', 'governed_by'),
]

export const ontologyDocument: GraphDocument = {
  schemaVersion: '1',
  id: 'ontology-demo',
  revision: 'r1',
  nodes,
  edges,
  groups: [],
  metadata: { seed: 'projections demo' },
}

/**
 * One run over that ontology. Times are relative to zero — only differences
 * matter to the projection — and the parent chain is what the trace variant
 * indents by.
 */
export const ontologySpans: readonly GraphSpan[] = [
  { id: 'span-run', nodeId: 'run', start: 0, end: 4200, status: 'succeeded' },
  {
    id: 'span-fetch',
    nodeId: 'task-fetch',
    start: 120,
    end: 1900,
    status: 'succeeded',
    parentSpanId: 'span-run',
  },
  {
    id: 'span-tool',
    nodeId: 'tool',
    start: 300,
    end: 1700,
    status: 'succeeded',
    parentSpanId: 'span-fetch',
  },
  {
    id: 'span-judge',
    nodeId: 'task-judge',
    start: 1900,
    end: 3800,
    status: 'failed',
    parentSpanId: 'span-run',
  },
  {
    id: 'span-judge-retry',
    nodeId: 'task-judge',
    label: 'Judge output (retry)',
    start: 3800,
    end: 4200,
    status: 'succeeded',
    parentSpanId: 'span-run',
  },
]
