import type { NodeViewProps } from '../contracts'

export function GenericNodeView({
  node,
  selected,
  validation,
  runtime,
}: NodeViewProps) {
  const label = node.presentation?.label ?? node.kind
  const status =
    validation.some((issue) => issue.severity === 'error')
      ? 'invalid'
      : (runtime?.status ?? 'ready')

  return (
    <article
      data-tint-graph-node
      data-kind={node.kind}
      data-selected={selected ? 'true' : 'false'}
      data-status={status}
      className="tint-graph-node"
    >
      <header className="tint-graph-node__header">
        <span className="tint-graph-node__kind">{node.kind}</span>
        <span className="tint-graph-node__status" data-status={status}>
          {status}
        </span>
      </header>
      <h3 className="tint-graph-node__title">{label}</h3>
      {node.presentation?.description ? (
        <p className="tint-graph-node__description">{node.presentation.description}</p>
      ) : null}
      <ul className="tint-graph-node__ports" aria-label="Ports">
        {node.ports.map((port) => (
          <li key={port.id} data-direction={port.direction}>
            <span className="tint-graph-node__port-key">{port.key}</span>
            <span className="tint-graph-node__port-dir">{port.direction}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
