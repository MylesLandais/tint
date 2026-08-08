import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HighlightedCode } from './HighlightedCode'
import { isSupportedLanguage } from './highlight'

describe('HighlightedCode', () => {
  it('emits highlight.js token classes for a known language', () => {
    const { container } = render(
      <HighlightedCode code="const answer = 42" language="typescript" />,
    )

    expect(container.querySelector('.hljs-keyword')).not.toBeNull()
    expect(container.querySelector('.hljs-number')).not.toBeNull()
    expect(container.textContent).toBe('const answer = 42')
  })

  it('resolves aliases', () => {
    const { container } = render(<HighlightedCode code="const a = 1" language="ts" />)
    expect(container.querySelector('.hljs-keyword')).not.toBeNull()
  })

  it('falls back to plain text for an unknown language', () => {
    const { container } = render(
      <HighlightedCode code="whatever this is" language="brainfuck" />,
    )

    expect(container.querySelector('[class^="hljs-"]')).toBeNull()
    expect(container.textContent).toBe('whatever this is')
  })

  it('renders unchanged when no language is given', () => {
    const { container } = render(<HighlightedCode code="plain" />)
    expect(container.textContent).toBe('plain')
  })

  it('preserves code exactly, including characters that look like markup', () => {
    const code = '<div class="x">{a && b}</div>'
    const { container } = render(<HighlightedCode code={code} language="html" />)

    expect(container.textContent).toBe(code)
  })
})

describe('isSupportedLanguage', () => {
  it.each(['typescript', 'ts', 'tsx', 'js', 'json', 'bash', 'sh', 'html', 'python', 'py'])(
    'recognises %s',
    (language) => {
      expect(isSupportedLanguage(language)).toBe(true)
    },
  )

  it('rejects unknown and empty languages', () => {
    expect(isSupportedLanguage('nope')).toBe(false)
    expect(isSupportedLanguage(undefined)).toBe(false)
  })
})
