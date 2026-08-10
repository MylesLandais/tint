import { describe, expect, it } from 'vitest'
import { loadComfyLtx23WithMockDiagnostics } from '../fixtures/comfy/loadComfyFixture'
import {
  findComfyPromptNode,
  flattenValidationIssues,
  parseComfyWorkflow,
  updateComfyPrompt,
} from './index'
import type { ComfyWorkflow } from './types'

describe('parseComfyWorkflow', () => {
  it('expands the LTX-2.3 subgraph into nodes and edges', () => {
    const { document } = loadComfyLtx23WithMockDiagnostics()

    expect(document.metadata.source).toBe('subgraph')
    expect(document.metadata.sourceName).toBe('Text to Video (LTX-2.3)')
    expect(document.nodes.length).toBeGreaterThan(40)
    expect(document.edges.length).toBeGreaterThan(80)
    expect(document.nodes.every((node) => node.kind === 'comfy.node')).toBe(true)
    expect(document.nodes.every((node) => node.position.x >= 0 && node.position.y >= 0)).toBe(
      true,
    )
  })

  it('finds and updates the prompt widget', () => {
    const { document } = loadComfyLtx23WithMockDiagnostics()
    const promptNode = findComfyPromptNode(document)
    expect(promptNode).toBeDefined()
    expect(promptNode?.configuration.promptText).toMatch(/LTX-2\.3/)

    const next = updateComfyPrompt(document, 'A quiet rain on neon streets.')
    const updated = findComfyPromptNode(next)
    expect(updated?.configuration.promptText).toBe('A quiet rain on neon streets.')
    expect(next.revision).not.toBe(document.revision)
  })

  it('emits mock ERROR custom_node missing and WARN model not found', () => {
    const { validationByNodeId } = loadComfyLtx23WithMockDiagnostics()
    const issues = flattenValidationIssues(validationByNodeId)

    expect(issues.some((issue) => issue.code === 'COMFY_CUSTOM_NODE_MISSING')).toBe(true)
    expect(issues.some((issue) => issue.code === 'COMFY_MODEL_NOT_FOUND')).toBe(true)
    expect(
      issues.find((issue) => issue.code === 'COMFY_CUSTOM_NODE_MISSING')?.severity,
    ).toBe('error')
    expect(
      issues.find((issue) => issue.code === 'COMFY_MODEL_NOT_FOUND')?.severity,
    ).toBe('warning')
  })

  it('parses classic array-shaped root links when subgraphs are disabled', () => {
    const workflow: ComfyWorkflow = {
      version: 0.4,
      nodes: [
        {
          id: 1,
          type: 'CheckpointLoaderSimple',
          pos: [0, 0],
          inputs: [],
          outputs: [{ name: 'MODEL', type: 'MODEL', links: [1] }],
          widgets_values: ['model.safetensors'],
        },
        {
          id: 2,
          type: 'SaveVideo',
          pos: [200, 0],
          inputs: [{ name: 'video', type: 'VIDEO', link: 1 }],
          outputs: [],
          widgets_values: ['out'],
        },
      ],
      links: [[1, 1, 0, 2, 0, 'VIDEO']],
    }

    const document = parseComfyWorkflow(workflow, { expandSubgraphs: false })
    expect(document.nodes).toHaveLength(2)
    expect(document.edges).toHaveLength(1)
    expect(document.edges[0]?.source.nodeId).toBe('comfy-1')
    expect(document.edges[0]?.target.nodeId).toBe('comfy-2')
  })
})
