import { describe, expect, it } from 'vitest'
import {
  applyCommand,
  createDefaultGraphNodeRegistry,
  createGraphNodeRegistry,
  defaultGraphNodeDefinitions,
  type GraphDocument,
} from './index'

function emptyDocument(): GraphDocument {
  return {
    schemaVersion: '1',
    id: 'graph-1',
    revision: 'r0',
    nodes: [],
    edges: [],
    groups: [],
    metadata: {},
  }
}

describe('framework-neutral graph definitions', () => {
  it('creates the same four built-in kinds with their form schemas', () => {
    const registry = createDefaultGraphNodeRegistry()
    expect(registry.list().map((definition) => definition.kind)).toEqual([
      'trigger', 'action', 'script', 'ontology.class',
    ])
    expect(registry.require('script').formSchema?.id).toBe('graph.script')
    expect(defaultGraphNodeDefinitions.every((definition) => !('render' in definition))).toBe(true)
  })

  it('uses a core registry to create a script with the shared configuration and ports', async () => {
    const registry = createDefaultGraphNodeRegistry()
    const created = applyCommand(
      emptyDocument(),
      { type: 'node.create', kind: 'script', position: { x: 12, y: 34 } },
      registry,
    )
    const node = created.nodes[0]!
    expect(node.configuration).toMatchObject({
      language: 'typescript',
      sourceRef: 'scripts/untitled.ts',
      permissions: [],
    })
    expect(node.ports.map((port) => port.id)).toEqual(['in:input', 'out:output'])
    expect(created.revision).toBe('r1')

    const issues = await registry.require('script').validate(
      { ...node, configuration: { sourceRef: '' } },
      { graphId: created.id, nodes: created.nodes },
    )
    expect(issues.map((issue) => issue.code)).toEqual(['SCRIPT_SOURCE_REQUIRED'])
  })

  it('supports host definitions without any renderer', () => {
    const registry = createGraphNodeRegistry()
    registry.register({
      kind: 'host',
      version: '1',
      displayName: 'Host',
      category: 'test',
      createDefault: () => ({}),
      derivePorts: () => [],
      validate: async () => [],
    })
    expect(registry.require('host').displayName).toBe('Host')
  })
})
