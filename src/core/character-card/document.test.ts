import { describe, expect, it } from 'vitest'
import { setAtPath } from '../form/contracts'
import {
  characterDocumentFormValues,
  characterDocumentFromFormValues,
  filterCharacterLibrary,
  hasCharacterDataEnvelope,
  type CharacterDocument,
} from './document'

describe('original character documents', () => {
  it('keeps unknown envelope, extension, and lore fields when editing an original V3 document', () => {
    const original: CharacterDocument = {
      spec: 'chara_card_v3', spec_version: '3.0', future_envelope: ['retain'],
      data: {
        name: 'Aster', future_data: { keep: true },
        extensions: { depth_prompt: { prompt: 'Before', future: 7 }, plugin: { nested: true } },
        character_book: { entries: [{ keys: ['archive'], content: 'Book', future_entry: 42 }] },
      },
    }
    const next = characterDocumentFromFormValues(
      setAtPath(characterDocumentFormValues(original), 'data.name', 'Nova'),
      hasCharacterDataEnvelope(original),
    )
    expect(next).toEqual({ ...original, data: { ...original.data, name: 'Nova' } })
    expect(original.data?.name).toBe('Aster')
  })

  it('keeps flattened V2 documents flattened and preserves custom fields', () => {
    const original: CharacterDocument = { spec: 'chara_card_v2', name: 'Aster', custom: 4 }
    const next = characterDocumentFromFormValues(
      setAtPath(characterDocumentFormValues(original), 'data.name', 'Nova'),
      hasCharacterDataEnvelope(original),
    )
    expect(next).toEqual({ spec: 'chara_card_v2', name: 'Nova', custom: 4 })
  })

  it('filters by tags without merging duplicate display names', () => {
    const items = [
      { id: 'first', name: 'Aster', tags: ['archive'] },
      { id: 'second', name: 'Aster', tags: ['sea'] },
    ]
    expect(filterCharacterLibrary(items, ' SEA ')).toEqual([items[1]])
  })
})
