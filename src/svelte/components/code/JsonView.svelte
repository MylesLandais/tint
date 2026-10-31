<script lang="ts">
  import Button from '../button/Button.svelte'
  import { jsonText } from '../../../core/code'
  import HighlightedCode from './HighlightedCode.svelte'

  type Props = {
    value: unknown
    /** Supplying a label wraps the value in a native disclosure. */
    label?: string
    /** Bind this when the host needs to retain disclosure state. */
    expanded?: boolean
    /** Optional UTF-16 preview bound; formatting does not validate evidence. */
    previewLimit?: number
    previewExpanded?: boolean
    'aria-label'?: string
    class?: string
  }
  let { value, label, expanded = $bindable(false), previewLimit, previewExpanded = $bindable(false), 'aria-label': ariaLabel = 'JSON data', class: className }: Props = $props()
  let formatted = $derived(jsonText(value))
  let limit = $derived(previewLimit !== undefined && Number.isFinite(previewLimit) && previewLimit >= 0 ? Math.floor(previewLimit) : undefined)
  let bounded = $derived(formatted.status === 'ready' && limit !== undefined && formatted.text.length > limit)
  let truncated = $derived(bounded && !previewExpanded)
  let text = $derived(formatted.status === 'ready' ? (truncated ? formatted.text.slice(0, limit) + '\n…' : formatted.text) : '')
</script>

{#snippet content()}
  {#if formatted.status === 'ready'}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable evidence must be keyboard reachable.) -->
    <pre tabindex="0" role="region" aria-label={label ?? ariaLabel}><HighlightedCode code={text} language={truncated ? 'text' : 'json'} /></pre>
    {#if bounded}<Button size="sm" variant="ghost" aria-expanded={previewExpanded} onclick={() => { previewExpanded = !previewExpanded }}>{previewExpanded ? 'Show less' : `Show all ${formatted.text.length.toLocaleString()} characters`}</Button>{/if}
  {:else}
    <p data-json-status={formatted.status}>{formatted.status === 'unavailable' ? 'JSON value unavailable.' : 'This value cannot be represented as JSON.'}</p>
  {/if}
{/snippet}

{#if label !== undefined}
  <details bind:open={expanded} data-tint-json-view class={className}>
    <summary>{label}</summary>
    {@render content()}
  </details>
{:else}
  <div data-tint-json-view class={className}>{@render content()}</div>
{/if}

<style>
  details, div { min-width: 0; }
  summary { cursor: pointer; color: var(--tint-ink); font-size: var(--tint-font-size-sm); padding: var(--tint-space-2) 0; }
  summary:focus-visible, pre:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  pre { max-height: var(--tint-json-max-height, 24rem); overflow: auto; margin: 0; padding: var(--tint-space-3); border: 1px solid var(--tint-code-border); border-radius: var(--tint-radius-sm); background: var(--tint-code); color: var(--tint-code-ink); font-size: var(--tint-font-size-xs); white-space: pre-wrap; overflow-wrap: anywhere; }
  p { color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
</style>
