/**
 * Docs-only channel topology: room → inbound streams.
 * Not a public package — mirrors policy workflowDefinitions.
 */

import {
  createDefaultNodeRegistry,
  GenericNodeView,
  type GraphDocument,
  type GraphPort,
  type NodeDefinition,
  type NodeRegistry,
} from '../../components/graph'
import type { Channel, FeedDocument, Source } from '../../components/feed'
import { sourcesForChannel } from '../../components/feed'

function ports(
  specs: Array<Pick<GraphPort, 'key' | 'direction'> & Partial<GraphPort>>,
): GraphPort[] {
  return specs.map((spec) => ({
    id: `${spec.key}:${spec.direction}`,
    key: spec.key,
    direction: spec.direction,
    cardinality: spec.cardinality ?? 'multiple',
    dataType: spec.dataType,
    required: spec.required,
  }))
}

export const channelRoomDefinition: NodeDefinition = {
  kind: 'channel.room',
  version: '1',
  displayName: 'Channel',
  category: 'channel',
  createDefault: () => ({ role: 'room' }),
  derivePorts: () => ports([{ key: 'out', direction: 'output' }]),
  validate: async () => [],
  render: GenericNodeView,
}

export const channelStreamDefinition: NodeDefinition = {
  kind: 'channel.stream',
  version: '1',
  displayName: 'Stream',
  category: 'channel',
  createDefault: () => ({ role: 'stream' }),
  derivePorts: () =>
    ports([
      { key: 'in', direction: 'input' },
      { key: 'out', direction: 'output' },
    ]),
  validate: async () => [],
  render: GenericNodeView,
}

export function createChannelNodeRegistry(): NodeRegistry {
  const registry = createDefaultNodeRegistry()
  registry.register(channelRoomDefinition)
  registry.register(channelStreamDefinition)
  return registry
}

function roomNode(channel: Channel) {
  return {
    id: `room:${channel.id}`,
    kind: 'channel.room',
    position: { x: 40, y: 120 },
    presentation: {
      label: channel.name,
      description: `channel/${channel.slug}`,
    },
    configuration: {
      channelId: channel.id,
      slug: channel.slug,
    },
    ports: [
      {
        id: 'out:output',
        key: 'out',
        direction: 'output' as const,
        cardinality: 'multiple' as const,
      },
    ],
    capabilities: {
      movable: false,
      connectable: false,
      deletable: false,
      editable: false,
    },
  }
}

function streamNode(source: Source, index: number) {
  const y = 40 + index * 100
  return {
    id: `stream:${source.id}`,
    kind: 'channel.stream',
    position: { x: 320, y },
    presentation: {
      label: source.platform,
      description: source.handle,
    },
    configuration: {
      sourceId: source.id,
      platform: source.platform,
      workflowName: source.workflowName,
    },
    ports: [
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
    capabilities: {
      movable: false,
      connectable: false,
      deletable: false,
      editable: false,
    },
  }
}

/** Build a read-only fan-out graph for one channel room. */
export function channelTopologyDocument(
  document: FeedDocument,
  channelId: string,
): GraphDocument | null {
  const channel = document.channels.find((item) => item.id === channelId)
  if (!channel) return null
  const streams = sourcesForChannel(document, channelId)
  const nodes = [
    roomNode(channel),
    ...streams.map((source, index) => streamNode(source, index)),
  ]
  const edges = streams.map((source) => ({
    id: `e:${channel.id}->${source.id}`,
    source: { nodeId: `room:${channel.id}`, portId: 'out:output' },
    target: { nodeId: `stream:${source.id}`, portId: 'in:input' },
    metadata: {
      platform: source.platform,
      workflowName: source.workflowName,
      sourceId: source.id,
    },
  }))

  return {
    schemaVersion: '0.1.0',
    id: `channel-topology:${channel.slug}`,
    revision: 'r1',
    viewport: { x: 20, y: 20, zoom: 0.95 },
    metadata: {
      title: channel.name,
      path: `channel/${channel.slug}`,
    },
    groups: [],
    nodes,
    edges,
  }
}
