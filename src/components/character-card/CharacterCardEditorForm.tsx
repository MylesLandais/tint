import React, { type ReactNode } from 'react'
import { FormLayout } from '../form'
import type { FormFileValue, FormSubmitEnvelope, FormTransport, FormValues } from '../form/contracts'
import { CHARACTER_CARD_FORM_SCHEMA } from './schema'
import type { TavernCardV2 } from './types'

void React

export type CharacterCardFormValues = FormValues & {
  spec: TavernCardV2['spec']
  spec_version: TavernCardV2['spec_version']
  data: TavernCardV2['data']
  avatar?: FormFileValue | null
}

export type CharacterCardEditorFormProps = {
  value: TavernCardV2
  onValueChange: (card: TavernCardV2) => void
  avatar?: FormFileValue | null
  onAvatarChange?: (file: FormFileValue | null) => void
  busy?: boolean
  error?: ReactNode
  className?: string
  submitLabel?: string
  submittingLabel?: string
  hideSubmit?: boolean
  transport?: FormTransport<CharacterCardFormValues, unknown>
  onSubmit?: (envelope: FormSubmitEnvelope<CharacterCardFormValues>) => void | Promise<void>
}

export function toCharacterCardFormValues(
  card: TavernCardV2,
  avatar?: FormFileValue | null,
): CharacterCardFormValues {
  return { ...card, avatar: avatar ?? null }
}

export function cardFromFormValues(values: FormValues): TavernCardV2 {
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: (values.data ?? {}) as TavernCardV2['data'],
  }
}

export function CharacterCardEditorForm({
  value,
  onValueChange,
  avatar = null,
  onAvatarChange,
  busy,
  error,
  className,
  submitLabel = 'Save character',
  submittingLabel = 'Saving…',
  hideSubmit,
  transport,
  onSubmit,
}: CharacterCardEditorFormProps) {
  return (
    <FormLayout
      schema={CHARACTER_CARD_FORM_SCHEMA}
      values={toCharacterCardFormValues(value, avatar)}
      onValuesChange={(next) => {
        const nextAvatar = (next.avatar ?? null) as FormFileValue | null
        if (nextAvatar !== avatar) onAvatarChange?.(nextAvatar)
        onValueChange(cardFromFormValues(next))
      }}
      busy={busy}
      error={error}
      className={className}
      submitLabel={submitLabel}
      submittingLabel={submittingLabel}
      hideSubmit={hideSubmit}
      transport={transport as FormTransport<FormValues, unknown> | undefined}
      onSubmit={onSubmit as FormLayoutOnSubmit | undefined}
    />
  )
}

type FormLayoutOnSubmit = (envelope: FormSubmitEnvelope<FormValues>) => void | Promise<void>
