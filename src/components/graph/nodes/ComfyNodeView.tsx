import type { NodeViewProps } from '../contracts'
import type { ComfyNodeConfiguration } from '../comfy/types'

function summaryWidgets(configuration: ComfyNodeConfiguration): string[] {
  if (configuration.isPrompt && configuration.promptText) {
    const text = configuration.promptText.trim().replace(/\s+/g, ' ')
    return [text.length > 96 ? `${text.slice(0, 96)}…` : text]
  }
  if (configuration.modelName) return [configuration.modelName]
  return configuration.widgets
    .filter((value): value is string | number | boolean =>
      ['string', 'number', 'boolean'].includes(typeof value),
    )
    .slice(0, 3)
    .map(String)
}

export function ComfyNodeView({
  node,
  selected,
  validation,
}: NodeViewProps<ComfyNodeConfiguration>) {
  const { classType, isPrompt, modelName } = node.configuration
  const errors = validation.filter((issue) => issue.severity === 'error')
  const warnings = validation.filter((issue) => issue.severity === 'warning')
  const status = errors.length ? 'error' : warnings.length ? 'warn' : 'ready'
  const lines = summaryWidgets(node.configuration)

  return (
    <article
      data-tint-graph-node
      data-kind="comfy.node"
      data-comfy-class={classType}
      data-selected={selected ? 'true' : 'false'}
      data-status={status}
      className="tint-graph-node tint-graph-node--comfy"
    >
      <header className="tint-graph-node__header">
        <span className="tint-graph-node__kind">
          {isPrompt ? 'prompt' : modelName ? 'model' : 'comfy'}
        </span>
        <span className="tint-graph-node__status" data-status={status}>
          {status === 'error' ? 'ERROR' : status === 'warn' ? 'WARN' : 'ready'}
        </span>
      </header>
      <h3 className="tint-graph-node__title">
        {node.presentation?.label ?? classType}
      </h3>
      <p className="tint-graph-node__description">{classType}</p>

      {lines.length ? (
        <ul className="tint-graph-node__widget-summary">
          {lines.map((line) => (
            <li key={line}>
              <code>{line}</code>
            </li>
          ))}
        </ul>
      ) : null}

      {validation.length ? (
        <ul className="tint-graph-node__issues" aria-label="Validation issues">
          {validation.map((issue) => (
            <li key={issue.code} data-severity={issue.severity}>
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="tint-graph-node__ports" aria-label="Ports">
        {node.ports.slice(0, 6).map((port) => (
          <li key={port.id} data-direction={port.direction}>
            <span className="tint-graph-node__port-key">{port.key}</span>
            <span className="tint-graph-node__port-dir">
              {port.dataType?.localName ?? port.direction}
            </span>
          </li>
        ))}
        {node.ports.length > 6 ? (
          <li className="tint-graph-node__ports-more">
            +{node.ports.length - 6} more ports
          </li>
        ) : null}
      </ul>
    </article>
  )
}
