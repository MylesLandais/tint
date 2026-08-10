import { Fragment, type ReactNode } from 'react'
import { isSupportedLanguage, lowlight } from './highlight'

/** The subset of hast lowlight actually emits. */
type HastText = { type: 'text'; value: string }
type HastElement = {
  type: 'element'
  tagName: string
  properties?: { className?: string[] | string }
  children: HastNode[]
}
type HastNode = HastText | HastElement | { type: string; children?: HastNode[] }

export type HighlightedCodeProps = {
  code: string
  /** A language name or alias. Unknown values render as plain text. */
  language?: string
  className?: string
  /** Render one addressable line per row. */
  lineNumbers?: boolean
  /** First displayed line number when lineNumbers is enabled. */
  startLine?: number
  /** One-based source lines to tint as highlighted. */
  highlightLines?: readonly number[]
  /** Literal terms to emphasize in the rendered code. */
  highlightWords?: readonly string[]
}

function toReact(node: HastNode, key: number): ReactNode {
  if (node.type === 'text') return (node as HastText).value

  if (node.type === 'element') {
    const element = node as HastElement
    const raw = element.properties?.className
    const className = Array.isArray(raw) ? raw.join(' ') : raw
    return (
      <span key={key} className={className}>
        {element.children.map(toReact)}
      </span>
    )
  }

  const children = (node as { children?: HastNode[] }).children ?? []
  return <Fragment key={key}>{children.map(toReact)}</Fragment>
}

/**
 * Renders `code` with syntax highlighting, walking lowlight's hast output into
 * elements rather than injecting HTML — nothing here is ever set as raw markup,
 * which matters because chat renders code that arrived over the wire.
 *
 * Colours come from `.hljs-*` rules in `src/styles/code-highlight.css`, which map
 * onto the `--tint-code-*` tokens, so highlighting follows the active palette.
 */
export function HighlightedCode({
  code,
  language,
  className,
  lineNumbers = false,
  startLine = 1,
  highlightLines = [],
  highlightWords = [],
}: HighlightedCodeProps) {
  if (!isSupportedLanguage(language)) {
    if (!lineNumbers && !highlightLines.length && !highlightWords.length) {
      return <code className={className}>{code}</code>
    }
    return (
      <code className={className}>
        {renderLines(code, undefined, lineNumbers, startLine, highlightLines, highlightWords)}
      </code>
    )
  }

  if (!lineNumbers && !highlightLines.length && !highlightWords.length) {
    const tree = lowlight.highlight(language as string, code)
    return (
      <code className={className}>{(tree.children as HastNode[]).map(toReact)}</code>
    )
  }

  return (
    <code className={className}>
      {renderLines(
        code,
        language,
        lineNumbers,
        startLine,
        highlightLines,
        highlightWords,
      )}
    </code>
  )
}

/**
 * A leaf run of text plus the `.hljs-*` classes of every element enclosing it.
 *
 * The stack is kept rather than flattened into one class list because
 * `code-highlight.css` carries a descendant rule (`.hljs-meta .hljs-string`);
 * collapsing the ancestry onto a single element would stop it matching.
 */
type Token = { text: string; stack: readonly string[] }

function tokenize(nodes: readonly HastNode[], stack: readonly string[], out: Token[]) {
  for (const node of nodes) {
    if (node.type === 'text') {
      out.push({ text: (node as HastText).value, stack })
      continue
    }
    if (node.type === 'element') {
      const element = node as HastElement
      const raw = element.properties?.className
      const className = Array.isArray(raw) ? raw.join(' ') : raw
      tokenize(element.children, className ? [...stack, className] : stack, out)
      continue
    }
    tokenize((node as { children?: HastNode[] }).children ?? [], stack, out)
  }
}

/** Break a token stream on newlines, so each line keeps its enclosing classes. */
function tokensByLine(tokens: readonly Token[]): Token[][] {
  const lines: Token[][] = [[]]
  for (const token of tokens) {
    const segments = token.text.split('\n')
    segments.forEach((segment, index) => {
      if (index > 0) lines.push([])
      if (segment) lines[lines.length - 1].push({ text: segment, stack: token.stack })
    })
  }
  return lines
}

/** Re-nest one token's ancestor stack around its text. */
function renderToken(token: Token, key: number, words: readonly string[]): ReactNode {
  let node: ReactNode = words.length ? markWords(token.text, words) : token.text
  for (let index = token.stack.length - 1; index >= 0; index -= 1) {
    node = <span className={token.stack[index]}>{node}</span>
  }
  return <Fragment key={key}>{node}</Fragment>
}

function markWords(value: string, words: readonly string[]): ReactNode {
  const pattern = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi')
  return value.split(pattern).map((part, index) =>
    words.some((word) => word.toLowerCase() === part.toLowerCase()) ? (
      <mark key={index} className="bg-tint-accent-soft text-inherit">
        {part}
      </mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  )
}

/**
 * Render `code` as addressable lines.
 *
 * The whole source is highlighted in one pass and the resulting tree is then
 * split on newlines. Highlighting each line separately — which this used to do —
 * hands the grammar one line of context at a time, so any construct that spans
 * lines (a block comment, a template literal, a triple-quoted string) restarts
 * its state on every row and colours as if the opening delimiter were never
 * there.
 */
function renderLines(
  code: string,
  language: string | undefined,
  lineNumbers: boolean,
  startLine: number,
  highlightLines: readonly number[],
  highlightWords: readonly string[],
) {
  const highlighted = new Set(highlightLines)
  const words = highlightWords.filter(Boolean)

  const tokens: Token[] = []
  if (language && isSupportedLanguage(language)) {
    tokenize(lowlight.highlight(language, code).children as HastNode[], [], tokens)
  } else {
    tokens.push({ text: code, stack: [] })
  }

  return tokensByLine(tokens).map((lineTokens, index) => {
    const lineNumber = startLine + index
    const content = lineTokens.map((token, tokenIndex) =>
      renderToken(token, tokenIndex, words),
    )
    return (
      <span
        key={lineNumber}
        data-code-line={lineNumber}
        data-highlighted={highlighted.has(lineNumber) || undefined}
        className={highlighted.has(lineNumber) ? 'block bg-tint-code-ink/10' : 'block'}
      >
        {lineNumbers ? (
          <span aria-hidden="true" className="mr-4 inline-block min-w-8 select-none text-right text-tint-code-muted/60">
            {lineNumber}
          </span>
        ) : null}
        {content.length ? content : '\u00a0'}
      </span>
    )
  })
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
