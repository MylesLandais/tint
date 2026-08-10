import { Check, Copy } from 'lucide-react'
import { useId, useState, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { useCopied } from '../../lib/useCopied'
import { Icon } from '../icon'
import type { IconGlyph } from '../icon'
import { HighlightedCode } from './HighlightedCode'
import type { HighlightedCodeProps } from './HighlightedCode'

/** Generic tab presentation shared by code and other tabbed surfaces. */
export type TabItem = {
  id: string
  /** Visible tab text. Code tabs may omit this and derive it from language. */
  label?: string
  title?: string
  icon?: IconGlyph
}

export type CodeTab = TabItem & Pick<HighlightedCodeProps, 'language' | 'lineNumbers' | 'startLine' | 'highlightLines' | 'highlightWords'> & {
  code: string
  /** Optional serializable command for host-provided install/accessory UI. */
  installCommand?: string
}

export type CodeTabsProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  tabs: readonly CodeTab[]
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  label?: string
  /** Optional content synchronized with the active tab, rendered below its panel. */
  renderAccessory?: (tab: CodeTab) => ReactNode
}

function languageLabel(language?: string) {
  if (!language) return 'Code'
  const labels: Record<string, string> = {
    bash: 'Bash',
    erlang: 'Erlang',
    java: 'Java',
    javascript: 'JavaScript',
    python: 'Python',
    rust: 'Rust',
    typescript: 'TypeScript',
  }
  return labels[language.toLowerCase()] ?? language.charAt(0).toUpperCase() + language.slice(1)
}

export function CodeTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  label = 'Code examples',
  renderAccessory,
  className,
  ...props
}: CodeTabsProps) {
  const instanceId = useId()
  const first = tabs[0]?.id
  const [internal, setInternal] = useState(defaultValue ?? first)
  const activeId = value ?? internal ?? first
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeId))
  const active = tabs[activeIndex]

  if (!active) return null
  const accessory = renderAccessory?.(active)

  const activate = (index: number, focus = false) => {
    const tab = tabs[(index + tabs.length) % tabs.length]
    if (!tab) return
    if (value === undefined) setInternal(tab.id)
    onValueChange?.(tab.id)
    if (focus) {
      document.getElementById(`${instanceId}-${tab.id}-tab`)?.focus()
    }
  }

  return (
    <section className={cn('overflow-hidden rounded-xl border border-tint-code-border bg-tint-code text-tint-code-ink', className)} {...props}>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-tint-code-border bg-tint-code/80 px-2 py-1">
        {tabs.map((tab, index) => {
          const selected = index === activeIndex
          return (
            <button
              key={tab.id}
              id={`${instanceId}-${tab.id}-tab`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${instanceId}-${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => activate(index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  activate(index + 1, true)
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  activate(index - 1, true)
                } else if (event.key === 'Home') {
                  event.preventDefault()
                  activate(0, true)
                } else if (event.key === 'End') {
                  event.preventDefault()
                  activate(tabs.length - 1, true)
                }
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-tint-code-muted hover:bg-tint-code-ink/10 hover:text-tint-code-ink focus-visible:outline-2 focus-visible:outline-tint-code-ink aria-selected:bg-tint-code-ink/10 aria-selected:text-tint-code-ink"
            >
              {tab.icon ? <Icon icon={tab.icon} size="sm" /> : null}
              {tab.label ?? languageLabel(tab.language)}
            </button>
          )
        })}
      </div>
      <div
        id={`${instanceId}-${active.id}-panel`}
        role="tabpanel"
        aria-labelledby={`${instanceId}-${active.id}-tab`}
        className="min-w-0"
      >
        <CodeTabPanel tab={active} />
      </div>
      {accessory ? (
        <div data-code-tabs-accessory="" className="border-t border-tint-code-border bg-tint-surface/60 text-tint-ink">
          {accessory}
        </div>
      ) : null}
    </section>
  )
}

function CodeTabPanel({ tab }: { tab: CodeTab }) {
  // Shared with chat's copy buttons: only reports success once the write
  // actually resolves, and clears its own timer. Rolling this by hand here meant
  // an unhandled rejection whenever the clipboard was denied or the page was
  // served over http.
  const { copied, copy } = useCopied(tab.code)

  return (
    <>
      <header className="flex items-center justify-between border-b border-tint-code-border px-3 py-2 text-xs text-tint-code-muted">
        <span className="inline-flex items-center gap-1.5">
          {tab.icon ? <Icon icon={tab.icon} size="sm" /> : null}
          {tab.title ?? tab.label ?? languageLabel(tab.language)}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={copied ? 'Code copied' : 'Copy code'}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-tint-code-ink/10 focus-visible:outline-2 focus-visible:outline-tint-code-ink"
        >
          <Icon icon={copied ? Check : Copy} size="sm" />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </header>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        <HighlightedCode
          code={tab.code}
          language={tab.language}
          lineNumbers={tab.lineNumbers}
          startLine={tab.startLine}
          highlightLines={tab.highlightLines}
          highlightWords={tab.highlightWords}
        />
      </pre>
    </>
  )
}
