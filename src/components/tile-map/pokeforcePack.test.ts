import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('committed PokéForce map pack', () => {
  it('contains the source spawn region and laboratory records', () => {
    const root = path.resolve(import.meta.dirname, '../../..')
    const pack = JSON.parse(readFileSync(path.join(root, 'public/pokeforce/map.json'), 'utf8')) as {
      schema: string
      source: { archiveSha256: string; cacheSha256: string }
      maps: Record<string, { chunks: readonly unknown[] }>
    }
    expect(pack.schema).toBe('tint.pokeforce-map/v1')
    expect(pack.source.archiveSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(pack.source.cacheSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(pack.maps['0']?.chunks).toHaveLength(9)
    expect(pack.maps['56']?.chunks).toHaveLength(1)
  })
})
