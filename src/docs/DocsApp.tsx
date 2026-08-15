import {
  Component,
  Suspense,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { HomeDoc } from './HomeDoc'
import { DOC_PAGES } from './pages'
import { findRoute, pathFromHash } from './routes'
import { DocsShell } from './shell/DocsShell'

function LoadingDoc() {
  return (
    <main className="grid min-h-[60vh] place-items-center text-sm text-tint-muted">
      Loading component…
    </main>
  )
}

function FailedDoc({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div className="max-w-md">
        <p className="m-0 text-sm font-medium text-tint-ink">This component page failed to load.</p>
        <p className="mt-2 mb-4 text-sm text-tint-muted">
          The lazy chunk threw while mounting. Retry, or return to the component index.
        </p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-tint-border bg-tint-panel px-3 py-1.5 text-sm text-tint-ink hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-tint-accent"
          >
            Retry
          </button>
          <a
            href="#/"
            className="rounded-md px-3 py-1.5 text-sm text-tint-muted hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-tint-accent"
          >
            Component index
          </a>
        </div>
      </div>
    </main>
  )
}

type DocErrorBoundaryProps = {
  children: ReactNode
}

type DocErrorBoundaryState = {
  failed: boolean
}

/**
 * Catches lazy-chunk mount failures so a bad page cannot blank the whole docs
 * shell. Remounting on `key={route.path}` clears the failed state when the
 * reader navigates away and back.
 */
class DocErrorBoundary extends Component<DocErrorBoundaryProps, DocErrorBoundaryState> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[tint] A docs page failed to render.', error, info)
  }

  render() {
    if (this.state.failed) {
      return <FailedDoc onRetry={() => this.setState({ failed: false })} />
    }
    return this.props.children
  }
}

function readRoute() {
  return pathFromHash(window.location.hash)
}

export function DocsApp() {
  const [path, setPath] = useState(readRoute)

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash
      // A stray in-page anchor is not a route change; leave the reader where they are.
      if (hash !== '' && hash !== '#' && !hash.startsWith('#/')) return
      setPath(readRoute())
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const route = findRoute(path)

  useEffect(() => {
    document.title = route ? `${route.label} — Tint` : 'Tint'
  }, [route])

  // Unknown paths land on the component index rather than an arbitrary page.
  if (!route)
    return (
      <DocsShell>
        <HomeDoc />
      </DocsShell>
    )

  const Page = DOC_PAGES[route.path]
  if (!Page)
    return (
      <DocsShell>
        <HomeDoc />
      </DocsShell>
    )

  return (
    <DocsShell current={route.path}>
      <DocErrorBoundary key={route.path}>
        <Suspense fallback={<LoadingDoc />}>
          <Page />
        </Suspense>
      </DocErrorBoundary>
    </DocsShell>
  )
}
