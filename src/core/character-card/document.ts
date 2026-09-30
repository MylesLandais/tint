import type { FormSchema, FormValues } from '../form/contracts'
import { CHARACTER_CARD_FORM_SCHEMA } from './schema'

/** The original V2/V3 payload, including host-specific and future fields. */
export type CharacterDocument = Record<string, unknown> & {
  spec: 'chara_card_v2' | 'chara_card_v3'
  spec_version?: string
  data?: Record<string, unknown>
}

export type CharacterLibraryItem = {
  id: string
  name: string
  tags: readonly string[]
  description?: string
  imageUrl?: string
}

export const CHARACTER_DOCUMENT_FORM_SCHEMA: FormSchema = {
  ...CHARACTER_CARD_FORM_SCHEMA,
  id: 'character-document',
  version: '1',
  title: 'Character details',
  description: undefined,
  sections: CHARACTER_CARD_FORM_SCHEMA.sections.map((section) => ({
    ...section,
    fields: section.fields
      .filter((field) => field.name !== 'avatar')
      .map((field) => field.name === 'data.extensions.depth_prompt.prompt'
        ? { ...field, description: 'Inserted at the chosen message depth.' }
        : field),
  })),
}

export function hasCharacterDataEnvelope(value: CharacterDocument): boolean {
  return value.data != null && typeof value.data === 'object' && !Array.isArray(value.data)
}

export function characterDocumentFormValues(value: CharacterDocument): FormValues {
  return hasCharacterDataEnvelope(value) ? value : { data: value }
}

export function characterDocumentFromFormValues(values: FormValues, enveloped: boolean): CharacterDocument {
  return (enveloped ? values : values.data) as CharacterDocument
}

export function filterCharacterLibrary(items: readonly CharacterLibraryItem[], query: string): CharacterLibraryItem[] {
  const search = query.trim().toLocaleLowerCase()
  return items.filter((item) =>
    [item.name, ...item.tags, item.description ?? ''].join(' ').toLocaleLowerCase().includes(search),
  )
}
