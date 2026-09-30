import type { Component } from 'svelte'
import type {
  ForceLayoutOptions, GraphCommand, GraphDocument, GraphNode, GraphNodeRegistry,
  GraphSelection, GraphSpan, GraphViewport, NodeRuntimeSummary, NodeValidationMap,
  TimelineVariant, ValidationIssue,
} from '../../../core/graph'

export type SvelteNodeViewProps = {
  node: GraphNode
  selected: boolean
  focused: boolean
  readonly: boolean
  validation: readonly ValidationIssue[]
  runtime?: NodeRuntimeSummary
  dispatch: (command: GraphCommand) => void
}

export type SvelteNodeInspectorProps = {
  node: GraphNode
  readonly: boolean
  validation: readonly ValidationIssue[]
  dispatch: (command: GraphCommand) => void
}

export type InteractiveGraphViewProps = {
  document: GraphDocument
  registry?: GraphNodeRegistry
  readonly?: boolean
  selection?: GraphSelection
  validationByNodeId?: NodeValidationMap
  runtimeByNodeId?: ReadonlyMap<string, NodeRuntimeSummary>
  viewport?: GraphViewport
  class?: string
  className?: string
  showInspector?: boolean
  showFullscreenControl?: boolean
  nodeRenderers?: ReadonlyMap<string, Component<SvelteNodeViewProps>>
  inspectorRenderers?: ReadonlyMap<string, Component<SvelteNodeInspectorProps>>
  onDocumentChange?: (document: GraphDocument) => void
  onSelectionChange?: (selection: GraphSelection) => void
  onViewportChange?: (viewport: GraphViewport) => void
  onCommand?: (command: GraphCommand) => void
}

export type ForceGraphViewProps = {
  document: GraphDocument
  selection?: GraphSelection
  runtimeByNodeId?: ReadonlyMap<string, NodeRuntimeSummary>
  validationByNodeId?: NodeValidationMap
  layout?: ForceLayoutOptions
  static?: boolean
  class?: string
  className?: string
  height?: number
  onSelectionChange?: (selection: GraphSelection) => void
  onCommand?: (command: GraphCommand) => void
}

export type TimelineViewProps = {
  document: GraphDocument
  spans: readonly GraphSpan[]
  variant?: TimelineVariant
  selection?: GraphSelection
  class?: string
  className?: string
  onSpanChange?: (spanId: string, next: { start: number; end: number }) => void
  onSelectionChange?: (selection: GraphSelection) => void
  onCommand?: (command: GraphCommand) => void
}
