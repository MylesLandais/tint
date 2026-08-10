import { lazy, type ComponentType } from 'react'
import type { DocRoutePath } from './routes'
import { ChatComponentDoc } from './chat/ChatComponentDoc'
import { CollabDoc } from './collab/CollabDoc'
import { IconsDoc } from './IconsDoc'
import { MediaPlayerDoc } from './MediaPlayerDoc'
import { TableDoc } from './table/TableDoc'
import { ThemeDoc } from './ThemeDoc'
import { AudioInputDoc } from './AudioInputDoc'
import { GraphDoc } from './graph/GraphDoc'

/**
 * Path -> page component, kept apart from `routes.ts` so that the route data
 * stays importable from `DocsNav` without closing an import cycle.
 *
 * The three heavy pages load lazily: Editor pulls in Tiptap, Terminal pulls in
 * xterm, and Auth pulls in its own stylesheet. Everything else is small enough
 * to ship in the entry chunk.
 */
const EditorDoc = lazy(() =>
  import('./editor/EditorDoc').then((module) => ({ default: module.EditorDoc })),
)
const TerminalDoc = lazy(() =>
  import('./terminal/TerminalDoc').then((module) => ({ default: module.TerminalDoc })),
)
const AuthDoc = lazy(() => import('./auth/AuthDoc').then((module) => ({ default: module.AuthDoc })))

/**
 * `satisfies` is load-bearing: adding a route to the registry without a page
 * here (or vice versa) is a compile error, so the two can never drift.
 */
export const DOC_PAGES = {
  'components/media-player': MediaPlayerDoc,
  'components/chat': ChatComponentDoc,
  'components/audio-input': AudioInputDoc,
  'components/table': TableDoc,
  'components/editor': EditorDoc,
  'components/terminal': TerminalDoc,
  'components/graph': GraphDoc,
  'components/collab': CollabDoc,
  'components/auth': AuthDoc,
  'components/icon': IconsDoc,
  'components/theme': ThemeDoc,
} satisfies Record<DocRoutePath, ComponentType>
