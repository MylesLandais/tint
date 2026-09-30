<script lang="ts">
  import Panel from '../svelte/components/panel/Panel.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let expanded = $state(true)
  const api: ApiRow[] = [
    { prop: 'title', type: 'string', description: 'Visible disclosure name.' },
    { prop: 'expanded', type: 'boolean', description: 'Current host-owned disclosure state.' },
    { prop: 'onExpandedChange', type: '(expanded: boolean) => void', description: 'Intent emitted when the toggle is activated.' },
    { prop: 'actions / status / footer', type: 'Snippet', description: 'Optional independent regions.' },
    { prop: 'icon', type: 'Snippet', description: 'Optional leading icon inside the disclosure button.' },
    { prop: 'children', type: 'Snippet', description: 'Panel body; it remains mounted while the disclosure is collapsed.' },
    { prop: 'class', type: 'string', description: 'Additional class on the panel surface.' },
  ]
  const usage = `import { Panel } from '@nebula/tint/panel'
let expanded = $state(true)

<Panel title="Inspector" {expanded}
  onExpandedChange={(next) => expanded = next}>
  Inspector content
</Panel>`
</script>

<DocPage title="Panel" description="A controlled disclosure panel with a persistent body and independent action regions." importPath="@nebula/tint/panel" {usage} {api} accessibility="The title is a button with aria-expanded and aria-controls. Toggle it with Enter or Space. The body remains mounted while collapsed to preserve child state.">
  <Panel title="Inspector" {expanded} onExpandedChange={(next) => expanded = next}>
    <p>Details remain mounted when the panel is closed.</p>
  </Panel>
</DocPage>

<style>p { margin: 0; padding: 1rem; color: var(--tint-muted); }</style>
