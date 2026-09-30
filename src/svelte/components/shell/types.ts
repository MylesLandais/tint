import type { Snippet } from 'svelte'
import type { BadgeTone } from '../badge/types'
import type { NavGroup as CoreNavGroup, NavRailItem as CoreNavRailItem, CommandPaletteItem as CoreCommandPaletteItem, WorkspaceTab as CoreWorkspaceTab } from '../../../core/shell/navigation'

export type NavRailItem = CoreNavRailItem & {
  icon?: Snippet
  badge?: Snippet
}

export type NavGroup = CoreNavGroup<NavRailItem>
export type CommandPaletteItem = CoreCommandPaletteItem
export type WorkspaceBreadcrumb = { label: string; href?: string }
export type StatusItem = { id: string; label: string; tone?: BadgeTone; icon?: Snippet }
export type ConnectionStateValue = 'connected' | 'connecting' | 'disconnected' | 'error'
export type ConnectionState = { state: ConnectionStateValue; label: string }
export type WorkspaceTab = CoreWorkspaceTab & { content?: Snippet }
