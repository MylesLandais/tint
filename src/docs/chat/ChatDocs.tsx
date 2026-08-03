import { BookOpen, ChevronDown, Code2, Library, PanelLeft } from 'lucide-react'
import { CodeBlock } from '../components/CodeBlock'
import { ThemeControls } from '../components/ThemeControls'
import { MarkdownDocument } from './MarkdownDocument'
import { chatDocuments, defaultChatDocument } from './documents'

type ChatDocsProps = {
  slug?: string
}

export function ChatDocs({ slug }: ChatDocsProps) {
  const document = chatDocuments.find((item) => item.slug === slug) ?? defaultChatDocument

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-tint-border bg-tint-panel/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <a href="#/components/video-player" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-flex size-7 items-center justify-center rounded-md bg-tint-accent text-sm text-tint-on-accent">
                t
              </span>
              tint
            </a>
            <span className="hidden h-5 w-px bg-tint-border sm:block" />
            <span className="hidden items-center gap-2 text-sm text-tint-muted sm:flex">
              <BookOpen className="size-4" aria-hidden="true" />
              Chat research
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#/components/chat"
              className="text-sm text-tint-muted transition-colors hover:text-tint-ink"
            >
              Components
            </a>
            <ThemeControls />
            <a
              href="https://github.com/MylesLandais/tint"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Tint source repository"
              className="rounded-md p-1.5 text-tint-muted transition-colors hover:bg-tint-surface hover:text-tint-ink"
            >
              <Code2 className="size-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b border-tint-border bg-tint-panel/45 px-4 py-4 lg:min-h-[calc(100vh-3.5rem)] lg:border-r lg:border-b-0 lg:px-5 lg:py-8">
          <div className="mb-4 hidden items-center gap-2 px-2 text-xs font-semibold tracking-[0.08em] text-tint-muted uppercase lg:flex">
            <PanelLeft className="size-3.5" aria-hidden="true" />
            Chat system
          </div>

          <div className="relative lg:hidden">
            <select
              aria-label="Chat documentation page"
              value={document.slug}
              onChange={(event) => {
                window.location.hash = `/chat/${event.target.value}`
              }}
              className="w-full appearance-none rounded-lg border border-tint-border bg-tint-panel px-3 py-2 pr-9 text-sm font-medium"
            >
              {chatDocuments.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.shortTitle}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-tint-muted"
              aria-hidden="true"
            />
          </div>

          <nav aria-label="Chat documentation" className="hidden space-y-1 lg:block">
            {chatDocuments.map((item) => {
              const active = item.slug === document.slug
              return (
                <a
                  key={item.slug}
                  href={`#/chat/${item.slug}`}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'block rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-tint-accent-soft font-medium text-tint-accent'
                      : 'text-tint-muted hover:bg-tint-panel hover:text-tint-ink',
                  ].join(' ')}
                >
                  {item.shortTitle}
                </a>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-10 sm:px-8 sm:py-14 lg:px-12 xl:px-16">
          <div className="mb-6 flex max-w-3xl flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tint-accent-soft px-2.5 py-1 text-xs font-medium text-tint-accent">
              <Library className="size-3.5" aria-hidden="true" />
              Research and implementation
            </span>
            <span className="rounded-full border border-tint-border bg-tint-panel px-2.5 py-1 text-xs text-tint-muted">
              Controlled presentation
            </span>
            <span className="rounded-full border border-tint-border bg-tint-panel px-2.5 py-1 text-xs text-tint-muted">
              Rich AI v1
            </span>
          </div>

          <p className="mb-8 max-w-2xl text-lg leading-7 text-tint-muted">
            {document.description}
          </p>

          <article>
            <MarkdownDocument>{document.content}</MarkdownDocument>

            {document.sources?.map((source) => (
              <section key={source.label} className="mt-12">
                <h2 className="mb-4 border-t border-tint-border pt-10 text-2xl font-semibold tracking-tight">
                  {source.label}
                </h2>
                <CodeBlock code={source.code} language={source.language} />
              </section>
            ))}
          </article>

          <footer className="mt-16 border-t border-tint-border pt-8 text-sm text-tint-muted">
            Tint Chat research and implementation · 2026-08-02
          </footer>
        </main>
      </div>
    </div>
  )
}
