import type { Component } from 'svelte'
import ButtonDoc from '../ButtonDoc.svelte'
import BadgeDoc from '../BadgeDoc.svelte'
import SurfaceDoc from '../SurfaceDoc.svelte'
import PanelDoc from '../PanelDoc.svelte'
import ProgressDoc from '../ProgressDoc.svelte'
import ScrollingLabelDoc from '../ScrollingLabelDoc.svelte'
import StatusDoc from '../StatusDoc.svelte'
import FormDoc from '../form/FormDoc.svelte'
import ThemeDoc from '../ThemeDoc.svelte'
import MenuDoc from '../MenuDoc.svelte'
import PopoverDoc from '../PopoverDoc.svelte'
import TabsDoc from '../TabsDoc.svelte'
import DialogDoc from '../DialogDoc.svelte'
import ContextMenuDoc from '../ContextMenuDoc.svelte'
import IconDoc from '../IconDoc.svelte'
import ToastDoc from '../ToastDoc.svelte'
import DiceDoc from '../DiceDoc.svelte'
import FormFieldsDoc from '../form/FormFieldsDoc.svelte'
import RoleplayFormsDoc from '../form/RoleplayFormsDoc.svelte'
import TreeDoc from '../TreeDoc.svelte'
import TableDoc from '../TableDoc.svelte'
import AuthDoc from '../auth/AuthDoc.svelte'
import CharacterCardDoc from '../character-card/CharacterCardDoc.svelte'
import CharacterDocumentsDoc from '../character-card/CharacterDocumentsDoc.svelte'
import CodeDoc from '../CodeDoc.svelte'
import CalendarDoc from '../CalendarDoc.svelte'
import NavigationDoc from '../NavigationDoc.svelte'
import ShellDoc from '../ShellDoc.svelte'
import BoardDoc from '../BoardDoc.svelte'
import MediaDoc from '../MediaDoc.svelte'
import TerminalDoc from '../terminal/TerminalDoc.svelte'
import CodeEditorDoc from '../CodeEditorDoc.svelte'
import EditorDoc from '../EditorDoc.svelte'
import MediaAssetsDoc from '../MediaAssetsDoc.svelte'
import ReleaseChartDoc from '../ReleaseChartDoc.svelte'
import AudioInputDoc from '../AudioInputDoc.svelte'
import FramebufferDoc from '../FramebufferDoc.svelte'
import ChartsDoc from '../ChartsDoc.svelte'
import TelemetryDoc from '../TelemetryDoc.svelte'
import FeedDoc from '../FeedDoc.svelte'
import ActivityDoc from '../ActivityDoc.svelte'
import NotifyDoc from '../NotifyDoc.svelte'
import TileMapDoc from '../TileMapDoc.svelte'
import AnnotationDoc from '../AnnotationDoc.svelte'
import PolicyDoc from '../policy/PolicyDoc.svelte'
import IdentityDoc from '../IdentityDoc.svelte'
import GraphDoc from '../graph/GraphDoc.svelte'
import ChatDoc from '../ChatDoc.svelte'
import DJDoc from '../DJDoc.svelte'
import Midnight128Doc from '../dj/Midnight128Doc.svelte'
import ClientDoc from '../client/ClientDoc.svelte'
import CollabDoc from '../CollabDoc.svelte'
import DependencyGraphDoc from '../graph/DependencyGraphDoc.svelte'
import WorkspaceDoc from '../WorkspaceDoc.svelte'
import type { SvelteDocRoute } from './types'

export const SVELTE_DOC_PAGES: ReadonlyArray<SvelteDocRoute & { component: Component }> = [
  { path: 'components/button', label: 'Button', group: 'Foundation', description: 'Actions with Tint variants, sizes, and loading state.', component: ButtonDoc },
  { path: 'components/icon', label: 'Icon', group: 'Foundation', description: 'A single seam over the Lucide Svelte glyph set.', component: IconDoc },
  { path: 'components/dice', label: 'Dice', group: 'Interaction', description: 'A controlled die that animates a host-owned result.', component: DiceDoc },
  { path: 'components/badge', label: 'Badge', group: 'Foundation', description: 'Compact semantic state labels.', component: BadgeDoc },
  { path: 'components/surface', label: 'Surface and Card', group: 'Foundation', description: 'Token-based composition surfaces.', component: SurfaceDoc },
  { path: 'components/panel', label: 'Panel', group: 'Foundation', description: 'Controlled disclosure and content regions.', component: PanelDoc },
  { path: 'components/progress', label: 'Progress', group: 'Feedback', description: 'Accessible progress with optional value display.', component: ProgressDoc },
  { path: 'components/scrolling-label', label: 'Scrolling Label', group: 'Feedback', description: 'Text that scrolls only when it overflows.', component: ScrollingLabelDoc },
  { path: 'components/status', label: 'Status', group: 'Feedback', description: 'Loading, empty, error, and connection states.', component: StatusDoc },
  { path: 'components/toast', label: 'Toast', group: 'Feedback', description: 'Transient notifications from a scoped provider.', component: ToastDoc },
  { path: 'components/tree', label: 'Tree', group: 'Interaction', description: 'Controlled hierarchical navigation and selection.', component: TreeDoc },
  { path: 'components/table', label: 'Table and Workbench', group: 'Data', description: 'Controlled rows, filters, selection, and inspector panes.', component: TableDoc },
  { path: 'components/code', label: 'Code', group: 'Data', description: 'Safe syntax highlighting and accessible code tabs.', component: CodeDoc },
  { path: 'components/calendar', label: 'Calendar', group: 'Data', description: 'Controlled month grid over plain TypeScript event models.', component: CalendarDoc },
  { path: 'components/board', label: 'Board', group: 'Data', description: 'Controlled masonry and kanban board with a selected detail.', component: BoardDoc },
  { path: 'components/media', label: 'Media', group: 'Data', description: 'Unified audio and video player with queue and settings.', component: MediaDoc },
  { path: 'components/media-assets', label: 'Media Assets', group: 'Data', description: 'Responsive gallery, lightbox, file intake, and upload queue.', component: MediaAssetsDoc },
  { path: 'components/release-chart', label: 'Charts', group: 'Data', description: 'Accessible SVG scatter and release score charts.', component: ReleaseChartDoc },
  { path: 'components/charts', label: 'Time Series and Bars', group: 'Data', description: 'Responsive native SVG charts with exact-value data tables.', component: ChartsDoc },
  { path: 'components/telemetry', label: 'Telemetry', group: 'Data', description: 'Trace waterfall, metrics, span detail, and service map.', component: TelemetryDoc },
  { path: 'components/feed', label: 'Feed and Reader', group: 'Data', description: 'Controlled entry layouts and article reading surface.', component: FeedDoc },
  { path: 'components/activity', label: 'Activity', group: 'Data', description: 'Ranked activity with controlled sort and selection.', component: ActivityDoc },
  { path: 'components/notify', label: 'Notifications', group: 'Feedback', description: 'Controlled bell, notification rows, and delivery settings.', component: NotifyDoc },
  { path: 'components/tile-map', label: 'Tile Map', group: 'Data', description: 'Keyboard-controlled map over a host-owned exploration client.', component: TileMapDoc },
  { path: 'components/annotation', label: 'Annotation Canvas', group: 'Data', description: 'Controlled image regions and vector drawing gestures.', component: AnnotationDoc },
  { path: 'components/policy', label: 'Policy', group: 'Data', description: 'Controlled rule editor, dry-run, table, and workflow graph.', component: PolicyDoc },
  { path: 'components/identity', label: 'Identity and Avatars', group: 'Foundation', description: 'Person initials, image fallback, and presence indicators.', component: IdentityDoc },
  { path: 'components/graph', label: 'Graph and Timeline', group: 'Data', description: 'Interactive graph, force network, and runtime timeline.', component: GraphDoc },
  { path: 'components/chat', label: 'Chat', group: 'Data', description: 'Controlled conversation, rich parts, approvals, and preferences.', component: ChatDoc },
  { path: 'components/dj', label: 'DJ and Audio Controls', group: 'Data', description: 'Waveforms, presets, audition intent, and analysis queue.', component: DJDoc },
  { path: 'components/midnight-128', label: 'Midnight 128 Workspace', group: 'Data', description: 'Local audio import and transition audition over a shared engine.', component: Midnight128Doc },
  { path: 'components/client', label: 'Application Client', group: 'Data', description: 'Plain TypeScript capabilities with Svelte context and reactive snapshots.', component: ClientDoc },
  { path: 'components/collab', label: 'Collaboration', group: 'Data', description: 'Host-owned Yjs documents and transport with Svelte text editors.', component: CollabDoc },
  { path: 'components/dependency-graph', label: 'Dependency Graph', group: 'Data', description: 'Generated package import graph with navigable component nodes.', component: DependencyGraphDoc },
  { path: 'components/workspace', label: 'Workspace Layouts', group: 'Data', description: 'Container-aware widget grid and controlled media release workspace.', component: WorkspaceDoc },
  { path: 'components/audio-input', label: 'Voice Input', group: 'Forms', description: 'Microphone capture with host-owned transcription.', component: AudioInputDoc },
  { path: 'components/framebuffer', label: 'Framebuffer', group: 'Data', description: 'Account-bound game frames over a shared TypeScript stream.', component: FramebufferDoc },
  { path: 'components/terminal', label: 'Terminal', group: 'Data', description: 'xterm over a host-owned session and connection state.', component: TerminalDoc },
  { path: 'components/code-editor', label: 'Code Editor', group: 'Data', description: 'CodeMirror Lua editing over a host-owned Yjs session.', component: CodeEditorDoc },
  { path: 'components/editor', label: 'Editor', group: 'Data', description: 'Controlled Tiptap rich text editing with block commands and tabbed code.', component: EditorDoc },
  { path: 'components/navigation', label: 'Navigation', group: 'Interaction', description: 'Links, breadcrumbs, and a responsive controlled sidebar.', component: NavigationDoc },
  { path: 'components/shell', label: 'Shell and Workspace', group: 'Interaction', description: 'Workspace header, tabs, split panes, status, and commands.', component: ShellDoc },
  { path: 'components/form', label: 'Fluid Form', group: 'Forms', description: 'Controlled fields, validation, and selection.', component: FormDoc },
  { path: 'components/form-fields', label: 'Form Fields', group: 'Forms', description: 'Controlled text, number, password, select, toggle, slider, file, and tags.', component: FormFieldsDoc },
  { path: 'components/roleplay-forms', label: 'Roleplay Forms', group: 'Forms', description: 'Controlled group, persona, regex, and import review editors.', component: RoleplayFormsDoc },
  { path: 'components/auth', label: 'Auth', group: 'Forms', description: 'Transport-neutral sign-in and recovery forms.', component: AuthDoc },
  { path: 'components/character-card', label: 'Character Card', group: 'Forms', description: 'Controlled Character Card V2 editing with JSON and PNG round trips.', component: CharacterCardDoc },
  { path: 'components/character-documents', label: 'Character Documents', group: 'Forms', description: 'Controlled original V2/V3 documents and character library.', component: CharacterDocumentsDoc },
  { path: 'components/theme', label: 'Theme', group: 'Foundation', description: 'Semantic tokens, palettes, and color scheme.', component: ThemeDoc },
  { path: 'components/menu', label: 'Menu', group: 'Interaction', description: 'Controlled action menu with keyboard navigation.', component: MenuDoc },
  { path: 'components/popover', label: 'Popover', group: 'Interaction', description: 'Controlled contextual surface.', component: PopoverDoc },
  { path: 'components/tabs', label: 'Tabs', group: 'Interaction', description: 'Controlled selection among related views.', component: TabsDoc },
  { path: 'components/dialog', label: 'Dialog', group: 'Interaction', description: 'Controlled modal surface with focus management.', component: DialogDoc },
  { path: 'components/context-menu', label: 'Context Menu', group: 'Interaction', description: 'Pointer-positioned actions with keyboard navigation.', component: ContextMenuDoc },
]

export const SVELTE_DOC_GROUPS = ['Foundation', 'Forms', 'Interaction', 'Data', 'Feedback'] as const

/** Keep bookmarks from the former React docs working after the root cutover. */
export const LEGACY_DOC_PATHS: Readonly<Record<string, string>> = {
  'components/scatter-plot': 'components/release-chart',
  'components/audio-player': 'components/media',
  'components/music-library': 'components/table',
  'components/auth-client': 'components/auth',
  'components/chrome': 'components/dialog',
  'components/client-framework': 'components/client',
  'components/media-player': 'components/media',
  'components/media-workspace': 'components/workspace',
  'components/settings-popout': 'components/media',
  'components/socket': 'components/client',
  'components/video-player': 'components/media',
  graph: 'components/dependency-graph',
  'vault-tasks': 'components/board',
}

export function findSvelteDoc(path: string) {
  return SVELTE_DOC_PAGES.find((page) => page.path === path || page.path === LEGACY_DOC_PATHS[path])
}
