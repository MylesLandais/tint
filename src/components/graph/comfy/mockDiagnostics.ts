import type { GraphDocument, ValidationIssue } from '../contracts'
import type { ComfyNodeConfiguration } from './types'

/**
 * Mock install inventory for UAT — not a real Comfy node/model scanner.
 * Produces ERROR (custom node missing) and WARN (model not found) issues.
 */
export type MockComfyInventory = {
  /** class_type values treated as unavailable custom nodes */
  missingCustomNodes: readonly string[]
  /** Checkpoint / LoRA / encoder filenames treated as absent on disk */
  missingModels: readonly string[]
}

export const defaultMockComfyInventory: MockComfyInventory = {
  missingCustomNodes: [
    // LTX custom pack node used by the official video_ltx2_3_t2v template.
    'TextGenerateLTX2Prompt',
  ],
  missingModels: [
    'ltx-2.3-22b-dev-fp8.safetensors',
  ],
}

export type NodeValidationMap = ReadonlyMap<string, readonly ValidationIssue[]>

export function mockComfyDiagnostics(
  document: GraphDocument,
  inventory: MockComfyInventory = defaultMockComfyInventory,
): NodeValidationMap {
  const map = new Map<string, ValidationIssue[]>()

  for (const node of document.nodes) {
    if (node.kind !== 'comfy.node') continue
    const config = node.configuration as ComfyNodeConfiguration
    const issues: ValidationIssue[] = []

    if (inventory.missingCustomNodes.includes(config.classType)) {
      issues.push({
        code: 'COMFY_CUSTOM_NODE_MISSING',
        severity: 'error',
        message: `ERROR: custom_node missing — "${config.classType}" is not installed`,
        path: 'configuration.classType',
      })
    }

    if (config.modelName && inventory.missingModels.includes(config.modelName)) {
      issues.push({
        code: 'COMFY_MODEL_NOT_FOUND',
        severity: 'warning',
        message: `WARN: Model not found — "${config.modelName}"`,
        path: 'configuration.modelName',
      })
    }

    if (issues.length) map.set(node.id, issues)
  }

  return map
}

export function flattenValidationIssues(
  validationByNodeId: NodeValidationMap,
): readonly ValidationIssue[] {
  return [...validationByNodeId.values()].flat()
}
