<script lang="ts">
  import Icon from '../svelte/components/icon/Icon.svelte'
  import StatusIcon from '../svelte/components/icon/StatusIcon.svelte'
  import { GLYPHS } from '../svelte/components/icon/glyphs'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const api: ApiRow[] = [
    { prop: 'icon', type: 'LucideIcon', description: 'Glyph from the Lucide Svelte catalog.' },
    { prop: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", description: 'Tint size step.' },
    { prop: 'label', type: 'string', description: 'Accessible name when the icon conveys meaning.' },
    { prop: 'StatusIcon.status', type: 'StatusName', description: 'Semantic glyph and Tint status color.' },
  ]
  const usage = `import { Icon, StatusIcon } from '@nebula/tint/icon'
import Search from '@lucide/svelte/icons/search'

<Icon icon={Search} size="sm" label="Search" />
<StatusIcon status="success" />`
</script>

<DocPage title="Icon" description="A stable Tint size and accessibility boundary around Lucide Svelte glyphs." importPath="@nebula/tint/icon" {usage} {api} accessibility="Unlabelled decorative icons are hidden from assistive technology. Set label only when the glyph communicates information that is not already present in nearby text.">
  <div class="row">
    <span><Icon icon={GLYPHS.close} size="xs" label="Close" /> xs</span>
    <span><Icon icon={GLYPHS.close} size="sm" label="Close" /> sm</span>
    <span><Icon icon={GLYPHS.close} size="md" label="Close" /> md</span>
    <span><Icon icon={GLYPHS.close} size="lg" label="Close" /> lg</span>
    <span><StatusIcon status="success" /> success</span>
    <span><StatusIcon status="warning" /> warning</span>
  </div>
</DocPage>

<style>.row { display: flex; flex-wrap: wrap; gap: 1rem; } span { display: inline-flex; align-items: center; gap: .35rem; color: var(--tint-muted); font-size: .84rem; }</style>
