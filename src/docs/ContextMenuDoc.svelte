<script lang="ts">
  import ContextMenu from '../svelte/components/context-menu/ContextMenu.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  let open = $state(false)
  let point = $state<{ x: number; y: number } | null>(null)
  let choice = $state('None')
  const items = [
    { id: 'inspect', label: 'Inspect', onSelect: () => choice = 'Inspect' },
    { id: 'copy', label: 'Copy link', onSelect: () => choice = 'Copy link' },
  ]
  const api: ApiRow[] = [
    { prop: 'open', type: 'boolean', description: 'Host-owned menu visibility.' },
    { prop: 'position', type: '{ x: number; y: number } | null', description: 'Pointer or keyboard activation coordinates.' },
    { prop: 'onOpenChange', type: '(open: boolean) => void', description: 'Dismissal intent.' },
    { prop: 'items', type: 'MenuItem[]', description: 'Actions with stable IDs.' },
  ]
  const usage = `import { ContextMenu } from '@nebula/tint/context-menu'
let open = $state(false)
let position = $state(null)

<div oncontextmenu={(event) => {
  event.preventDefault()
  position = { x: event.clientX, y: event.clientY }
  open = true
}}>Right-click target</div>
<ContextMenu {open} {position} {items}
  onOpenChange={(next) => open = next} />`

  function show(event: MouseEvent) {
    event.preventDefault()
    point = { x: event.clientX, y: event.clientY }
    open = true
  }
</script>

<DocPage title="Context Menu" description="Pointer-positioned actions with host-owned visibility." importPath="@nebula/tint/context-menu" {usage} {api} accessibility="The menu receives focus on opening. Arrow keys, Home, End, typeahead, and Escape work across enabled items. Provide a visible alternative trigger for keyboard and touch users.">
  <div class="target" oncontextmenu={show} role="presentation">Right-click here to open actions.</div>
  <button type="button" onclick={(event) => show(event)}>Open actions with keyboard or touch</button>
  <ContextMenu {open} position={point} onOpenChange={(next) => open = next} {items} />
  <p aria-live="polite">Selected: {choice}</p>
</DocPage>

<style>
  .target { margin-bottom: .75rem; padding: 2rem; border: 1px dashed var(--tint-border-strong); border-radius: var(--tint-radius-sm); background: var(--tint-surface); color: var(--tint-muted); text-align: center; }
  button { padding: .5rem .75rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); color: var(--tint-ink); cursor: pointer; }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); }
  p { color: var(--tint-muted); font-size: .85rem; }
</style>
