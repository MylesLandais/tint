/**
 * The graph canvas: contracts, the views that render them, and the ComfyUI
 * workflow parser.
 *
 * What is deliberately *not* here: `demoGraphDocument`, the LTX-2.3 workflow
 * fixture, and the mock run simulator. They lived in this barrel and were
 * re-exported from the root, which shipped a 5,017-line JSON fixture and six
 * public API names containing the word "mock" to every consumer — `files:
 * ["src"]` publishes the whole directory. They are docs material and now live in
 * `src/docs/graph/`.
 *
 * The stylesheet is a separate entry point, `tint/graph/styles.css`, like auth's.
 */
export { InteractiveGraphView } from './InteractiveGraphView'
export type { InteractiveGraphViewProps } from './InteractiveGraphView'

export {
  applyCommand,
  createGraphNodeFormTransport,
  createNodeRegistry,
  emptySelection,
  flattenValidationIssues,
  graphConfigureCommand,
  nextRevision,
  submitNodeConfiguration,
} from './contracts'
export type {
  EndpointReference,
  GraphCommand,
  GraphDocument,
  GraphEdge,
  GraphEntityReference,
  GraphGroup,
  GraphId,
  GraphNode,
  GraphPort,
  GraphSelection,
  GraphValidationContext,
  GraphViewport,
  NodeCapabilities,
  NodeContext,
  NodeDefinition,
  NodeDefinitionFilter,
  NodeInspectorProps,
  NodePresentation,
  NodeRegistry,
  NodeRuntimeSummary,
  NodeValidationMap,
  NodeViewProps,
  Point,
  Rect,
  RevisionToken,
  Size,
  TypeReference,
  ValidationIssue,
} from './contracts'

export { createDefaultNodeRegistry, defaultNodeDefinitions } from './nodes/defaultRegistry'
export { GenericNodeView } from './nodes/GenericNodeView'
export { ScriptNodeView } from './nodes/ScriptNodeView'
export type { ScriptNodeConfiguration } from './nodes/ScriptNodeView'

export { ComfyNodeView } from './nodes/ComfyNodeView'
export { comfyNodeDefinition } from './nodes/comfyNodeDefinition'
export {
  configureComfyNode,
  deriveEditableFields,
  findComfyPromptNode,
  isComfyWorkflow,
  parseComfyWorkflow,
  patchComfyConfiguration,
  readIntWidget,
  updateComfyPrompt,
} from './comfy'
export type {
  ComfyEditableField,
  ComfyNodeConfiguration,
  ComfyReferenceImage,
  ComfyWorkflow,
  ParseComfyWorkflowOptions,
} from './comfy'
