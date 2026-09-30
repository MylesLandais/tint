<script lang="ts">
  import Badge from '../svelte/components/badge/Badge.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const api: ApiRow[] = [
    { prop: 'tone', type: "'neutral' | 'accent' | 'success' | 'info' | 'warning' | 'danger'", description: 'Semantic status colors from Tint tokens.' },
    { prop: 'children', type: 'Snippet', description: 'Visible status text.' },
    { prop: 'leading', type: 'Snippet', description: 'Optional leading icon or marker.' },
  ]
  const usage = `import { Badge } from '@nebula/tint/badge'

<Badge tone="success">Ready</Badge>`
</script>

<DocPage title="Badge" description="Compact, readable state labels built from Tint's semantic colors." importPath="@nebula/tint/badge" {usage} {api} accessibility="Always provide meaningful text. The badge is a status label; use a separate button when the user can act on it.">
  <div class="row">
    <Badge>Neutral</Badge><Badge tone="accent">Accent</Badge><Badge tone="success">Ready</Badge><Badge tone="info">In review</Badge><Badge tone="warning">Attention</Badge><Badge tone="danger">Failed</Badge>
  </div>
</DocPage>

<style>.row { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; }</style>
