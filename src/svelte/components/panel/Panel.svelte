<!--
  Collapsible panel: Surface + header/body/footer regions. The body stays
  mounted while collapsed (hidden), preserving scroll, focus and any editor or
  terminal state inside it.
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import Icon from '../icon/Icon.svelte'
  import { GLYPHS } from '../icon/glyphs'
  import Surface from '../surface/Surface.svelte'

  type Props = {
    title: string
    /** Controlled disclosure state; the host applies intent from the callback. */
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    icon?: Snippet
    /** Rendered beside the title, outside the toggle button. */
    status?: Snippet
    /** Independently clickable controls, outside the toggle button. */
    actions?: Snippet
    footer?: Snippet
    children?: Snippet
    class?: string
  }

  let {
    title,
    expanded,
    onExpandedChange,
    icon,
    status,
    actions,
    footer,
    children,
    class: className,
  }: Props = $props()

  const bodyId = $props.id()

  function toggle() {
    onExpandedChange(!expanded)
  }
</script>

<Surface as="section" clip elevation="sm" class={className} data-panel="" data-expanded={expanded || undefined}>
  <header class="header" data-panel-header="" data-collapsed={!expanded || undefined}>
    <button type="button" class="toggle" aria-expanded={expanded} aria-controls={bodyId} onclick={toggle}>
      <span class="chevron" data-open={expanded || undefined}><Icon icon={GLYPHS.chevronRight} size="sm" /></span>
      {#if icon}<span class="lead">{@render icon()}</span>{/if}
      <span class="title">{title}</span>
    </button>
    {#if status}<div class="status">{@render status()}</div>{/if}
    {#if actions}<div class="actions" data-panel-actions="">{@render actions()}</div>{/if}
  </header>
  <div id={bodyId} data-panel-body="" hidden={!expanded}>{@render children?.()}</div>
  {#if footer}<footer class="footer" hidden={!expanded}>{@render footer()}</footer>{/if}
</Surface>

<style>
  .header {
    display: flex;
    min-height: 2.5rem;
    align-items: center;
    border-bottom: 1px solid var(--tint-border);
    background: var(--tint-surface);
  }
  .header[data-collapsed] {
    border-bottom-color: transparent;
  }
  .toggle {
    display: flex;
    min-width: 0;
    min-height: 2.5rem;
    flex: 1;
    align-items: center;
    gap: var(--tint-space-2);
    padding: 0 var(--tint-space-3);
    border: 0;
    background: transparent;
    color: var(--tint-ink);
    font: inherit;
    font-size: var(--tint-font-size-sm);
    font-weight: 500;
    text-align: left;
    cursor: pointer;
  }
  .toggle:hover {
    background: var(--tint-accent-soft);
  }
  .toggle:focus-visible {
    outline: var(--tint-focus-width) solid var(--tint-focus);
    outline-offset: calc(var(--tint-focus-width) * -1);
  }
  .chevron {
    display: inline-flex;
    transition: transform var(--tint-motion-base) var(--tint-ease);
  }
  .chevron[data-open] {
    transform: rotate(90deg);
  }
  .lead {
    display: flex;
  }
  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .status {
    display: flex;
    min-width: 0;
    align-items: center;
    padding: 0 var(--tint-space-2);
    color: var(--tint-muted);
    font-size: var(--tint-font-size-xs);
  }
  .actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--tint-space-1);
    padding: 0 var(--tint-space-2);
  }
  .footer {
    padding: var(--tint-space-3);
    border-top: 1px solid var(--tint-border);
  }
  [hidden] {
    display: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .chevron { transition: none; }
  }
</style>
