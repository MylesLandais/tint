import { Suspense, useEffect, useState } from 'react'
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
      <Suspense fallback={<LoadingDoc />}>
        <Page />
      </Suspense>
    </DocsShell>
  )
}
