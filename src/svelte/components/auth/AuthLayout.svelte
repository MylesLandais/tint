<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    /** `plain` is a bare column, `card` a bordered panel with a footer band, `split` puts `aside` beside the form. */
    variant?: 'plain' | 'card' | 'split'
    title: string
    subtitle?: string
    /** Heading level for `title`. Use 2 or 3 when the page already has an h1. */
    headingLevel?: 1 | 2 | 3
    logo?: Snippet
    footer?: Snippet
    /** Decorative or editorial panel for `split`. Hidden when the layout is too narrow for two columns. */
    aside?: Snippet
    children: Snippet
    class?: string
  }
  let {
    variant = 'plain', title, subtitle, headingLevel = 1, logo, footer, aside, children, class: className,
  }: Props = $props()
</script>

<div class={['tint-auth-layout', className].filter(Boolean).join(' ')} data-variant={variant}>
  <div class="frame">
    <div class="panel">
      <header>
        {#if logo}<div class="logo">{@render logo()}</div>{/if}
        <svelte:element this={`h${headingLevel}`} class="title">{title}</svelte:element>
        {#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
      </header>
      <div class="body">{@render children()}</div>
      {#if footer}<footer>{@render footer()}</footer>{/if}
    </div>
    {#if variant === 'split' && aside}<aside>{@render aside()}</aside>{/if}
  </div>
</div>

<style>
  .tint-auth-layout { container-type: inline-size; color: var(--tint-ink); }
  .frame { display: grid; min-height: 100%; }
  .panel { display: grid; align-content: center; gap: var(--tint-space-5); width: 100%; max-width: 24rem; margin-inline: auto; padding: var(--tint-space-6) var(--tint-space-4); }
  header { display: grid; gap: var(--tint-space-2); }
  .title { margin: 0; font-size: 1.6rem; line-height: 1.2; font-weight: 650; letter-spacing: -.01em; }
  .subtitle { margin: 0; color: var(--tint-muted); font-size: .9rem; }
  .body { display: grid; gap: var(--tint-space-4); }
  footer { color: var(--tint-muted); font-size: .875rem; text-align: center; }

  [data-variant='card'] .panel { max-width: 22rem; padding: 0; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); overflow: hidden; }
  [data-variant='card'] header { padding: var(--tint-space-6) var(--tint-space-5) 0; justify-items: center; text-align: center; }
  [data-variant='card'] .title { font-size: 1.1rem; }
  [data-variant='card'] .subtitle { font-size: .8rem; }
  [data-variant='card'] .body { padding: 0 var(--tint-space-5); }
  [data-variant='card'] footer { padding: var(--tint-space-4) var(--tint-space-5); border-top: 1px solid var(--tint-border); background: var(--tint-surface); }
  [data-variant='card'] .body:last-child { padding-bottom: var(--tint-space-6); }

  aside { display: none; }
  @container (min-width: 40rem) {
    [data-variant='split'] .frame { grid-template-columns: minmax(0, 1fr) minmax(14rem, 22rem); }
    [data-variant='split'] aside { display: block; min-width: 0; border-left: 1px solid var(--tint-border); background: var(--tint-accent-soft); }
  }
</style>
