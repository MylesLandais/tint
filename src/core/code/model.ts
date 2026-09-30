import { isSupportedLanguage, lowlight } from './highlight'

type HastText = { type: 'text'; value: string }
type HastElement = {
  type: 'element'
  properties?: { className?: string[] | string }
  children: HastNode[]
}
type HastNode = HastText | HastElement | { type: string; children?: HastNode[] }

export type CodePart = { text: string; marked: boolean }
export type CodeToken = { text: string; stack: readonly string[]; parts: readonly CodePart[] }
export type CodeLine = { number: number; highlighted: boolean; tokens: readonly CodeToken[] }

type RawToken = { text: string; stack: readonly string[] }

function flatten(nodes: readonly HastNode[], stack: readonly string[], out: RawToken[]) {
  for (const node of nodes) {
    if (node.type === 'text') {
      out.push({ text: (node as HastText).value, stack })
    } else if (node.type === 'element') {
      const element = node as HastElement
      const raw = element.properties?.className
      const className = Array.isArray(raw) ? raw.join(' ') : raw
      flatten(element.children, className ? [...stack, className] : stack, out)
    } else {
      flatten((node as { children?: HastNode[] }).children ?? [], stack, out)
    }
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function partsFor(text: string, words: readonly string[]): CodePart[] {
  const terms = words.filter(Boolean)
  if (!terms.length) return [{ text, marked: false }]
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
  return text.split(pattern).filter(Boolean).map((part) => ({
    text: part,
    marked: terms.some((term) => term.toLowerCase() === part.toLowerCase()),
  }))
}

/** Highlight once so multi-line grammar constructs retain their context. */
export function codeTokens(code: string, language?: string, highlightWords: readonly string[] = []): CodeToken[] {
  const raw: RawToken[] = []
  if (isSupportedLanguage(language)) flatten(lowlight.highlight(language!, code).children as HastNode[], [], raw)
  else raw.push({ text: code, stack: [] })
  return raw.map((token) => ({ ...token, parts: partsFor(token.text, highlightWords) }))
}

/** Addressable source lines with the same nested token classes as the whole-code view. */
export function codeLines(
  code: string,
  language?: string,
  startLine = 1,
  highlightLines: readonly number[] = [],
  highlightWords: readonly string[] = [],
): CodeLine[] {
  const lines: RawToken[][] = [[]]
  const highlighted = new Set(highlightLines)
  const raw = codeTokens(code, language)
  for (const token of raw) {
    token.text.split('\n').forEach((segment, index) => {
      if (index > 0) lines.push([])
      if (segment) lines[lines.length - 1].push({ text: segment, stack: token.stack })
    })
  }
  return lines.map((tokens, index) => ({
    number: startLine + index,
    highlighted: highlighted.has(startLine + index),
    tokens: tokens.map((token) => ({ ...token, parts: partsFor(token.text, highlightWords) })),
  }))
}

export function codeLanguageLabel(language?: string): string {
  if (!language) return 'Code'
  const labels: Record<string, string> = {
    bash: 'Bash', erlang: 'Erlang', java: 'Java', javascript: 'JavaScript',
    python: 'Python', rust: 'Rust', typescript: 'TypeScript',
  }
  return labels[language.toLowerCase()] ?? language.charAt(0).toUpperCase() + language.slice(1)
}
