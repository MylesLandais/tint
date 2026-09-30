<script lang="ts">
  import AppShell from './AppShell.svelte'
  import Breadcrumbs from './Breadcrumbs.svelte'
  import NavigationList from './NavigationList.svelte'

  type Props = {
    sidebarOpen: boolean
    onSidebarOpenChange: (open: boolean) => void
    activeHref?: string
  }
  let { sidebarOpen, onSidebarOpenChange, activeHref = '/home' }: Props = $props()
  const items = [
    { id: 'home', label: 'Home', href: '/home' },
    { id: 'library', label: 'Library', href: '/library' },
  ]

</script>

{#snippet sidebar()}
  <NavigationList {items} {activeHref} />
{/snippet}
{#snippet breadcrumbs()}
  <Breadcrumbs items={[{ id: 'root', label: 'Root', href: '/' }, { id: 'page', label: 'Page', href: '/page' }]} />
{/snippet}

<AppShell brand="Tint" {sidebar} {breadcrumbs} {sidebarOpen} {onSidebarOpenChange} data-testid="shell">
  <p>Content</p>
</AppShell>
