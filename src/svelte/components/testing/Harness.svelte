<!-- Test-only: renders snippets into the primitives under test. -->
<script lang="ts">
  import Badge from '../badge/Badge.svelte'
  import Button from '../button/Button.svelte'
  import Card from '../surface/Card.svelte'
  import Panel from '../panel/Panel.svelte'
  import Icon from '../icon/Icon.svelte'
  import { GLYPHS } from '../icon/glyphs'

  let { kind, onclick, onExpandedChange }: {
    kind: 'button' | 'button-loading' | 'badge' | 'card' | 'panel' | 'icon-labelled' | 'icon-decorative'
    onclick?: () => void
    onExpandedChange?: (expanded: boolean) => void
  } = $props()
  let expanded = $state(true)
</script>

{#if kind === 'button'}
  <Button variant="primary" size="lg" {onclick}>
    {#snippet leading()}<span data-testid="lead">L</span>{/snippet}
    Save
    {#snippet trailing()}<span data-testid="trail">T</span>{/snippet}
  </Button>
{:else if kind === 'button-loading'}
  <Button loading {onclick}>Save</Button>
{:else if kind === 'badge'}
  <Badge tone="warning">
    {#snippet leading()}<span data-testid="lead">!</span>{/snippet}
    Needs review
  </Badge>
{:else if kind === 'card'}
  <Card density="compact">
    {#snippet header()}Track metadata{/snippet}
    {#snippet actions()}<button type="button">Edit</button>{/snippet}
    Body text
    {#snippet footer()}Footer text{/snippet}
  </Card>
{:else if kind === 'panel'}
  <Panel title="Details" {expanded} onExpandedChange={(next) => { expanded = next; onExpandedChange?.(next) }}>
    {#snippet actions()}<button type="button">Refresh</button>{/snippet}
    Panel body
  </Panel>
{:else if kind === 'icon-labelled'}
  <Icon icon={GLYPHS.close} size="lg" label="Close" />
{:else}
  <Icon icon={GLYPHS.close} />
{/if}
