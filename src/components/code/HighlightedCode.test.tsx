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

  it('supports Erlang and line metadata', () => {
    const { container } = render(
      <HighlightedCode
        code={'greet(Name) -> ok.\nnext().'}
        language="erl"
        lineNumbers
        highlightLines={[2]}
      />,
    )

    expect(container.querySelectorAll('[data-code-line]')).toHaveLength(2)
    expect(container.querySelector('[data-code-line="2"]')).toHaveAttribute(
      'data-highlighted',
      'true',
    )
    expect(container.textContent).toContain('greet(Name) -> ok.')
  })
})

describe('HighlightedCode multi-line constructs', () => {
  const blockComment = ['const a = 1', '/* opens here', '   still comment', '*/', 'const b = 2'].join('\n')

  it('keeps a block comment commented on every line it spans', () => {
    const { container } = render(
      <HighlightedCode code={blockComment} language="typescript" lineNumbers />,
    )

    // Each line used to be highlighted in isolation, so the grammar restarted
    // with no memory of the opening `/*` and lines 3-4 came back uncoloured.
    const lines = [3, 4].map((line) =>
      container.querySelector(`[data-code-line="${line}"]`),
    )
    for (const line of lines) {
      expect(line?.querySelector('.hljs-comment')).not.toBeNull()
    }
  })

  it('splits without dropping or duplicating source text', () => {
    const { container } = render(
      <HighlightedCode code={blockComment} language="typescript" lineNumbers />,
    )
    const rendered = Array.from(container.querySelectorAll('[data-code-line]'))
      .map((line) => line.textContent?.replace(/^\d+/, ''))
      .join('\n')
    expect(rendered).toBe(blockComment)
  })

  it('marks highlighted words both inside and outside a spanning construct', () => {
    const { container } = render(
      <HighlightedCode
        code={blockComment}
        language="typescript"
        highlightWords={['const', 'comment']}
      />,
    )
    // `const` twice on the code lines, `comment` once inside the block comment.
    expect(
      Array.from(container.querySelectorAll('mark')).map((mark) => mark.textContent),
    ).toEqual(['const', 'comment', 'const'])
  })
})

describe('isSupportedLanguage', () => {
  it.each(['typescript', 'ts', 'tsx', 'js', 'json', 'bash', 'sh', 'html', 'python', 'py', 'erlang', 'erl'])(
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
