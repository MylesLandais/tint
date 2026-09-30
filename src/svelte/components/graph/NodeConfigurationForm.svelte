<script lang="ts">
  import type { FormSchema, FormValues } from '../../../core/form/contracts'
  import type { GraphCommand, GraphNode } from '../../../core/graph'
  import FormLayout from '../../form/FormLayout.svelte'

  let { node, schema, readonly = false, dispatch }: {
    node: GraphNode
    schema: FormSchema
    readonly?: boolean
    dispatch: (command: GraphCommand) => void
  } = $props()

  let draft = $state<FormValues>({})
  $effect(() => {
    const configuration = node.configuration
    draft = configuration != null && typeof configuration === 'object' && !Array.isArray(configuration)
      ? { ...(configuration as FormValues) }
      : { value: configuration }
  })
</script>

<FormLayout
  {schema}
  values={draft}
  onValuesChange={(next) => { draft = next }}
  readOnly={readonly}
  density="compact"
  submitLabel="Apply"
  submittingLabel="Applying…"
  onSubmit={(envelope) => dispatch({ type: 'node.configure', nodeId: node.id, configuration: envelope.values })}
/>
