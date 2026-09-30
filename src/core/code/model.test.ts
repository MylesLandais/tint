import { describe, expect, it } from 'vitest'
import { codeLanguageLabel, codeLines, codeTokens } from './model'

describe('framework-neutral code highlighting', () => {
  const source = ['const a = 1', '/* opens here', 'still comment', '*/', 'const b = 2'].join('\n')

  it('retains multi-line grammar context and source text', () => {
    const lines = codeLines(source, 'typescript', 5, [7])
    expect(lines).toHaveLength(5)
    expect(lines[2].number).toBe(7)
    expect(lines[2].highlighted).toBe(true)
    expect(lines[2].tokens.some((token) => token.stack.includes('hljs-comment'))).toBe(true)
    expect(lines.map((line) => line.tokens.map((token) => token.text).join('')).join('\n')).toBe(source)
  })

  it('marks literal words without losing nested syntax classes', () => {
    const lines = codeLines(source, 'typescript', 1, [], ['const', 'comment'])
    expect(lines.flatMap((line) => line.tokens.flatMap((token) => token.parts.filter((part) => part.marked).map((part) => part.text)))).toEqual(['const', 'comment', 'const'])
  })

  it('falls back to plain text for unknown grammars', () => {
    expect(codeTokens('<unsafe>', 'unknown')).toEqual([{ text: '<unsafe>', stack: [], parts: [{ text: '<unsafe>', marked: false }] }])
    expect(codeTokens('a+b', undefined, ['a+b'])[0]?.parts).toEqual([{ text: 'a+b', marked: true }])
    expect(codeLanguageLabel('typescript')).toBe('TypeScript')
  })
})
