<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { FormFileValue, FormSubmitEnvelope, FormTransport, FormValues } from '../../../core/form/contracts'
  import { CHARACTER_CARD_FORM_SCHEMA } from '../../../core/character-card/schema'
  import type { TavernCardV2 } from '../../../core/character-card/types'
  import { cardFromFormValues, toCharacterCardFormValues, type CharacterCardFormValues } from '../../../core/character-card/form'
  import FormLayout from '../../form/FormLayout.svelte'

  type Props = {
    value: TavernCardV2
    onValueChange: (card: TavernCardV2) => void
    avatar?: FormFileValue | null
    onAvatarChange?: (file: FormFileValue | null) => void
    busy?: boolean
    error?: string | Snippet
    class?: string
    submitLabel?: string
    submittingLabel?: string
    hideSubmit?: boolean
    transport?: FormTransport<CharacterCardFormValues, unknown>
    onSubmit?: (envelope: FormSubmitEnvelope<CharacterCardFormValues>) => void | Promise<void>
  }

  let {
    value, onValueChange, avatar = null, onAvatarChange, busy = false, error,
    class: className, submitLabel = 'Save character', submittingLabel = 'Saving…',
    hideSubmit = false, transport, onSubmit,
  }: Props = $props()

  let values = $derived(toCharacterCardFormValues(value, avatar))

  function valuesChanged(next: FormValues) {
    const nextAvatar = (next.avatar ?? null) as FormFileValue | null
    if (nextAvatar !== avatar) onAvatarChange?.(nextAvatar)
    onValueChange(cardFromFormValues(next))
  }
</script>

<div class={className}>
  {#if error && typeof error !== 'string'}<div role="alert">{@render error()}</div>{/if}
  <FormLayout
    schema={CHARACTER_CARD_FORM_SCHEMA}
    {values}
    onValuesChange={valuesChanged}
    {busy}
    error={typeof error === 'string' ? error : undefined}
    {submitLabel}
    {submittingLabel}
    {hideSubmit}
    transport={transport as FormTransport<FormValues, unknown> | undefined}
    onSubmit={onSubmit as ((envelope: FormSubmitEnvelope<FormValues>) => void | Promise<void>) | undefined}
  />
</div>
