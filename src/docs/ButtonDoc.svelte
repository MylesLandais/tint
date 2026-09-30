<script lang="ts">
  import Button from '../svelte/components/button/Button.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let count = $state(0)
  const api: ApiRow[] = [
    { prop: 'variant', type: "'primary' | 'secondary' | 'ghost' | 'danger'", description: 'Visual emphasis of the action.' },
    { prop: 'size', type: "'sm' | 'md' | 'lg'", description: 'Control height and spacing.' },
    { prop: 'loading', type: 'boolean', description: 'Displays a spinner and blocks activation.' },
    { prop: 'onclick', type: 'MouseEvent handler', description: 'Called when an enabled button is activated.' },
  ]
  const usage = `import { Button } from '@nebula/tint/button'
let count = $state(0)

<Button variant="primary" onclick={() => count += 1}>Save</Button>`
</script>

<DocPage title="Button" description="A Tint action surface with semantic variants and native button behavior." importPath="@nebula/tint/button" {usage} {api} accessibility="Uses a native button. Disabled and loading states block activation; focus-visible styling follows the Tint focus token.">
  <div class="row">
    <Button variant="primary" onclick={() => count += 1}>Primary</Button>
    <Button variant="secondary" onclick={() => count += 1}>Secondary</Button>
    <Button variant="ghost" onclick={() => count += 1}>Ghost</Button>
    <Button variant="danger" onclick={() => count += 1}>Danger</Button>
    <Button disabled>Disabled</Button>
    <Button loading>Loading</Button>
  </div>
  <p aria-live="polite">Activations: {count}</p>
</DocPage>

<style>
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: .7rem; }
  p { margin-bottom: 0; color: var(--tint-muted); font-size: .85rem; }
</style>
