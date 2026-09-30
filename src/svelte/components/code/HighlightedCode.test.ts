import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import HighlightedCode from './HighlightedCode.svelte'

describe('Svelte HighlightedCode', () => {
  it('preserves untrusted markup as text while rendering syntax classes', () => {
    const source = '<div class="x">{a && b}</div>'
    const { container } = render(HighlightedCode, { code: source, language: 'html' })
    expect(container.querySelector('code')?.textContent).toBe(source)
    expect(container.querySelector('code div')).toBeNull()
    expect(container.querySelector('[class^="hljs-"]')).not.toBeNull()
  })

  it('keeps spanning comments highlighted and addressable across source lines', () => {
    const { container } = render(HighlightedCode, {
      code: 'const a = 1\n/* opens\nstill comment\n*/', language: 'typescript',
      lineNumbers: true, highlightLines: [3], highlightWords: ['comment'],
    })
    expect(container.querySelectorAll('[data-code-line]')).toHaveLength(4)
    expect(container.querySelector('[data-code-line="3"]')).toHaveAttribute('data-highlighted', 'true')
    expect(container.querySelector('[data-code-line="3"] .hljs-comment')).not.toBeNull()
    expect(screen.getByText('comment', { selector: 'mark' })).toBeInTheDocument()
  })
})
