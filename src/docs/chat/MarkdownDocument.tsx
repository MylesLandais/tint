import type { ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { safeHref } from '../../components/chat'

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-5 text-4xl font-semibold tracking-tight text-tint-ink sm:text-5xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-12 mb-4 border-t border-tint-border pt-10 text-2xl font-semibold tracking-tight text-tint-ink">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-3 text-xl font-semibold tracking-tight text-tint-ink">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-6 mb-2 text-base font-semibold text-tint-ink">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="my-4 max-w-3xl leading-7 text-tint-muted">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 max-w-3xl list-disc space-y-2 pl-6 text-tint-muted">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 max-w-3xl list-decimal space-y-2 pl-6 text-tint-muted">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-tint-ink">{children}</strong>
  ),
  a: ({ children, href }) => {
    const safe = safeHref(href)
    if (!safe) return <span>{children}</span>

    return (
      <a
        href={safe}
        className="font-medium text-tint-accent underline decoration-tint-accent/35 underline-offset-3 hover:decoration-current"
        {...(safe.startsWith('http')
          ? { target: '_blank' as const, rel: 'noreferrer noopener' }
          : {})}
      >
        {children}
      </a>
    )
  },
  blockquote: ({ children }) => (
    <blockquote className="my-6 max-w-3xl border-l-2 border-tint-accent bg-tint-accent-soft px-5 py-1 text-tint-muted">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-5 max-w-full overflow-x-auto rounded-xl border border-tint-code-border bg-tint-code p-4 text-[13px] leading-6 text-tint-code-ink shadow-sm">
      {children}
    </pre>
  ),
  code: ({ children, className }) => {
    const isBlock = Boolean(className?.startsWith('language-'))
    return (
      <code
        className={
          isBlock
            ? className
            : 'rounded bg-tint-surface px-1.5 py-0.5 text-[0.84em] text-tint-ink'
        }
      >
        {children}
      </code>
    )
  },
  table: ({ children }) => (
    <div className="my-6 max-w-full overflow-x-auto rounded-xl border border-tint-border bg-tint-panel">
      <table className="w-full min-w-xl border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-tint-surface text-tint-ink">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-tint-border px-4 py-3 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-tint-border px-4 py-3 align-top leading-6 text-tint-muted last:border-b-0">
      {children}
    </td>
  ),
  hr: () => <hr className="my-10 border-tint-border" />,
}

type MarkdownDocumentProps = {
  children: string
}

export function MarkdownDocument({ children }: MarkdownDocumentProps) {
  // The docs site is the showcase for the library's own markdown hardening, so
  // it renders under the same rules: no raw HTML, no unsafe URL schemes.
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={components}
      skipHtml
      urlTransform={(url) => safeHref(url) ?? ''}
    >
      {children}
    </Markdown>
  )
}

export type MarkdownChildren = ReactNode
