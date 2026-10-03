<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ApiRow } from './types'

  type Props = {
    title: string
    description: string
    importPath: string
    usage: string
    api: readonly ApiRow[]
    accessibility: string
    children?: Snippet
    /** Extra sections rendered between Usage and API. Each should be a `<section id>` with an h2. */
    extra?: Snippet
  }

  let { title, description, importPath, usage, api, accessibility, children, extra }: Props = $props()
</script>

<article class="doc-page">
  <header class="intro">
    <p class="eyebrow">Svelte component</p>
    <h1 tabindex="-1">{title}</h1>
    <p class="description">{description}</p>
    <code class="import-path">{importPath}</code>
  </header>

  <section id="preview" aria-labelledby="preview-title">
    <h2 id="preview-title" tabindex="-1">Live preview</h2>
    <div class="preview">{@render children?.()}</div>
  </section>

  <section id="usage" aria-labelledby="usage-title">
    <h2 id="usage-title" tabindex="-1">Usage</h2>
    <pre><code>{usage}</code></pre>
  </section>

  {@render extra?.()}

  <section id="api" aria-labelledby="api-title">
    <h2 id="api-title" tabindex="-1">API</h2>
    <div class="table-scroll">
      <table>
        <thead><tr><th scope="col">Prop</th><th scope="col">Type</th><th scope="col">Purpose</th></tr></thead>
        <tbody>
          {#each api as row (row.prop)}
            <tr><th scope="row"><code>{row.prop}</code></th><td><code>{row.type}</code></td><td>{row.description}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section id="accessibility" aria-labelledby="accessibility-title">
    <h2 id="accessibility-title" tabindex="-1">Accessibility</h2>
    <p>{accessibility}</p>
  </section>
</article>

<style>
  .doc-page { min-width: 0; max-width: 70rem; padding: clamp(1.25rem, 3vw, 3rem); }
  .intro { margin-bottom: 2.75rem; }
  .eyebrow { margin: 0 0 .5rem; color: var(--tint-accent); font-size: .72rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 0; color: var(--tint-ink); font-size: clamp(2rem, 4vw, 3.5rem); letter-spacing: -.045em; }
  h2 { margin: 0 0 1rem; color: var(--tint-ink); font-size: 1.35rem; letter-spacing: -.025em; }
  .description { max-width: 48rem; color: var(--tint-muted); line-height: 1.65; }
  .import-path { display: inline-block; max-width: 100%; overflow-wrap: anywhere; padding: .35rem .6rem; border-radius: var(--tint-radius-sm); background: var(--tint-code); color: var(--tint-code-ink); font-size: .8rem; }
  section { margin-top: 2.5rem; scroll-margin-top: 6rem; }
  .preview { min-height: 8rem; padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); container-type: inline-size; }
  pre { max-width: 100%; overflow-x: auto; margin: 0; padding: 1.25rem; border: 1px solid var(--tint-code-border); border-radius: var(--tint-radius-lg); background: var(--tint-code); color: var(--tint-code-ink); font-size: .82rem; line-height: 1.55; }
  .table-scroll { overflow-x: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); }
  table { width: 100%; border-collapse: collapse; text-align: left; font-size: .84rem; }
  th, td { padding: .8rem 1rem; border-bottom: 1px solid var(--tint-border); vertical-align: top; }
  tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
  thead { background: var(--tint-surface); color: var(--tint-muted); }
  tbody th { color: var(--tint-ink); font-weight: 500; }
  td { color: var(--tint-muted); }
  p { max-width: 52rem; color: var(--tint-muted); line-height: 1.65; }
</style>
