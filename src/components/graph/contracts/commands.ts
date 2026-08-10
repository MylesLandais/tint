import type {
  EndpointReference,
  GraphEntityReference,
  GraphId,
  GraphSelection,
  GraphViewport,
  Point,
  RevisionToken,
  Size,
} from './document'

export type GraphCommand =
  | { type: 'node.move'; nodeIds: string[]; positions: Record<string, Point> }
  | { type: 'node.resize'; nodeId: string; size: Size }
  | { type: 'node.create'; kind: string; position: Point; configuration?: unknown }
  | { type: 'node.configure'; nodeId: string; configuration: unknown }
  | { type: 'edge.connect'; source: EndpointReference; target: EndpointReference }
  | { type: 'entity.delete'; entities: GraphEntityReference[] }
  | { type: 'selection.replace'; selection: GraphSelection }
  | { type: 'viewport.set'; viewport: GraphViewport }

export type GraphCommandEnvelope<TCommand extends GraphCommand = GraphCommand> = {
  commandId: string
  graphId: GraphId
  baseRevision: RevisionToken
  actorId: string
  issuedAt: string
  idempotencyKey: string
  command: TCommand
}

export type CommandValidationResult = {
  ok: boolean
  issues: readonly { code: string; message: string; entityId?: string }[]
}

export type CommandCommitResult = {
  revision: RevisionToken
  applied: GraphCommand
}

export type GraphCommandBus = {
  validate(envelope: GraphCommandEnvelope): Promise<CommandValidationResult>
  dispatch(envelope: GraphCommandEnvelope): Promise<CommandCommitResult>
}
