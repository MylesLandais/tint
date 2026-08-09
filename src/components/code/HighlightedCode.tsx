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
        {renderLines(code.split('\n'), undefined, lineNumbers, startLine, highlightLines, highlightWords)}
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
        code.split('\n'),
        language,
        lineNumbers,
        startLine,
        highlightLines,
        highlightWords,
      )}
    </code>
  )
}

function renderLines(
  lines: string[],
  language: string | undefined,
  lineNumbers: boolean,
  startLine: number,
  highlightLines: readonly number[],
  highlightWords: readonly string[],
) {
  const highlighted = new Set(highlightLines)
  const words = highlightWords.filter(Boolean)
  return lines.map((line, index) => {
    const lineNumber = startLine + index
    const tree = language && isSupportedLanguage(language)
      ? lowlight.highlight(language, line)
      : { children: [{ type: 'text', value: line }] }
    const content = (tree.children as HastNode[]).map((node, nodeIndex) =>
      toReactWithWords(node, nodeIndex, words),
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

function toReactWithWords(node: HastNode, key: number, words: readonly string[]): ReactNode {
  if (!words.length) return toReact(node, key)
  if (node.type === 'element') {
    const element = node as HastElement
    const raw = element.properties?.className
    const className = Array.isArray(raw) ? raw.join(' ') : raw
    return (
      <span key={key} className={className}>
        {element.children.map((child, index) => toReactWithWords(child, index, words))}
      </span>
    )
  }
  if (node.type !== 'text') return toReact(node, key)
  const value = (node as HastText).value
  const pattern = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi')
  return value.split(pattern).map((part, index) =>
    words.some((word) => word.toLowerCase() === part.toLowerCase()) ? (
      <mark key={`${key}-${index}`} className="bg-tint-accent-soft text-inherit">
        {part}
      </mark>
    ) : (
      <Fragment key={`${key}-${index}`}>{part}</Fragment>
    ),
  )
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
