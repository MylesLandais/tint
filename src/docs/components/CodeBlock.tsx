import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '../../lib/utils'
import { HighlightedCode } from '../../components/code'
import { Icon } from '../../components/icon'

type CodeBlockProps = {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language = 'tsx', className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-tint-code-border bg-tint-code text-tint-code-ink shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-tint-code-border px-4 py-2 text-xs text-tint-code-muted">
        <span className="uppercase tracking-[0.08em]">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-tint-code-ink transition-colors hover:bg-tint-code-ink/10"
        >
          {copied ? <Icon icon={Check} size="sm" /> : <Icon icon={Copy} size="sm" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        <HighlightedCode code={code} language={language} />
      </pre>
    </div>
  )
}
