import type { GraphDocument } from '../../../components/graph/contracts'

/** Offline fixture used by docs and tests — no network, no SQL/PGQ. */
export const demoGraphDocument: GraphDocument = {
  schemaVersion: '0.1.0',
  id: 'graph:demo:automation-ontology',
  revision: 'r1',
  viewport: { x: 80, y: 40, zoom: 0.95 },
  metadata: {
    title: 'Intake → script → ontology',
    purpose: 'Phase 1 interactive graph viewer acceptance fixture',
  },
  groups: [],
  nodes: [
    {
      id: 'n-trigger',
      kind: 'trigger',
      position: { x: 0, y: 80 },
      presentation: {
        label: 'Webhook received',
        description: 'Starts the graph when an intake event arrives.',
        accent: '#0f6e56',
      },
      configuration: { event: 'webhook.intake' },
      ports: [
        {
          id: 'out:output',
          key: 'out',
          direction: 'output',
          cardinality: 'multiple',
        },
      ],
      capabilities: { movable: true, connectable: true, deletable: false },
    },
    {
      id: 'n-normalize',
      kind: 'action',
      position: { x: 280, y: 40 },
      presentation: {
        label: 'Normalize payload',
        description: 'Maps intake fields onto the working document shape.',
      },
      configuration: { action: 'normalize.json' },
      ports: [
        {
          id: 'in:input',
          key: 'in',
          direction: 'input',
          cardinality: 'multiple',
        },
        {
          id: 'out:output',
          key: 'out',
          direction: 'output',
          cardinality: 'multiple',
        },
      ],
    },
    {
      id: 'n-script',
      kind: 'script',
      position: { x: 560, y: 20 },
      presentation: {
        label: 'Enrich entities',
        description: 'TypeScript script node — edited in the inspector, not Monaco-in-node.',
      },
      configuration: {
        language: 'typescript',
        sourceRef: 'scripts/enrich-entities.ts',
        entrypoint: 'enrich',
        runtimeProfileId: 'ts-sandbox',
        permissions: ['net:read', 'store:write'],
      },
      ports: [
        {
          id: 'in:input',
          key: 'in',
          direction: 'input',
          cardinality: 'multiple',
        },
        {
          id: 'out:output',
          key: 'out',
          direction: 'output',
          cardinality: 'multiple',
        },
      ],
    },
    {
      id: 'n-python',
      kind: 'script',
      position: { x: 560, y: 260 },
      presentation: {
        label: 'Score candidates',
        description: 'Python scoring pass with a source reference only on the canvas.',
      },
      configuration: {
        language: 'python',
        sourceRef: 'scripts/score.py',
        entrypoint: 'score',
        runtimeProfileId: 'py-worker',
        permissions: ['cpu'],
      },
      ports: [
        {
          id: 'in:input',
          key: 'in',
          direction: 'input',
          cardinality: 'multiple',
        },
        {
          id: 'out:output',
          key: 'out',
          direction: 'output',
          cardinality: 'multiple',
        },
      ],
    },
    {
      id: 'n-class',
      kind: 'ontology.class',
      position: { x: 860, y: 120 },
      presentation: {
        label: 'Investigation',
        description: 'Ontology-grounded class node for the resulting entity.',
      },
      configuration: {
        iri: 'https://tint.example/ontology/Investigation',
      },
      ports: [
        {
          id: 'broader:input',
          key: 'broader',
          direction: 'input',
          cardinality: 'multiple',
        },
        {
          id: 'narrower:output',
          key: 'narrower',
          direction: 'output',
          cardinality: 'multiple',
        },
      ],
    },
  ],
  edges: [
    {
      id: 'e1',
      source: { nodeId: 'n-trigger', portId: 'out:output' },
      target: { nodeId: 'n-normalize', portId: 'in:input' },
      kind: 'control',
    },
    {
      id: 'e2',
      source: { nodeId: 'n-normalize', portId: 'out:output' },
      target: { nodeId: 'n-script', portId: 'in:input' },
      kind: 'control',
    },
    {
      id: 'e3',
      source: { nodeId: 'n-normalize', portId: 'out:output' },
      target: { nodeId: 'n-python', portId: 'in:input' },
      kind: 'control',
    },
    {
      id: 'e4',
      source: { nodeId: 'n-script', portId: 'out:output' },
      target: { nodeId: 'n-class', portId: 'broader:input' },
      kind: 'semantic',
    },
    {
      id: 'e5',
      source: { nodeId: 'n-python', portId: 'out:output' },
      target: { nodeId: 'n-class', portId: 'broader:input' },
      kind: 'semantic',
    },
  ],
}
