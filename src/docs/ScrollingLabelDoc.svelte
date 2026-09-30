<script lang="ts">
  import ScrollingLabel from '../svelte/components/scrolling-label/ScrollingLabel.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const api: ApiRow[] = [
    { prop: 'text', type: 'string', description: 'Full single-line text.' },
    { prop: 'title', type: 'string', description: 'Optional native tooltip; defaults to the full text.' },
  ]
  const usage = `import { ScrollingLabel } from '@nebula/tint/scrolling-label'

<ScrollingLabel text="A long collection title" />`
</script>

<DocPage title="Scrolling Label" description="Single-line text that moves only when its content exceeds the available width." importPath="@nebula/tint/scrolling-label" {usage} {api} accessibility="The full text remains in the DOM and title attribute. Motion pauses on hover and is disabled for reduced-motion preferences.">
  <p>Resize the browser or the containing workspace to see overflow behavior.</p>
  <div class="narrow"><ScrollingLabel text="A long collection title that moves only when there is not enough room" /></div>
  <div class="wide"><ScrollingLabel text="Short title" /></div>
</DocPage>

<style>p { color: var(--tint-muted); font-size: .85rem; } .narrow, .wide { margin-top: .7rem; padding: .5rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); } .narrow { width: min(100%, 13rem); } .wide { width: min(100%, 24rem); }</style>
