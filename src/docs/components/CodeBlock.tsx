import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

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
        'overflow-hidden rounded-xl border border-[var(--color-tint-border)] bg-[var(--color-tint-code)] text-slate-100 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-slate-300">
        <span className="uppercase tracking-[0.08em]">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-200 transition-colors hover:bg-white/10"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        <code>{code}</code>
      </pre>
    </div>
  )
}
