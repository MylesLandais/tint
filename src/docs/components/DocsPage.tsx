import type { ReactNode } from 'react'
import { DocsNav } from './DocsNav'
import type { DocRoutePath } from '../routes'

export type DocsPageProps = {
  route: DocRoutePath
  title: string
  /** One-paragraph statement of what the component is for. */
  intro: ReactNode
  /** Optional second paragraph for caveats and limitations. */
  note?: ReactNode
  children: ReactNode
}

/**
 * The frame every docs page shares: breadcrumb, eyebrow, title, intro.
 *
 * The older pages predate this and each carry their own copy of the same
 * `<main>/<div>/<DocsNav>/<header>` block. New pages should use this instead —
 * the boilerplate is identical on all of them, and having it in one place is
 * what lets a change to the page chrome land everywhere at once, the same
 * argument `routes.ts` makes for the nav.
 */
export function DocsPage({ route, title, intro, note, children }: DocsPageProps) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1200px]">
        <DocsNav current={route} />
        <section className="mb-8 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
            Components
          </p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">
            {title}
          </h1>
          <p className="m-0 text-base leading-7 text-tint-muted">{intro}</p>
          {note ? <p className="mt-3 text-sm leading-6 text-tint-muted">{note}</p> : null}
        </section>
        {children}
      </div>
    </main>
  )
}

/** A titled, anchored section — the unit `routes.ts` offers as a jump link. */
export function DocsSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <h2 className="mt-0 mb-3 text-xl font-semibold tracking-tight text-tint-ink">{title}</h2>
      {description ? (
        <p className="mt-0 mb-4 max-w-3xl text-sm leading-6 text-tint-muted">{description}</p>
      ) : null}
      {children}
    </section>
  )
}

/** The bordered surface live examples sit on across the docs site. */
export function DocsPreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-tint-border bg-tint-panel p-4 shadow-sm sm:p-6 ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
