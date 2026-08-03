import { useEffect, useState } from 'react'
import { ChatDocs } from './chat/ChatDocs'
import { ChatComponentDoc } from './chat/ChatComponentDoc'
import { VideoPlayerDoc } from './VideoPlayerDoc'
import { TableDoc } from './table/TableDoc'

function readRoute() {
  return window.location.hash.startsWith('#/') ? window.location.hash.slice(2) : ''
}

/** `music-library` was the old name for this page; keep the link working. */
function isTableRoute(route: string) {
  return route === 'components/table' || route === 'components/music-library'
}

export function DocsApp() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onHashChange = () => {
      setRoute(readRoute())
      if (window.location.hash.startsWith('#/')) {
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.title =
      route === 'components/chat'
        ? 'Chat — Tint'
        : isTableRoute(route)
          ? 'Table — Tint'
          : route.startsWith('chat')
            ? 'Chat research — Tint'
            : 'Video Player — Tint'
  }, [route])

  if (route === 'components/chat') {
    return <ChatComponentDoc />
  }

  if (isTableRoute(route)) {
    return <TableDoc />
  }

  if (route.startsWith('chat')) {
    const [, slug] = route.split('/')
    return <ChatDocs slug={slug} />
  }

  return <VideoPlayerDoc />
}
