import type { GraphDocument } from '../../components/graph'

function node(
  id: string,
  kind: string,
  label: string,
  x: number,
  y: number,
  description?: string,
) {
  const isStart = kind === 'workflow.discovery'
  return {
    id,
    kind,
    position: { x, y },
    presentation: { label, description },
    configuration: { step: kind.replace(/^workflow\./, '') },
    ports: isStart
      ? [
          {
            id: 'out:output',
            key: 'out',
            direction: 'output' as const,
            cardinality: 'multiple' as const,
          },
        ]
      : [
          {
            id: 'in:input',
            key: 'in',
            direction: 'input' as const,
            cardinality: 'multiple' as const,
          },
          {
            id: 'out:output',
            key: 'out',
            direction: 'output' as const,
            cardinality: 'multiple' as const,
          },
        ],
    capabilities: { movable: false, connectable: false, deletable: false, editable: false },
  }
}

function edge(
  id: string,
  sourceId: string,
  targetId: string,
  metadata?: Record<string, unknown>,
) {
  return {
    id,
    source: { nodeId: sourceId, portId: 'out:output' },
    target: { nodeId: targetId, portId: 'in:input' },
    metadata,
  }
}

/** k2s token unlock pipeline — disposition edges live in edge metadata. */
export const k2sUnlockWorkflow: GraphDocument = {
  schemaVersion: '0.1.0',
  id: 'workflow:k2s-unlock',
  revision: 'r1',
  viewport: { x: 40, y: 20, zoom: 0.9 },
  metadata: { title: 'k2s-unlock', workflowName: 'k2s-unlock' },
  groups: [],
  nodes: [
    node('w-discover', 'workflow.discovery', 'Discovery', 0, 120, 'Watch domain for token drops'),
    node('w-policy', 'workflow.policy_eval', 'Policy eval', 220, 120),
    node('w-feed', 'workflow.feed_write', 'Feed write', 440, 20, 'Always write the candidate'),
    node('w-notify', 'workflow.notify', 'Notify', 440, 120),
    node('w-intent', 'workflow.intent_create', 'Intent create', 440, 220),
    node('w-queue', 'workflow.queue', 'Queue', 660, 220),
    node('w-exec', 'workflow.execute', 'Execute', 880, 220, 'k2s unlock + download'),
    node('w-validate', 'workflow.validate', 'Validate', 1100, 220),
  ],
  edges: [
    edge('e1', 'w-discover', 'w-policy'),
    edge('e2', 'w-policy', 'w-feed', { disposition: 'always' }),
    edge('e3', 'w-policy', 'w-notify', { disposition: 'matched' }),
    edge('e4', 'w-policy', 'w-intent', { disposition: 'auto_queue' }),
    edge('e5', 'w-intent', 'w-queue'),
    edge('e6', 'w-queue', 'w-exec'),
    edge('e7', 'w-exec', 'w-validate'),
  ],
}

/** YouTube poll + notify/cache path. */
export const youtubePollWorkflow: GraphDocument = {
  schemaVersion: '0.1.0',
  id: 'workflow:youtube-poll',
  revision: 'r1',
  viewport: { x: 40, y: 40, zoom: 0.95 },
  metadata: { title: 'youtube-poll', workflowName: 'youtube-poll' },
  groups: [],
  nodes: [
    node('y-discover', 'workflow.discovery', 'Discovery', 0, 100, 'Poll channel releases'),
    node('y-policy', 'workflow.policy_eval', 'Policy eval', 240, 100),
    node('y-feed', 'workflow.feed_write', 'Feed write', 480, 20),
    node('y-notify', 'workflow.notify', 'Notify', 480, 100),
    node('y-intent', 'workflow.intent_create', 'Intent create', 480, 200, 'Cache artifact'),
    node('y-queue', 'workflow.queue', 'Queue', 720, 200),
    node('y-exec', 'workflow.execute', 'Execute', 960, 200),
    node('y-validate', 'workflow.validate', 'Validate', 1200, 200),
  ],
  edges: [
    edge('ye1', 'y-discover', 'y-policy'),
    edge('ye2', 'y-policy', 'y-feed', { disposition: 'always' }),
    edge('ye3', 'y-policy', 'y-notify', { disposition: 'notify_and_cache' }),
    edge('ye4', 'y-policy', 'y-intent', { disposition: 'notify_and_cache' }),
    edge('ye5', 'y-intent', 'y-queue'),
    edge('ye6', 'y-queue', 'y-exec'),
    edge('ye7', 'y-exec', 'y-validate'),
  ],
}

export function workflowForName(name: string): GraphDocument {
  if (name === 'k2s-unlock') return k2sUnlockWorkflow
  if (name === 'youtube-poll') return youtubePollWorkflow
  return youtubePollWorkflow
}
