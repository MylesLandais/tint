<script lang="ts">
  import { NavigationAppShell, NavigationList, Breadcrumbs, type NavigationItem } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const items: NavigationItem[] = [
    { id: 'navigation', label: 'Navigation', href: '#/components/navigation' },
    { id: 'table', label: 'Table', href: '#/components/table' },
    { id: 'calendar', label: 'Calendar', href: '#/components/calendar' },
  ]
  const crumbs = [
    { id: 'docs', label: 'Docs', href: '#/' },
    { id: 'components', label: 'Components', href: '#/' },
    { id: 'navigation', label: 'Navigation' },
  ]
  let sidebarOpen = $state(false)
  const api: ApiRow[] = [
    { prop: 'NavigationList.items / activeHref', type: 'NavigationItem[] / string?', description: 'Host-supplied links and current destination.' },
    { prop: 'NavigationList.renderLink', type: 'Snippet<[item, content, active]>', description: 'Optional adapter for a host router.' },
    { prop: 'NavigationList.onNavigate', type: '(item: NavigationItem) => void', description: 'Called when a Tint-rendered navigation link is activated.' },
    { prop: 'NavigationList / Breadcrumbs label', type: 'string', description: 'Accessible name for each navigation landmark.' },
    { prop: 'Breadcrumbs.items', type: 'BreadcrumbItem[]', description: 'Ordered location trail; the last crumb is current.' },
    { prop: 'NavigationAppShell.sidebarOpen', type: 'boolean', description: 'Controlled mobile drawer state.' },
    { prop: 'onSidebarOpenChange', type: '(open: boolean) => void', description: 'Open or close intent from the toggle, backdrop, or Escape.' },
    { prop: 'NavigationAppShell children', type: 'Snippet', description: 'Main workspace content rendered beside the sidebar.' },
    { prop: 'NavigationAppShell sidebarLabel', type: 'string', description: 'Accessible name for the sidebar region and its mobile drawer.' },
    { prop: 'brand / header / search / actions / sidebar / breadcrumbs', type: 'string | Snippet', description: 'App shell regions owned by the host.' },
  ]
  const usage = `import { AppShell as NavigationAppShell, NavigationList, Breadcrumbs } from '@nebula/tint/navigation'

let sidebarOpen = $state(false)
const items = [{ id: 'home', label: 'Home', href: '/home' }]

{#snippet sidebar()}
  <NavigationList {items} activeHref="/home" />
{/snippet}

<NavigationAppShell brand="Tint" {sidebar} {sidebarOpen}
  onSidebarOpenChange={(open) => sidebarOpen = open}>
  <p>Workspace content</p>
</NavigationAppShell>`
</script>

{#snippet sidebar()}
  <NavigationList {items} activeHref="#/components/navigation" onNavigate={() => sidebarOpen = false} />
{/snippet}

{#snippet breadcrumbs()}
  <Breadcrumbs items={crumbs} />
{/snippet}

<DocPage title="Navigation" description="Host-controlled links, breadcrumbs, and a container-aware app sidebar. The small-width drawer manages focus and requests dismissal through the host callback." importPath="@nebula/tint/navigation" {usage} {api} accessibility="NavigationList and Breadcrumbs use named navigation landmarks. The active link exposes aria-current. On narrow containers the app sidebar becomes a dialog, traps Tab focus while open, closes on Escape or its backdrop, and returns focus to the toggle.">
  <div class="shell-demo">
    <NavigationAppShell brand="Tint" header="Collections" {sidebar} {breadcrumbs} {sidebarOpen} onSidebarOpenChange={(open) => sidebarOpen = open}>
      <div class="workspace"><h3>Workspace</h3><p>Navigate through the sidebar or resize this preview to see the drawer behavior.</p></div>
    </NavigationAppShell>
  </div>
</DocPage>

<style>
  .shell-demo { height: 27rem; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); }
  .shell-demo :global([data-tint-app-shell]) { min-height: 27rem; height: 27rem; }
  .workspace { padding: 1.5rem; }
  .workspace h3 { margin: 0 0 .5rem; color: var(--tint-ink); }
  .workspace p { margin: 0; color: var(--tint-muted); }
</style>
