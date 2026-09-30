<script lang="ts">
  import type { Snippet } from 'svelte'
  import { createCredentialFormSchema } from '../../../core/form/schemas'
  import FormLayout from '../../form/FormLayout.svelte'
  import type { IdentifierSignInFormLabels } from './types'

  type Props = {
    identifier: string
    password: string
    busy?: boolean
    error?: string | Snippet
    labels: IdentifierSignInFormLabels
    identifierPlaceholder?: string
    passwordPlaceholder?: string
    onIdentifierChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onSubmit: () => void | Promise<void>
    class?: string
  }

  let {
    identifier, password, busy = false, error, labels,
    identifierPlaceholder, passwordPlaceholder,
    onIdentifierChange, onPasswordChange, onSubmit, class: className,
  }: Props = $props()

  let schema = $derived(createCredentialFormSchema({
    identifier: labels.identifier,
    password: labels.password,
    showPassword: labels.showPassword,
    hidePassword: labels.hidePassword,
    identifierPlaceholder,
    passwordPlaceholder,
  }))

  function valuesChanged(values: Record<string, unknown>) {
    const nextIdentifier = typeof values.identifier === 'string' ? values.identifier : identifier
    const nextPassword = typeof values.password === 'string' ? values.password : password
    if (nextIdentifier !== identifier) onIdentifierChange(nextIdentifier)
    if (nextPassword !== password) onPasswordChange(nextPassword)
  }
</script>

<div class={['tint-auth-form', className].filter(Boolean).join(' ')}>
  {#if error && typeof error !== 'string'}<div role="alert">{@render error()}</div>{/if}
  <FormLayout
    {schema}
    values={{ identifier, password }}
    onValuesChange={valuesChanged}
    {busy}
    error={typeof error === 'string' ? error : undefined}
    submitLabel={labels.submit}
    submittingLabel={labels.submitting}
    onSubmit={() => onSubmit()}
  />
</div>

<style>.tint-auth-form { display: grid; gap: var(--tint-space-3); }</style>
