<script lang="ts">
  import Popover from '../svelte/components/popover/Popover.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let open = $state(false)
  const api: ApiRow[] = [
    { prop: 'open', type: 'boolean', description: 'Host-owned visibility.' },
    { prop: 'onOpenChange', type: '(open: boolean) => void', description: 'Open or close intent.' },
    { prop: 'title / description', type: 'string | Snippet', description: 'Visible content and accessible relationships.' },
    { prop: 'children', type: 'Snippet', description: 'Contextual body content rendered inside the popover panel.' },
    { prop: 'trigger', type: 'Snippet<[PopoverTriggerProps]>', description: 'Optional custom trigger; render the provided accessibility and click attributes.' },
    { prop: 'label', type: 'string', description: 'Accessible name for the default trigger and untitled panel.' },
    { prop: 'class', type: 'string', description: 'Additional class on the floating panel.' },
    { prop: 'side', type: "'top' | 'right' | 'bottom' | 'left'", description: 'Preferred placement, adjusted to the viewport.' },
  ]
  const usage = `import { Popover } from '@nebula/tint/popover'
let open = $state(false)

<Popover {open} onOpenChange={(next) => open = next}
  title="Details" label="Details">
  Contextual information
</Popover>`
</script>

<DocPage title="Popover" description="A controlled contextual surface anchored to its trigger." importPath="@nebula/tint/popover" {usage} {api} accessibility="The trigger reports expanded state and its related dialog. Opening moves focus into the panel; Escape, an outside click, or Tab leaving the panel requests closure.">
  <Popover {open} onOpenChange={(next) => open = next} title="Collection details" description="A contextual surface" label="Details">
    <p>Details for the selected collection.</p>
  </Popover>
</DocPage>

<style>p { color: var(--tint-muted); font-size: .85rem; }</style>
