import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// House rules that live in plain CSS. Node-needing test: excluded from
// tsconfig.app.json like themes.test.ts and typechecked by tsconfig.node.json.
const STYLES = join(process.cwd(), 'src', 'styles')

const buttonCss = readFileSync(join(STYLES, 'button.css'), 'utf8')
const layoutCss = readFileSync(join(STYLES, 'layout-scale.css'), 'utf8')

describe('tint-button surface', () => {
  it('uses the 2px house radius — no pill divergence', () => {
    expect(buttonCss).toMatch(/\.tint-button\s*{[^}]*border-radius:\s*2px;/)
    expect(buttonCss).not.toMatch(/border-radius:\s*9999px|border-radius:\s*999px/)
  })
})

describe('reduced-motion colour/opacity guard', () => {
  it('snaps colour and opacity transitions under prefers-reduced-motion', () => {
    expect(layoutCss).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    expect(layoutCss).toMatch(/transition-property:[^;]*\bcolor\b[^;]*\bopacity\b/)
    expect(layoutCss).toMatch(/transition-duration:\s*0s\s*!important/)
  })

  it('keeps the motion tokens zeroed under reduced motion', () => {
    expect(layoutCss).toMatch(/--tint-motion-fast:\s*0ms/)
    expect(layoutCss).toMatch(/--tint-motion-base:\s*0ms/)
  })
})
