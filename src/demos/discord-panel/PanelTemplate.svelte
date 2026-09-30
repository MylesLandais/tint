<script lang="ts">
  import type { Snippet } from 'svelte'
  import { CommandPalette, NavRail, StatusBar, WorkspaceHeader, WorkspaceLayout } from '../../svelte/components/shell'
  import type { CommandPaletteItem, ConnectionState, NavGroup, StatusItem } from '../../svelte/components/shell/types'
  import type { PanelGuild } from './fixtures'

  type Tab = { id: string; label: string }
  let { product, productSubtitle, signedInAs, guilds, guildId, onGuildChange, guildSwitching = true,
    tabs, activeTab, onActiveTabChange, content: renderContent, banner: renderBanner,
    inspector: renderInspector, drawer: renderDrawer, connection, statusItems,
    paletteItems, onPaletteSelect, paletteOpen, onPaletteOpenChange, paletteQuery, onPaletteQueryChange,
  }: {
    product: string
    productSubtitle: string
    signedInAs: string
    guilds: readonly PanelGuild[]
    guildId: string
    onGuildChange: (guildId: string) => void
    guildSwitching?: boolean
    tabs: readonly Tab[]
    activeTab: string
    onActiveTabChange: (tabId: string) => void
    content: Snippet<[string]>
    banner?: Snippet
    inspector?: Snippet
    drawer?: Snippet
    connection: ConnectionState
    statusItems: readonly StatusItem[]
    paletteItems: readonly CommandPaletteItem[]
    onPaletteSelect: (id: string) => void
    paletteOpen: boolean
    onPaletteOpenChange: (open: boolean) => void
    paletteQuery: string
    onPaletteQueryChange: (query: string) => void
  } = $props()
  let guild = $derived(guilds.find((item) => item.id === guildId) ?? guilds[0]!)
  let currentTab = $derived(tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id ?? '')
  let navGroups = $derived<NavGroup[]>([{ id: 'guilds', label: 'Guilds', items: guilds.map((item) => ({
    id: item.id, label: item.name, href: `#/guild/${item.id}`, disabled: !guildSwitching && item.id !== guildId,
  })) }])
  const tabPrefix = $props.id()

  function tabKeydown(event: KeyboardEvent, index: number) {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : delta ? (index + delta + tabs.length) % tabs.length : -1
    if (next < 0 || !tabs[next]) return
    event.preventDefault()
    onActiveTabChange(tabs[next].id)
    const list = (event.currentTarget as HTMLElement).parentElement
    list?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  function navigate(id: string) { if (guildSwitching) onGuildChange(id) }
</script>

<WorkspaceLayout class="h-dvh" navigationWidth="13rem" inspectorWidth="17rem" drawerHeight={renderDrawer ? '11rem' : undefined} inspector={renderInspector} drawer={renderDrawer}>
  {#snippet navigation()}
    <NavRail groups={navGroups} activeId={guildId} onNavigate={navigate} aria-label="Guild navigation">
      {#snippet header()}<div class="px-2 py-3"><p class="m-0 text-xs uppercase tracking-wide text-tint-muted">{product}</p><p class="m-0 text-sm font-medium">{productSubtitle}</p></div>{/snippet}
      {#snippet footer()}<div class="px-2 py-3 text-xs text-tint-muted">Signed in as {signedInAs}</div>{/snippet}
    </NavRail>
  {/snippet}
  {#snippet toolbar()}
    <WorkspaceHeader title={guild.name} subtitle={guild.channel ? `Connected to #${guild.channel}` : 'Not in a voice channel'} breadcrumbs={[{ label: 'Guilds' }, { label: guild.name }]}>
      {#snippet actions()}<span class="text-xs text-tint-muted">{connection.state}</span><button type="button" onclick={() => onPaletteOpenChange(true)} class="rounded-lg border border-tint-border bg-tint-panel px-3 py-2 text-sm hover:bg-tint-surface">Commands ⌘K</button>{/snippet}
    </WorkspaceHeader>
  {/snippet}
  {#snippet primary()}
    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4 p-4">
      {@render renderBanner?.()}
      <div data-tint-tabs>
        <div role="tablist" aria-label={`${product} views`} class="flex gap-6 overflow-x-auto border-b border-tint-border">
          {#each tabs as tab, index (tab.id)}
            <button type="button" role="tab" id={`${tabPrefix}-${tab.id}`} aria-controls={`${tabPrefix}-${tab.id}-panel`}
              aria-selected={currentTab === tab.id} tabindex={currentTab === tab.id ? 0 : -1}
              onclick={() => onActiveTabChange(tab.id)} onkeydown={(event) => tabKeydown(event, index)}
              class={['shrink-0 border-b-2 border-transparent px-1 py-3 text-sm text-tint-muted', currentTab === tab.id && 'border-tint-accent text-tint-accent']}>{tab.label}</button>
          {/each}
        </div>
        <div role="tabpanel" id={`${tabPrefix}-${currentTab}-panel`} aria-labelledby={`${tabPrefix}-${currentTab}`} tabindex="0" class="min-w-0 pt-4">{@render renderContent(currentTab)}</div>
      </div>
    </div>
  {/snippet}
</WorkspaceLayout>
<StatusBar items={statusItems} {connection} />
<CommandPalette open={paletteOpen} onOpenChange={onPaletteOpenChange} query={paletteQuery} onQueryChange={onPaletteQueryChange}
  items={paletteItems} onSelect={onPaletteSelect} label={`${product} commands`} />

<style>
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
</style>
