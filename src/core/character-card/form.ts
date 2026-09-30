import type { FormFileValue, FormValues } from '../form/contracts'
import type { TavernCardV2 } from './types'

export type CharacterCardFormValues = FormValues & {
  spec: TavernCardV2['spec']
  spec_version: TavernCardV2['spec_version']
  data: TavernCardV2['data']
  avatar?: FormFileValue | null
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
