<script lang="ts">
  import type { Snippet } from 'svelte'
  import { importFileCount, type ImportReviewRow } from '../../core/form/roleplay'
  import './roleplay.css'

  type Content = string | Snippet
  type Props = {
    rows: readonly ImportReviewRow[]
    title?: string
    description?: Content
    notice?: Content
    error?: Content
    busy?: boolean
    disabled?: boolean
    complete?: boolean
    onImport: () => void
    className?: string
  }

  let { rows, title = 'Review import', description, notice, error, busy = false,
    disabled = false, complete = false, onImport, className }: Props = $props()
  let files = $derived(importFileCount(rows))
</script>

<section aria-label={title} aria-busy={busy} class={['tint-import-review', className].filter(Boolean).join(' ')}>
  <h3>{title}</h3>
  {#if typeof description === 'string'}<p class="tint-field-description">{description}</p>
  {:else if description}<div class="tint-field-description">{@render description()}</div>{/if}
  <div class="tint-import-review__table">
    <table>
      <caption class="sr-only">Import file coverage</caption>
      <thead><tr><th scope="col">Data</th><th scope="col">Files preserved</th><th scope="col">Ready to use</th><th scope="col">Read errors</th></tr></thead>
      <tbody>
        {#each rows as row (row.id)}
          <tr><th scope="row">{row.label}</th><td>{row.files}</td><td>{row.ready}</td><td>{row.errors}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if typeof notice === 'string'}<div class="tint-field-description">{notice}</div>
  {:else if notice}<div class="tint-field-description">{@render notice()}</div>{/if}
  {#if typeof error === 'string'}<div role="alert">{error}</div>
  {:else if error}<div role="alert">{@render error()}</div>{/if}
  {#if complete}<p role="status">Import saved.</p>
  {:else}<button type="button" disabled={disabled || busy || files === 0} onclick={onImport}>{busy ? 'Importing…' : `Import ${files} files`}</button>{/if}
</section>
