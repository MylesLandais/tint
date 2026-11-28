import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error -- plain ESM script; no declaration file.
import { renderIndex } from '../scripts/component-index.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')

describe('component index', () => {
  it('matches the public package surface (run node scripts/component-index.mjs)', () => {
    expect(readFileSync(path.join(ROOT, 'components.md'), 'utf8')).toBe(renderIndex())
  })

  it('is deterministic', () => {
    expect(renderIndex()).toBe(renderIndex())
  })
})
