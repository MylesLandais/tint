import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { DISPLAY_SCALE_OPTIONS } from '../core/theme/types.ts'

const css = readFileSync(path.join(import.meta.dirname, 'layout-scale.css'), 'utf8')

describe('display scale tokens', () => {
  it('scales the root font size from the browser default', () => {
    expect(css).toMatch(/html\s*\{\s*font-size:\s*calc\(100% \* var\(--tint-display-scale\)\);\s*\}/)
    expect(css).toMatch(/--tint-display-scale:\s*1;/)
  })

  it('defines a preset for every non-default option, and none extra', () => {
    const presets = [...css.matchAll(/:root\[data-display-scale='([a-z]+)'\]/g)].map((match) => match[1]).sort()
    const options = (DISPLAY_SCALE_OPTIONS as readonly { value: string }[]).map((option) => option.value).filter((value) => value !== 'default').sort()
    expect(presets).toEqual(options)
  })
})
