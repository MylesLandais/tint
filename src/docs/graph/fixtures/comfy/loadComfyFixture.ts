import workflowJson from './video_ltx2_3_t2v.json'
import {
  parseComfyWorkflow,
  type ComfyWorkflow,
} from '../../../../components/graph/comfy'
import type {
  GraphDocument,
  NodeValidationMap,
} from '../../../../components/graph/contracts'
import { mockComfyDiagnostics } from '../../mockDiagnostics'

export const comfyLtx23Workflow = workflowJson as unknown as ComfyWorkflow

export function loadComfyLtx23Document(): GraphDocument {
  return parseComfyWorkflow(comfyLtx23Workflow, {
    expandSubgraphs: true,
    subgraphName: 'Text to Video (LTX-2.3)',
    graphId: 'comfy:video_ltx2_3_t2v',
    normalizeOrigin: true,
  })
}

export function loadComfyLtx23WithMockDiagnostics(): {
  document: GraphDocument
  validationByNodeId: NodeValidationMap
} {
  const document = loadComfyLtx23Document()
  return {
    document,
    validationByNodeId: mockComfyDiagnostics(document),
  }
}
