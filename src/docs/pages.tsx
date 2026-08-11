import { lazy, type ComponentType } from 'react'
import type { DocRoutePath } from './routes'
import { ChatComponentDoc } from './chat/ChatComponentDoc'
import { CollabDoc } from './collab/CollabDoc'
import { IconsDoc } from './IconsDoc'
import { MediaPlayerDoc } from './MediaPlayerDoc'
import { TableDoc } from './table/TableDoc'
import { ThemeDoc } from './ThemeDoc'
import { AudioInputDoc } from './AudioInputDoc'
import { CodeDoc } from './CodeDoc'
import { DiceDoc } from './DiceDoc'
import { MediaPrimitivesDoc } from './MediaPrimitivesDoc'
import { PanelDoc } from './PanelDoc'
import { SettingsPopoutDoc } from './SettingsPopoutDoc'
import { SocketDoc } from './SocketDoc'
import { VideoPlayerDoc } from './VideoPlayerDoc'

/**
 * Path -> page component, kept apart from `routes.ts` so that the route data
 * stays importable from `DocsNav` without closing an import cycle.
 *
 * The four heavy pages load lazily: Editor pulls in Tiptap, Terminal pulls in
 * xterm, Auth pulls in its own stylesheet, and Graph pulls in the vendored
 * xyflow bundle, its stylesheet, and a ComfyUI workflow fixture. Everything else
 * is small enough to ship in the entry chunk.
 */
const EditorDoc = lazy(() =>
  import('./editor/EditorDoc').then((module) => ({ default: module.EditorDoc })),
)
const TerminalDoc = lazy(() =>
  import('./terminal/TerminalDoc').then((module) => ({ default: module.TerminalDoc })),
)
const AuthDoc = lazy(() => import('./auth/AuthDoc').then((module) => ({ default: module.AuthDoc })))
const GraphDoc = lazy(() =>
  import('./graph/GraphDoc').then((module) => ({ default: module.GraphDoc })),
)

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
  'components/socket': SocketDoc,
  'components/collab': CollabDoc,
  'components/auth': AuthDoc,
  'components/video-player': VideoPlayerDoc,
  'components/media': MediaPrimitivesDoc,
  'components/code': CodeDoc,
  'components/panel': PanelDoc,
  'components/settings-popout': SettingsPopoutDoc,
  'components/dice': DiceDoc,
  'components/icon': IconsDoc,
  'components/theme': ThemeDoc,
} satisfies Record<DocRoutePath, ComponentType>
