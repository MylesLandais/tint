import type { GraphCommand } from './commands'
import type { GraphDocument, GraphEdge, GraphNode, RevisionToken } from './document'
import type { NodeRegistry } from './registry'

/**
 * Apply a command to a document, returning the next one.
 *
 * `InteractiveGraphView` is a controlled component: it owns no document state,
 * reports every command through `onCommand`, and offers the resulting document
 * through `onDocumentChange`. This is the function that connects the two, and
 * hosts running their own store can use it as the reference reducer.
 *
 * It exists because the view used to apply `node.configure` and `node.move`
 * itself, inline and with no opt-out, while reporting all eight command kinds.
 * A host feeding `onCommand` into its own store therefore double-applied exactly
 * those two and silently dropped the rest — `entity.delete` and `edge.connect`
 * had no producer at all, so deleting a node removed it from the canvas and left
 * it in the document, to reappear on the next update.
 *
 * Returns the same document reference when nothing changed, so a host can use
 * identity to skip a render.
 */
export function applyCommand(
  document: GraphDocument,
  command: GraphCommand,
  registry: NodeRegistry,
): GraphDocument {
  switch (command.type) {
    case 'node.move': {
      const moved = document.nodes.map((node) => {
        const position = command.positions[node.id]
        return position ? { ...node, position: { ...position } } : node
      })
      return commit(document, { nodes: moved })
    }

    case 'node.resize': {
      const resized = document.nodes.map((node) =>
        node.id === command.nodeId ? { ...node, size: { ...command.size } } : node,
      )
      return commit(document, { nodes: resized })
    }

    case 'node.configure': {
      const configured = document.nodes.map((node) =>
        node.id === command.nodeId
          ? { ...node, configuration: command.configuration }
          : node,
      )
      return commit(document, { nodes: configured })
    }

    case 'edge.connect': {
      const id = `${command.source.nodeId}:${command.source.portId}->${command.target.nodeId}:${command.target.portId}`
      // Reconnecting the same pair is a no-op rather than a duplicate edge.
      if (document.edges.some((edge) => edge.id === id)) return document
      const edge: GraphEdge = { id, source: command.source, target: command.target }
      return commit(document, { edges: [...document.edges, edge] })
    }

    case 'entity.delete': {
      const nodeIds = new Set(
        command.entities.filter((e) => e.kind === 'node').map((e) => e.id),
      )
      const edgeIds = new Set(
        command.entities.filter((e) => e.kind === 'edge').map((e) => e.id),
      )
      const groupIds = new Set(
        command.entities.filter((e) => e.kind === 'group').map((e) => e.id),
      )
      if (nodeIds.size + edgeIds.size + groupIds.size === 0) return document

      return commit(document, {
        nodes: document.nodes.filter((node) => !nodeIds.has(node.id)),
        // An edge whose endpoint is gone is not an edge. Leaving these behind is
        // how a document ends up referencing nodes that no longer exist.
        edges: document.edges.filter(
          (edge) =>
            !edgeIds.has(edge.id) &&
            !nodeIds.has(edge.source.nodeId) &&
            !nodeIds.has(edge.target.nodeId),
        ),
        groups: document.groups
          .filter((group) => !groupIds.has(group.id))
          .map((group) => ({
            ...group,
            childIds: group.childIds.filter((id) => !nodeIds.has(id)),
          })),
      })
    }

    case 'viewport.set': {
      const current = document.viewport
      const next = command.viewport
      if (
        current &&
        current.x === next.x &&
        current.y === next.y &&
        current.zoom === next.zoom
      ) {
        return document
      }
      return commit(document, { viewport: { ...next } })
    }

    case 'node.create': {
      // The registry is the single source for a new node's shape. Before this,
      // `createDefault` and `derivePorts` were declared on every NodeDefinition
      // and invoked nowhere — the demo fixture hand-wrote the ports its own
      // registry claimed to derive, and the two were kept in step by hand.
      const definition = registry.get(command.kind)
      if (!definition) return document

      const context = { graphId: document.id }
      const configuration = command.configuration ?? definition.createDefault(context)
      const node: GraphNode = {
        id: `${command.kind}-${document.nodes.length + 1}-${document.revision}`,
        kind: command.kind,
        position: { ...command.position },
        configuration,
        ports: [...definition.derivePorts(configuration, context)],
      }
      return commit(document, { nodes: [...document.nodes, node] })
    }

    // Selection is view state, not document state: it round-trips through
    // `selection` / `onSelectionChange` and never touches a revision.
    case 'selection.replace':
      return document
  }
}

function commit(
  document: GraphDocument,
  changes: Partial<GraphDocument>,
): GraphDocument {
  return { ...document, ...changes, revision: nextRevision(document.revision) }
}

/**
 * Local revision counter.
 *
 * Deliberately not a server revision: hosts that reconcile against an authority
 * should ignore this and stamp their own. It was duplicated verbatim in
 * `InteractiveGraphView` and `parseComfyWorkflow`.
 */
export function nextRevision(revision: RevisionToken): RevisionToken {
  const current = Number.parseInt(revision.replace(/^r/, ''), 10)
  return Number.isFinite(current) ? `r${current + 1}` : 'r1'
}
