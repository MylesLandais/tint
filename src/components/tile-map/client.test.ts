import { describe, expect, it } from 'vitest'
import { createMockExplorationClient, createMockTileMap, createPokeforceExplorationClient, type PokeforceMapPack } from './index'

describe('createMockExplorationClient', () => {
  it('publishes accepted movement and revisions', async () => {
    const client = createMockExplorationClient(createMockTileMap())
    const notices: string[] = []
    client.subscribe(() => notices.push(client.getSnapshot().notice))
    const snapshot = await client.move('right')
    expect(snapshot.position).toEqual({ x: 13, y: 8 })
    expect(snapshot.revision).toBe(1)
    expect(notices).toEqual(['MoveIntent accepted · right'])
  })

  it('keeps position stable when terrain rejects movement', async () => {
    const document = createMockTileMap()
    const client = createMockExplorationClient({ ...document, spawn: { x: 1, y: 1 } })
    const snapshot = await client.move('left')
    expect(snapshot.position).toEqual({ x: 1, y: 1 })
    expect(snapshot.revision).toBe(0)
    expect(snapshot.notice).toContain('rejected')
  })
})

describe('createPokeforceExplorationClient', () => {
  it('traverses the verified outdoor and laboratory map pair', async () => {
    const pack: PokeforceMapPack = {
      schema: 'tint.pokeforce-map/v1',
      source: { archiveSha256: 'archive', cacheSha256: 'cache', maps: { '0': 'outdoor', '56': 'lab' } },
      maps: {
        '0': { name: 'outdoor', origin: [0, 0], size: [4, 4], spawn: [1, 1], chunks: [{ path: 'outdoor/m_0_0.bin', layerCount: 1, objectCount: 0, cells: [{ x: 1, y: 1, layer: 0, z: 0, source: 0, atlasX: 0, atlasY: 0, alternative: 0 }] }] },
        '56': { name: 'lab', origin: [0, 0], size: [4, 4], spawn: [1, 1], chunks: [{ path: 'lab/m_0_0.bin', layerCount: 1, objectCount: 0, cells: [{ x: 1, y: 1, layer: 0, z: 0, source: 0, atlasX: 0, atlasY: 0, alternative: 0 }] }] },
      },
    }
    const client = createPokeforceExplorationClient(pack)
    await client.move('right')
    const lab = await client.interact()
    expect(lab.document.id).toBe('pokeforce-56')
  })
})
