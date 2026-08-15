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

/**
 * The projections: one `GraphDocument`, rendered as something other than a node
 * editor.
 *
 * Pure functions plus thin views over them, deliberately. The editor is already
 * a projection of the document — the dependency one — and the open question
 * these exist to answer is whether the same document survives being read as a
 * network, a schedule, and a trace. Anything that turns out to need its own
 * document shape is that question being answered "no", and should stay visible
 * as such rather than get absorbed into a second contract.
 */
export { ForceGraphView } from './ForceGraphView'
export type { ForceGraphViewProps } from './ForceGraphView'
export { TimelineView } from './TimelineView'
export type { TimelineViewProps } from './TimelineView'

export { createForceLayout, forceLayout, stepForceLayout } from './projections/force'
export type { ForceLayoutOptions, ForceLayoutState } from './projections/force'
export { topologicalLanes } from './projections/dependency'
export type { DependencyProjection } from './projections/dependency'
export { projectTimeline } from './projections/timeline'
export type {
  GraphSpan,
  TimelineInterval,
  TimelineOptions,
  TimelineProjection,
  TimelineTrack,
  TimelineVariant,
} from './projections/timeline'

/**
 * The status vocabulary was already shipped in the node chrome but not
 * exported, so a host rendering its own legend beside these views had to
 * re-declare the seven names — which is how the three-vocabulary problem
 * `nodes/nodeStatus.ts` documents got started the first time.
 */
export { nodeStatusLabel, resolveNodeStatus } from './nodes/nodeStatus'
export type { NodeStatus } from './nodes/nodeStatus'

export {
  applyCommand,
  createNodeRegistry,
  emptySelection,
  flattenValidationIssues,
  nextRevision,
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
