import { useEffect, useMemo, useState } from 'react'
import { FormLayout } from '../form'
import type { FormSchema, FormValues } from '../form/contracts'
import type { GraphCommand, GraphNode } from './contracts'
import { createGraphNodeFormTransport } from './contracts'

export function NodeInspectorForm({
  node,
  schema,
  readonly,
  dispatch,
}: {
  node: GraphNode
  schema: FormSchema
  readonly: boolean
  dispatch: (command: GraphCommand) => void
}) {
  const [draft, setDraft] = useState<FormValues>(() => asValues(node.configuration))

  useEffect(() => {
    setDraft(asValues(node.configuration))
  }, [node.id, node.configuration])

  const transport = useMemo(
    () => createGraphNodeFormTransport(dispatch, node.id),
    [dispatch, node.id],
  )

  return (
    <FormLayout
      schema={schema}
      values={draft}
      onValuesChange={setDraft}
      readonly={readonly}
      density="compact"
      submitLabel="Apply"
      submittingLabel="Applying…"
      transport={transport}
    />
  )
}

/**
 * The node's configuration, with anything unreasonable to print elided.
 *
 * A raw `JSON.stringify` put whatever a node held into the DOM as text. That was
 * fine until reference images arrived carrying base64 `data:` URLs, at which
 * point selecting a node with a 4 MB image rendered a multi-megabyte text node.
 * Images no longer embed their bytes, but the inspector shows host-supplied
 * configuration of any shape, so it clamps rather than trusting it.
 */
export function describeConfiguration(configuration: unknown): string {
  return JSON.stringify(
    configuration,
    (_key, value: unknown) =>
      typeof value === 'string' && value.length > MAX_INSPECTED_VALUE
        ? `${value.slice(0, MAX_INSPECTED_VALUE)}… (${value.length} chars)`
        : value,
    2,
  )
}

const MAX_INSPECTED_VALUE = 120

function asValues(configuration: unknown): FormValues {
  if (configuration != null && typeof configuration === 'object' && !Array.isArray(configuration)) {
    return { ...(configuration as FormValues) }
  }
  return { value: configuration }
}
