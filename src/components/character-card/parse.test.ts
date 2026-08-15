import { describe, expect, it } from 'vitest'
import { emptyTavernCard, parseTavernCard, serializeTavernCard } from './parse'
import { embedTavernCard, extractTavernCard } from './png'

describe('parseTavernCard', () => {
  it('upgrades a V1 flat card and fills V2 defaults', () => {
    const card = parseTavernCard({ name: 'Aiko', first_mes: 'Hello.', description: 'A barista.' })
    expect(card.spec).toBe('chara_card_v2')
    expect(card.data.name).toBe('Aiko')
    expect(card.data.first_mes).toBe('Hello.')
    expect(card.data.alternate_greetings).toEqual([])
    expect(card.data.extensions).toMatchObject({ talkativeness: 0.5 })
  })

  it('never drops unknown extension keys', () => {
    const card = parseTavernCard({
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: 'Aiko',
        extensions: { talkativeness: 0.8, 'my_plugin/data': { keep: true } },
      },
    })
    expect(card.data.extensions['my_plugin/data']).toEqual({ keep: true })
    expect(card.data.extensions.talkativeness).toBe(0.8)
  })
})

describe('PNG chara chunk', () => {
  it('round-trips a card through a PNG tEXt chunk', () => {
    const card = emptyTavernCard()
    card.data.name = 'Aiko'
    card.data.extensions.custom = { note: 'keep me' }
    const png = embedTavernCard(card)
    const read = extractTavernCard(png)
    expect(read.data.name).toBe('Aiko')
    expect(read.data.extensions.custom).toEqual({ note: 'keep me' })
  })

  it('serializes JSON that parseTavernCardJson can read back', () => {
    const card = emptyTavernCard()
    card.data.name = 'Ren'
    const json = serializeTavernCard(card)
    expect(json).toContain('"spec": "chara_card_v2"')
    expect(JSON.parse(json).data.name).toBe('Ren')
  })
})
