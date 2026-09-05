import { describe, expect, it } from 'vitest'
import { createPokeforceTileMap, type PokeforceMapPack } from './index'

const pack: PokeforceMapPack = {
  schema: 'tint.pokeforce-map/v1',
  source: { archiveSha256: 'archive', cacheSha256: 'cache', maps: { '0': 'johto_production' } },
  maps: {
    '0': {
      name: 'johto_production',
      origin: [2528, 960],
      size: [96, 96],
      spawn: [2586, 1011],
      chunks: [{ path: 'johto_production/m_2560_992.bin', layerCount: 1, objectCount: 0, cells: [{ x: 2586, y: 1011, layer: 0, z: 0, source: 4, atlasX: 2, atlasY: 3, alternative: 0 }] }],
    },
  },
}

describe('createPokeforceTileMap', () => {
  it('preserves decoded coordinates and source atlas metadata', () => {
    const document = createPokeforceTileMap(pack)
    expect(document.id).toBe('pokeforce-0')
    expect(document.spawn).toEqual({ x: 58, y: 51 })
    expect(document.cells[0]).toMatchObject({ x: 58, y: 51, source: 4, atlasX: 2, atlasY: 3 })
  })
})
