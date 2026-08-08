import { DocsNav } from './components/DocsNav'
import { DOC_ROUTES, hrefFor } from './routes'

/**
 * The component index at `#/`.
 *
 * This is the site's discovery surface: every documented component is reachable
 * from here, so individual pages carry only a breadcrumb home rather than their
 * own hand-maintained list of siblings. Cards come straight from `DOC_ROUTES`,
 * so a new entry there shows up here without touching this file.
 */
export function HomeDoc() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1200px]">
        <DocsNav />

        <section className="mb-12 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">
            Component library
          </p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">
            Tint
          </h1>
          <p className="m-0 text-base leading-7 text-tint-muted">
            Composable React components that stay controlled: your application owns the state, Tint
            owns the interaction. Every component below themes from the same token set and works in
            light and dark across all three palettes.
          </p>
        </section>

        <section aria-labelledby="components-heading">
          <h2 id="components-heading" className="sr-only">
            Components
          </h2>
          <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {DOC_ROUTES.map((route) => (
              <li key={route.path}>
                <a
                  href={hrefFor(route)}
                  className="group flex h-full flex-col gap-2 rounded-xl border border-tint-border bg-tint-panel p-5 transition hover:border-tint-accent hover:bg-tint-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
                >
                  <span className="text-base font-semibold tracking-tight text-tint-ink">
                    {route.label}
                  </span>
                  <span className="text-sm leading-6 text-tint-muted">{route.blurb}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
