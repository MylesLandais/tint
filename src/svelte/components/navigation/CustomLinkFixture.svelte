<script lang="ts">
  import type { Snippet } from 'svelte'
  import Breadcrumbs from './Breadcrumbs.svelte'
  import NavigationList from './NavigationList.svelte'
  import type { BreadcrumbItem, NavigationItem } from './types'

  const items: NavigationItem[] = [{ id: 'home', label: 'Home', href: '/home', badge: '3' }]

</script>

{#snippet renderLink(item: NavigationItem, content: Snippet, active: boolean)}
  <a href={item.href} data-custom-active={active} aria-current={active ? 'page' : undefined}>{@render content()}</a>
{/snippet}
{#snippet renderCrumbLink(item: BreadcrumbItem, content: Snippet)}
  <a href={item.href} data-custom-crumb="">{@render content()}</a>
{/snippet}

<NavigationList {items} activeHref="/home" {renderLink} />
<Breadcrumbs items={[{ id: 'root', label: 'Root', href: '/' }, { id: 'page', label: 'Page', href: '/page' }]} renderLink={renderCrumbLink} />
