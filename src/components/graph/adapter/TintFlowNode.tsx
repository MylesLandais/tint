import type { CSSProperties } from 'react'
import { Handle, Position, type NodeProps } from '../../../vendor/xyflow'
import { useGraphAdapter } from './GraphAdapterContext'
import { findGraphNode, type GraphFlowNodeData } from './mappers'

/**
 * xyflow node shell. Application node views never import xyflow — they receive
 * tint `NodeViewProps` through the registry.
 */
export function TintFlowNode({
  id,
  data,
  selected,
}: NodeProps<GraphFlowNodeData>) {
  const { document, registry, readonly, dispatch, validationByNodeId } =
    useGraphAdapter()
  const graphNode = findGraphNode(document, id)
  const definition = registry.get(data.kind)
  const Render = definition?.render
  const validation = validationByNodeId.get(id) ?? []

  const inputPorts =
    graphNode?.ports.filter((port) => port.direction !== 'output') ?? []
  const outputPorts =
    graphNode?.ports.filter((port) => port.direction !== 'input') ?? []

  return (
    <div
      className="tint-graph-flow-node"
      data-accent={data.accent ?? undefined}
      style={
        data.accent
          ? ({ '--tint-graph-node-accent': data.accent } as CSSProperties)
          : undefined
      }
    >
      {inputPorts.map((port, index) => (
        <Handle
          key={port.id}
          id={port.id}
          type="target"
          position={Position.Left}
          isConnectable={!readonly && graphNode?.capabilities?.connectable !== false}
          style={{ top: `${((index + 1) / (inputPorts.length + 1)) * 100}%` }}
          title={port.key}
        />
      ))}

      {Render && graphNode ? (
        <Render
          node={graphNode}
          selected={Boolean(selected)}
          focused={Boolean(selected)}
          readonly={readonly}
          validation={validation}
          dispatch={dispatch}
        />
      ) : (
        <article className="tint-graph-node tint-graph-node--unknown">
          <header className="tint-graph-node__header">
            <span className="tint-graph-node__kind">{data.kind}</span>
            <span className="tint-graph-node__status" data-status="invalid">
              unknown
            </span>
          </header>
          <h3 className="tint-graph-node__title">{data.label}</h3>
          <p className="tint-graph-node__description">
            No NodeDefinition registered for kind <code>{data.kind}</code>.
          </p>
        </article>
      )}

      {outputPorts.map((port, index) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={Position.Right}
          isConnectable={!readonly && graphNode?.capabilities?.connectable !== false}
          style={{ top: `${((index + 1) / (outputPorts.length + 1)) * 100}%` }}
          title={port.key}
        />
      ))}
    </div>
  )
}
