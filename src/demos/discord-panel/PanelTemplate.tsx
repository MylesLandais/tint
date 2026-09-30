/**
 * The one view template both Discord panels render through.
 *
 * The bot panel and the mod panel differ only in which tabs they mount and
 * what sits in the inspector; the guild rail, the header, the command palette
 * and the status bar are identical, and were identical by copy-paste before
 * this file existed. Keeping them here means a fix to the rail is a fix to
 * both panels, and a third panel is a props object rather than a fork.
 *
 * The template owns no domain state. It is handed guilds, tabs and status
 * items and reports selections back; every panel keeps its own data.
 */
import type { ReactNode } from 'react'
import {
  CommandPalette,
  NavRail,
  StatusBar,
  WorkspaceHeader,
  WorkspaceLayout,
  WorkspaceTabs,
} from '../../components/shell'
import type {
  CommandPaletteItem,
  ConnectionStateValue,
  NavGroup,
  StatusItem,
  WorkspaceTab,
} from '../../components/shell'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { ConnectionStatus } from '../../components/status'
import type { PanelGuild } from './fixtures'

export type PanelTemplateProps = {
  /** Shown above the rail: which panel this is. */
  product: string
  productSubtitle: string
  signedInAs: string

  guilds: readonly PanelGuild[]
  guildId: string
  onGuildChange: (guildId: string) => void
  /** `false` for a panel pinned to one guild, like the mod panel. */
  guildSwitching?: boolean

  tabs: readonly WorkspaceTab[]
  activeTab: string
  onActiveTabChange: (tabId: string) => void

  /** Rendered above the tab strip — error banners and the like. */
  banner?: ReactNode
  headerActions?: ReactNode
  inspector?: ReactNode
  drawer?: ReactNode

  connection: { state: ConnectionStateValue; label: string }
  statusItems: readonly StatusItem[]

  paletteItems: readonly CommandPaletteItem[]
  onPaletteSelect: (id: string) => void
  paletteOpen: boolean
  onPaletteOpenChange: (open: boolean) => void
  paletteQuery: string
  onPaletteQueryChange: (query: string) => void
}

/** `ConnectionState` (six values) narrowed to what `ConnectionStatus` renders. */
export function connectionTone(state: string): 'online' | 'connecting' | 'reconnecting' | 'offline' | 'error' {
  if (state === 'online' || state === 'reconnecting' || state === 'offline' || state === 'error') return state
  return 'connecting'
}

export function PanelTemplate({
  product,
  productSubtitle,
  signedInAs,
  guilds,
  guildId,
  onGuildChange,
  guildSwitching = true,
  tabs,
  activeTab,
  onActiveTabChange,
  banner,
  headerActions,
  inspector,
  drawer,
  connection,
  statusItems,
  paletteItems,
  onPaletteSelect,
  paletteOpen,
  onPaletteOpenChange,
  paletteQuery,
  onPaletteQueryChange,
}: PanelTemplateProps) {
  const guild = guilds.find((candidate) => candidate.id === guildId) ?? guilds[0]!
  const navGroups: readonly NavGroup[] = [
    {
      id: 'guilds',
      label: 'Guilds',
      items: guilds.map((candidate) => ({
        id: candidate.id,
        label: candidate.name,
        href: `#/guild/${candidate.id}`,
        disabled: !guildSwitching && candidate.id !== guildId,
        badge: candidate.channel ? undefined : <Badge tone="neutral">idle</Badge>,
      })),
    },
  ]

  // A tab whose id no longer exists would render an empty primary region, so
  // fall back to the first rather than showing nothing.
  const current = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]

  return (
    <>
      <WorkspaceLayout
        className="h-dvh"
        drawerHeight={drawer ? '11rem' : undefined}
        // The side regions are narrower than the workspace default. These
        // panels put dense tables in the primary column, and at the width
        // where the layout first splits into three, the stock 16rem rail plus
        // a stock inspector left the tables too narrow to read without
        // scrolling them horizontally.
        navigationWidth="13rem"
        inspectorWidth="17rem"
        navigation={
          <NavRail
            groups={navGroups}
            activeId={guildId}
            onNavigate={(id) => {
              if (guildSwitching) onGuildChange(id)
            }}
            header={
              <div className="px-2 py-3">
                <p className="m-0 text-xs uppercase tracking-wide text-tint-muted">{product}</p>
                <p className="m-0 text-sm font-medium">{productSubtitle}</p>
              </div>
            }
            footer={<div className="px-2 py-3 text-xs text-tint-muted">Signed in as {signedInAs}</div>}
          />
        }
        toolbar={
          <WorkspaceHeader
            breadcrumbs={[{ label: 'Guilds' }, { label: guild.name }]}
            title={guild.name}
            subtitle={guild.channel ? `Connected to #${guild.channel}` : 'Not in a voice channel'}
            actions={
              <div className="flex items-center gap-2">
                <ConnectionStatus state={connectionTone(connection.state === 'connected' ? 'online' : connection.state === 'disconnected' ? 'offline' : connection.state)} />
                {headerActions}
                <Button onClick={() => onPaletteOpenChange(true)}>Commands ⌘K</Button>
              </div>
            }
          />
        }
        primary={
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4 p-4">
            {/*
              `grid-cols-[minmax(0,1fr)]` rather than a bare `grid`: a grid
              item's default `min-width: auto` refuses to shrink below its
              content, so the filter bar's fields pushed the whole primary
              column into a horizontal scroll instead of wrapping inside it.
            */}
            {banner}
            <WorkspaceTabs tabs={tabs} value={current?.id ?? ''} onChange={onActiveTabChange} label={`${product} views`} />
          </div>
        }
        inspector={inspector}
        drawer={drawer}
      />
      <StatusBar items={statusItems} connection={{ state: connection.state, label: connection.label }} />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={onPaletteOpenChange}
        query={paletteQuery}
        onQueryChange={onPaletteQueryChange}
        items={paletteItems}
        onSelect={onPaletteSelect}
        label={`${product} commands`}
      />
    </>
  )
}
