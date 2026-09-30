import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import { safeHref } from './sanitize'

type HtmlNode = {
  type?: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HtmlNode[]
}

function restrictUrls() {
  return (tree: HtmlNode) => {
    const visit = (node: HtmlNode) => {
      if (node.type === 'element' && node.tagName === 'a' && node.properties) {
        const href = node.properties.href
        const safe = typeof href === 'string' ? safeHref(href) : undefined
        if (safe) {
          node.properties.href = safe
          if (safe.startsWith('http')) {
            node.properties.target = '_blank'
            node.properties.rel = ['noreferrer', 'noopener']
          }
        } else delete node.properties.href
      }
      if (node.type === 'element' && node.tagName === 'img' && node.properties) {
        const src = node.properties.src
        const safe = typeof src === 'string' ? safeHref(src) : undefined
        if (safe) node.properties.src = safe
        else delete node.properties.src
      }
      for (const child of node.children ?? []) visit(child)
    }
    visit(tree)
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(restrictUrls)
  .use(rehypeStringify)

/** GFM with raw HTML disabled and links limited to Tint's safe URL policy. */
export function renderChatMarkdown(markdown: string): string {
  return processor.processSync(markdown).toString()
}
