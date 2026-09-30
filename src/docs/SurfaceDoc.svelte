<script lang="ts">
  import Surface from '../svelte/components/surface/Surface.svelte'
  import Card from '../svelte/components/surface/Card.svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const api: ApiRow[] = [
    { prop: 'as', type: "'div' | 'section' | 'article' | 'aside'", description: 'Semantic element for the container.' },
    { prop: 'tone', type: "'default' | 'subtle' | 'accent' | 'danger'", description: 'Tint semantic surface treatment.' },
    { prop: 'elevation', type: "'none' | 'sm' | 'md' | 'lg'", description: 'Optional depth.' },
    { prop: 'density', type: "'default' | 'compact'", description: 'Card region spacing.' },
    { prop: 'selected', type: 'boolean', description: 'Visible selected state.' },
    { prop: 'interactive', type: 'boolean', description: 'Adds a visual interactive treatment; the host still supplies a native control or keyboard behavior.' },
    { prop: 'clip', type: 'boolean', description: 'Clips child content to the Surface rounded border.' },
    { prop: 'children', type: 'Snippet', description: 'Content rendered inside Surface or the Card body.' },
    { prop: 'Card.header / actions / footer', type: 'Snippet', description: 'Optional Card regions around the body; actions share the header row.' },
    { prop: 'Card.bodyClassName', type: 'string', description: 'Optional class on the Card body region.' },
  ]
  const usage = `import { Surface, Card } from '@nebula/tint/surface'

<Surface as="section" tone="subtle">Content</Surface>
<Card elevation="sm">Card body</Card>`
</script>

<DocPage title="Surface and Card" description="Composition containers that inherit the active Tint palette and scheme." importPath="@nebula/tint/surface" {usage} {api} accessibility="Choose the element that matches the content. Interactive surfaces need a native control or appropriate role and keyboard behavior supplied by the host.">
  <div class="grid">
    <Surface as="section"><span>Default surface</span></Surface>
    <Surface as="section" tone="subtle" selected><span>Selected surface</span></Surface>
    <Card elevation="sm"><strong>Card</strong><p>Content with default region spacing.</p></Card>
  </div>
</DocPage>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .75rem; }
  .grid > :global(*) { min-height: 6rem; }
  span { display: block; padding: 1rem; }
  p { margin-bottom: 0; color: var(--tint-muted); font-size: .85rem; }
</style>
