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
export function HighlightedCode({ code, language, className }: HighlightedCodeProps) {
  if (!isSupportedLanguage(language)) {
    return <code className={className}>{code}</code>
  }

  const tree = lowlight.highlight(language as string, code)
  return (
    <code className={className}>{(tree.children as HastNode[]).map(toReact)}</code>
  )
}
