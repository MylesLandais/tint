import type { NodeViewProps } from '../contracts'

export type ScriptNodeConfiguration = {
  language: 'lua' | 'python' | 'typescript'
  sourceRef: string
  entrypoint?: string
  runtimeProfileId?: string
  permissions: string[]
}

export function ScriptNodeView({
  node,
  selected,
  validation,
  runtime,
}: NodeViewProps<ScriptNodeConfiguration>) {
  const label = node.presentation?.label ?? 'Script'
  const status =
    validation.some((issue) => issue.severity === 'error')
      ? 'invalid'
      : (runtime?.status ?? 'ready')
  const { language, sourceRef, entrypoint, runtimeProfileId, permissions } =
    node.configuration

  return (
    <article
      data-tint-graph-node
      data-kind="script"
      data-selected={selected ? 'true' : 'false'}
      data-status={status}
      className="tint-graph-node tint-graph-node--script"
    >
      <header className="tint-graph-node__header">
        <span className="tint-graph-node__kind">script · {language}</span>
        <span className="tint-graph-node__status" data-status={status}>
          {status}
        </span>
      </header>
      <h3 className="tint-graph-node__title">{label}</h3>
      <dl className="tint-graph-node__meta">
        <div>
          <dt>Source</dt>
          <dd>
            <code>{sourceRef}</code>
          </dd>
        </div>
        {entrypoint ? (
          <div>
            <dt>Entry</dt>
            <dd>
              <code>{entrypoint}</code>
            </dd>
          </div>
        ) : null}
        {runtimeProfileId ? (
          <div>
            <dt>Runtime</dt>
            <dd>{runtimeProfileId}</dd>
          </div>
        ) : null}
        <div>
          <dt>Permissions</dt>
          <dd>{permissions.length ? permissions.join(', ') : 'none'}</dd>
        </div>
      </dl>
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
