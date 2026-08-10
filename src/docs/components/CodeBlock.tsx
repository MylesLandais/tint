import { Check, Copy } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useCopied } from '../../lib/useCopied'
import { HighlightedCode, type HighlightedCodeProps } from '../../components/code'
import { Icon } from '../../components/icon'

type CodeBlockProps = Pick<HighlightedCodeProps, 'lineNumbers' | 'startLine' | 'highlightLines' | 'highlightWords'> & {
  code: string
  language?: string
  title?: string
  className?: string
}

export function CodeBlock({ code, language = 'tsx', title, lineNumbers, startLine, highlightLines, highlightWords, className }: CodeBlockProps) {
  const { copied, copy } = useCopied(code)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-tint-code-border bg-tint-code text-tint-code-ink shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-tint-code-border px-4 py-2 text-xs text-tint-code-muted">
        <span className="uppercase tracking-[0.08em]">{title ?? language}</span>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={copied ? 'Code copied' : 'Copy code'}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-tint-code-ink transition-colors hover:bg-tint-code-ink/10"
        >
          {copied ? <Icon icon={Check} size="sm" /> : <Icon icon={Copy} size="sm" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        <HighlightedCode code={code} language={language} lineNumbers={lineNumbers} startLine={startLine} highlightLines={highlightLines} highlightWords={highlightWords} />
      </pre>
    </div>
  )
}
