<script lang="ts">
  import Tabs from '../svelte/components/tabs/Tabs.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let value = $state('overview')
  const tabs = [
    { id: 'overview', label: 'Overview', content: 'The collection overview.' },
    { id: 'history', label: 'History', content: 'Recent changes to the collection.' },
    { id: 'pending', label: 'Pending', content: 'Not available yet.', disabled: true },
  ]
  const api: ApiRow[] = [
    { prop: 'tabs', type: 'TabItem[]', description: 'Stable ID, label, content, and optional disabled state.' },
    { prop: 'value', type: 'string', description: 'Host-owned selected tab ID.' },
    { prop: 'onValueChange', type: '(value: string) => void', description: 'Selection intent.' },
    { prop: 'label', type: 'string', description: 'Accessible name of the tab list.' },
  ]
  const usage = `import { Tabs } from '@nebula/tint/tabs'
let value = $state('overview')

<Tabs {tabs} {value}
  onValueChange={(next) => value = next}
  label="Collection views" />`
</script>

<DocPage title="Tabs" description="Controlled view switching with linked tabs and panels." importPath="@nebula/tint/tabs" {usage} {api} accessibility="The tab list has a name, each tab points to its panel, and selection is exposed with aria-selected. Arrow keys, Home, and End skip disabled tabs.">
  <Tabs {tabs} {value} onValueChange={(next) => value = next} label="Collection views" />
</DocPage>
