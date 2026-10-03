import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Docs and demo fixtures must stay synthetic: no real names, handles, local
 * paths or notes-vault content. Add terms here when a leak is found.
 */
const DENYLIST = [
  /\/home\/(?!visitor\b)/i,
  /Workspace-git/i,
  /warby/i,
  /\bmyles\b/i,
  /gmail\.com/i,
  /obsidian (vault|md)|daily notes/i,
  /linustechtips/i,
  /misskatie/i,
]

const SCANNED = ['src/docs', 'src/demos', 'public']
const SELF = 'src/docs/fixturesHygiene.test.ts'

describe('docs fixture hygiene', () => {
  it('contains no personal or real-world identifiers', () => {
    const files = execFileSync('git', ['ls-files', ...SCANNED], { encoding: 'utf8' })
      .split('\n')
      .filter((file) => file && file !== SELF && !/\.(png|wav|mp4|json)$/.test(file))
    const hits: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const pattern of DENYLIST) {
        if (pattern.test(text)) hits.push(`${file}: ${pattern}`)
      }
    }
    expect(hits).toEqual([])
  })
})
