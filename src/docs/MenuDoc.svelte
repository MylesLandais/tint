<script lang="ts">
  import Menu from '../svelte/components/menu/Menu.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let open = $state(false)
  let choice = $state('None')
  const items = [
    { id: 'inspect', label: 'Inspect', onSelect: () => choice = 'Inspect' },
    { id: 'share', label: 'Share', onSelect: () => choice = 'Share' },
    { id: 'divider', type: 'separator' as const },
    { id: 'delete', label: 'Delete', danger: true, onSelect: () => choice = 'Delete' },
  ]
  const api: ApiRow[] = [
    { prop: 'open', type: 'boolean', description: 'Host-owned menu visibility.' },
    { prop: 'onOpenChange', type: '(open: boolean) => void', description: 'Intent to open or close.' },
    { prop: 'items', type: 'MenuItem[]', description: 'Actions and separators with stable IDs.' },
    { prop: 'trigger', type: 'Snippet', description: 'Optional custom trigger with Tint-provided ARIA props.' },
  ]
  const usage = `import { Menu } from '@nebula/tint/menu'
let open = $state(false)

<Menu {open} onOpenChange={(next) => open = next}
  label="Actions" items={items} />`
</script>

<DocPage title="Menu" description="Action selection with host-owned visibility and keyboard navigation." importPath="@nebula/tint/menu" {usage} {api} accessibility="Arrow keys, Home, End, and typeahead move through enabled items. Escape restores focus to the trigger. Disabled actions cannot be activated.">
  <Menu {open} onOpenChange={(next) => open = next} {items} label="Actions" />
  <p aria-live="polite">Selected: {choice}</p>
</DocPage>

<style>p { color: var(--tint-muted); font-size: .85rem; }</style>
