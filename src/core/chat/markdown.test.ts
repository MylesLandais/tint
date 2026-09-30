import { describe, expect, it } from 'vitest'
import { renderChatMarkdown } from './markdown'

describe('renderChatMarkdown', () => {
  it('renders GFM without raw HTML', () => {
    const html = renderChatMarkdown('**Hello** ~~old~~\n\n| A | B |\n| - | - |\n| 1 | 2 |')
    expect(html).toContain('<strong>Hello</strong>')
    expect(html).toContain('<del>old</del>')
    expect(html).toContain('<table>')
    expect(renderChatMarkdown('<script>alert(1)</script>')).not.toContain('<script>')
  })

  it('rejects unsafe link targets after parsing', () => {
    const html = renderChatMarkdown('[bad](javascript:alert%281%29) [good](https://example.com)')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('href="https://example.com"')
  })

  it('applies the same URL policy to Markdown images', () => {
    const html = renderChatMarkdown('![bad](data:image/svg+xml;base64,PHN2Zy8+) ![good](https://example.com/a.png)')
    expect(html).not.toContain('data:image')
    expect(html).toContain('src="https://example.com/a.png"')
  })
})
