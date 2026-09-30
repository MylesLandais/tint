<script lang="ts">
  import Button from '../svelte/components/button/Button.svelte'
  import Dialog from '../svelte/components/dialog/Dialog.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let open = $state(false)
  const api: ApiRow[] = [
    { prop: 'open', type: 'boolean', description: 'Host-owned modal visibility.' },
    { prop: 'onOpenChange', type: '(open: boolean) => void', description: 'Dismissal intent.' },
    { prop: 'title / description', type: 'string | Snippet', description: 'Visible heading and explanation.' },
    { prop: 'actions', type: 'Snippet', description: 'Optional footer controls.' },
    { prop: 'placement', type: "'center' | 'right'", description: 'Centered modal or right-side panel.' },
  ]
  const usage = `import { Dialog } from '@nebula/tint/dialog'
import { Button } from '@nebula/tint/button'
let open = $state(false)

<Button onclick={() => open = true}>Open</Button>
<Dialog {open} onOpenChange={(next) => open = next}
  title="Create view" description="Name the new view">
  Dialog content
</Dialog>`
</script>

<DocPage title="Dialog" description="A controlled modal surface for focused tasks and confirmations." importPath="@nebula/tint/dialog" {usage} {api} accessibility="The modal has a name and optional description. Focus moves inside when opened, background scrolling locks, and closing restores focus to the prior control.">
  <Button onclick={() => open = true}>Open dialog</Button>
  <Dialog {open} onOpenChange={(next) => open = next} title="Create view" description="A controlled modal dialog">
    <p>Choose a name for the new view.</p>
  </Dialog>
</DocPage>

<style>p { color: var(--tint-muted); font-size: .85rem; }</style>
