<script lang="ts">
  import { Button, Badge, Surface, Card, Panel, ProgressBar, ScrollingLabel, Skeleton, EmptyState, ErrorState, ConnectionStatus, Menu, Popover, Tabs, Dialog, shine, Icon } from '../index'
  import { GLYPHS } from '../components/icon/glyphs'
  import { TintFluidForm, TextField, Token, Typeahead, Tokenizer, type ChoiceOption } from '../form'

  const themes = ['tint', 'solarized', 'gruvbox', 'latte', 'frappe', 'macchiato', 'mocha'] as const
  const options: ChoiceOption[] = [
    { value: 'ambient', label: 'Ambient' },
    { value: 'electronic', label: 'Electronic' },
    { value: 'jazz', label: 'Jazz' },
    { value: 'rock', label: 'Rock' },
  ]

  let theme = $state<(typeof themes)[number]>('tint')
  let scheme = $state<'auto' | 'light' | 'dark'>('auto')
  let width = $state(960)
  let name = $state('Midnight collection')
  let invalidName = $state('')
  let disabledName = $state('Read only')
  let category = $state('')
  let categoryQuery = $state('')
  let categoryOpen = $state(false)
  let tags = $state<string[]>(['ambient'])
  let tagQuery = $state('')
  let tagsOpen = $state(false)
  let expanded = $state(true)
  let actionCount = $state(0)
  let retryCount = $state(0)
  let menuOpen = $state(false)
  let menuSelection = $state('None')
  let popoverOpen = $state(false)
  let activeTab = $state('overview')
  let dialogOpen = $state(false)
  let submitted = $state(false)

  const menuItems = [
    { id: 'inspect', label: 'Inspect', onSelect: () => menuSelection = 'Inspect' },
    { id: 'share', label: 'Share', onSelect: () => menuSelection = 'Share' },
  ]
  const tabs = [
    { id: 'overview', label: 'Overview', content: 'Collection overview' },
    { id: 'history', label: 'History', content: 'Recent changes' },
  ]

  $effect(() => {
    const root = document.documentElement
    if (theme === 'tint') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    if (scheme === 'auto') root.removeAttribute('data-scheme')
    else root.setAttribute('data-scheme', scheme)
    return () => {
      root.removeAttribute('data-theme')
      root.removeAttribute('data-scheme')
    }
  })

  function submitForm(event: SubmitEvent) {
    event.preventDefault()
    submitted = true
  }
</script>

<svelte:head>
  <meta name="description" content="Live Svelte 5 foundation components, themes, form states, and responsive layout for Tint." />
</svelte:head>

<div class="lab">
  <header class="lab-header">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">t</span>
      <span>Tint <span class="brand-muted">/ Design Lab</span></span>
    </a>
    <nav aria-label="Design Lab navigation">
      <a href="/#/">Documentation</a>
      <a href="/svelte-docs.html#/">Svelte docs</a>
      <a href="/design-lab.html" aria-current="page">Design Lab</a>
    </nav>
  </header>

  <main>
    <div class="intro">
      <p class="eyebrow">Svelte 5 foundations</p>
      <h1>Design Lab</h1>
      <p class="lede">A live reference for Tint tokens and controlled components. Change the theme, scheme, and available width to inspect each state.</p>
    </div>

    <section class="controls" aria-label="Preview controls">
      <div class="control">
        <label for="lab-theme">Theme</label>
        <select id="lab-theme" bind:value={theme}>
          {#each themes as item}
            <option value={item}>{item === 'tint' ? 'Tint default' : item}</option>
          {/each}
        </select>
      </div>
      <div class="control">
        <label for="lab-scheme">Color scheme</label>
        <select id="lab-scheme" bind:value={scheme}>
          <option value="auto">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div class="control width-control">
        <label for="lab-width">Preview width <output for="lab-width">{width}px</output></label>
        <input id="lab-width" type="range" min="320" max="1180" step="20" bind:value={width} />
      </div>
    </section>

    <p class="hint">Use Tab, arrow keys, Enter, and Escape to inspect keyboard behavior. Focus rings follow <code>--tint-focus</code>; animations follow your reduced motion setting.</p>

    <div class="preview-wrap">
      <div class="preview" style:max-width={`${width}px`}>
        <div class="preview-heading">
          <div>
            <p class="eyebrow">Foundation preview</p>
            <h2>Collection workspace</h2>
          </div>
          <Badge tone="success">Ready</Badge>
        </div>

        <div class="preview-grid">
          <section class="lab-section" aria-labelledby="buttons-heading">
            <div class="section-title"><h3 id="buttons-heading">Actions and status</h3><span>01</span></div>
            <div class="row">
              <span class="icon-example"><Icon icon={GLYPHS.close} label="Close icon" size="sm" /> Icon</span>
              <Button variant="primary" onclick={() => actionCount += 1}>Primary action</Button>
              <Button variant="secondary" onclick={() => actionCount += 1}>Secondary</Button>
              <Button variant="ghost" onclick={() => actionCount += 1}>Ghost</Button>
              <Button disabled>Disabled</Button>
            </div>
            <p class="result" aria-live="polite">Actions: {actionCount}</p>
            <div class="row">
              <Badge tone="info">In review</Badge>
              <Badge tone="warning">Needs attention</Badge>
              <Badge tone="danger">Invalid</Badge>
              <Token label="Ambient" onRemove={() => tags = tags.filter((tag) => tag !== 'ambient')} />
              <Token label="Locked" disabled />
            </div>
            <div class="mini-demo">
              <ProgressBar value={64} label="Transfer" showValue />
              <div class="scrolling-preview"><ScrollingLabel text="A longer collection title that should scroll only when it overflows" /></div>
            </div>
          </section>

          <section class="lab-section" aria-labelledby="surfaces-heading">
            <div class="section-title"><h3 id="surfaces-heading">Surfaces and motion</h3><span>02</span></div>
            <div class="row surfaces">
              <Surface tone="default"><span class="surface-content">Default surface</span></Surface>
              <Surface tone="subtle" selected><span class="surface-content">Selected surface</span></Surface>
              <div class="shine-surface" use:shine><span class="surface-content">Pointer shine</span></div>
            </div>
            <Card>
              <strong>Card composition</strong>
              <p class="small-copy">Content stays readable across Tint themes and both color schemes.</p>
            </Card>
          </section>

          <section class="lab-section span-all" aria-labelledby="forms-heading">
            <div class="section-title"><h3 id="forms-heading">Fluid forms</h3><span>03</span></div>
            <TintFluidForm id="lab-form" title="New collection" description="State lives in the host; controls report intent through callbacks." columns={2} onsubmit={submitForm}>
              <TextField id="lab-name" label="Collection name" value={name} onValueChange={(next) => name = next} required />
              <TextField id="lab-invalid" label="Invalid state" value={invalidName} onValueChange={(next) => invalidName = next} error={invalidName ? undefined : 'Enter a value to continue.'} required />
              <TextField id="lab-disabled" label="Disabled state" value={disabledName} onValueChange={(next) => disabledName = next} disabled />
              <Typeahead id="lab-typeahead" label="Primary genre" value={category} onValueChange={(next) => category = next} query={categoryQuery} onQueryChange={(next) => categoryQuery = next} open={categoryOpen} onOpenChange={(next) => categoryOpen = next} {options} />
              <Tokenizer id="lab-tokenizer" label="Tags" selected={tags} onSelectedChange={(next) => tags = next} query={tagQuery} onQueryChange={(next) => tagQuery = next} open={tagsOpen} onOpenChange={(next) => tagsOpen = next} {options} />
              <div class="form-action"><Button type="submit">Save collection</Button><span aria-live="polite">{submitted ? `Saved ${name}` : 'Ready to save'}</span></div>
            </TintFluidForm>
          </section>

          <section class="lab-section span-all" aria-labelledby="panel-heading">
            <div class="section-title"><h3 id="panel-heading">Disclosure</h3><span>04</span></div>
            <Panel title="Inspector" {expanded} onExpandedChange={(next) => expanded = next}>
              <p class="small-copy">The host owns the open state. The component keeps the disclosure keyboard accessible.</p>
            </Panel>
          </section>

          <section class="lab-section span-all" aria-labelledby="status-heading">
            <div class="section-title"><h3 id="status-heading">Status views</h3><span>05</span></div>
            <div class="status-grid">
              <div class="status-cell"><ConnectionStatus state="offline" /></div>
              <div class="status-cell"><Skeleton lines={3} label="Loading collection" /></div>
              <div class="status-cell"><EmptyState title="No matches" description="Try another filter." /></div>
              <div class="status-cell"><ErrorState title="Could not load" description="The request can be retried." onRetry={() => retryCount += 1} /></div>
            </div>
            <p class="result" aria-live="polite">Retries: {retryCount}</p>
          </section>

          <section class="lab-section span-all" aria-labelledby="interaction-heading">
            <div class="section-title"><h3 id="interaction-heading">Interaction primitives</h3><span>06</span></div>
            <div class="row">
              <Menu open={menuOpen} onOpenChange={(next) => menuOpen = next} items={menuItems} label="Actions" />
              <Popover open={popoverOpen} onOpenChange={(next) => popoverOpen = next} title="Details" description="A contextual surface" label="Details">
                <p class="small-copy">The host controls when this popover is open.</p>
              </Popover>
              <Button onclick={() => dialogOpen = true}>Open dialog</Button>
            </div>
            <p class="result" aria-live="polite">Menu selection: {menuSelection}</p>
            <Tabs {tabs} value={activeTab} onValueChange={(next) => activeTab = next} label="Collection views" />
            <Dialog open={dialogOpen} onOpenChange={(next) => dialogOpen = next} title="Create view" description="A controlled modal dialog">
              <p class="small-copy">Press Escape or use the close control to request dismissal.</p>
            </Dialog>
          </section>
        </div>
      </div>
    </div>

    <section class="reference" aria-labelledby="reference-heading">
      <div><p class="eyebrow">Consumer contract</p><h2 id="reference-heading">State in. Intent out.</h2></div>
      <pre><code>{`<TextField
  id="collection-name"
  label="Collection name"
  value={name}
  onValueChange={(next) => name = next}
/>

<Tokenizer
  selected={tags}
  onSelectedChange={(next) => tags = next}
  query={query}
  onQueryChange={(next) => query = next}
  open={open}
  onOpenChange={(next) => open = next}
  options={genreOptions}
/>`}</code></pre>
      <p class="hint">Tint owns its public props and semantic tokens. Carbon remains inside Tint’s Svelte implementation.</p>
    </section>
  </main>
</div>

<style>
  .lab { min-height: 100vh; color: var(--tint-ink); }
  .lab-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 4rem; padding: .75rem clamp(1rem, 4vw, 4rem); border-bottom: 1px solid var(--tint-border); background: var(--tint-panel); }
  .brand { display: inline-flex; align-items: center; gap: .65rem; font-weight: 700; letter-spacing: -.02em; }
  .brand-mark { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border-radius: .4rem; background: var(--tint-accent); color: var(--tint-on-accent); }
  .brand-muted { color: var(--tint-muted); font-weight: 500; }
  nav { display: flex; flex-wrap: wrap; gap: 1.25rem; font-size: .88rem; }
  nav a { color: var(--tint-muted); }
  nav a[aria-current], nav a:hover { color: var(--tint-accent); }
  nav a:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid var(--tint-focus); outline-offset: 3px; }
  main { max-width: 1500px; margin: 0 auto; padding: clamp(1.25rem, 4vw, 4rem); }
  .intro { max-width: 50rem; }
  .eyebrow { margin: 0 0 .5rem; color: var(--tint-accent); font-size: .72rem; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
  h1 { margin: 0; font-size: clamp(2.5rem, 5vw, 4.5rem); line-height: 1.05; letter-spacing: -.055em; }
  h2 { margin: 0; font-size: clamp(1.25rem, 2vw, 1.75rem); letter-spacing: -.035em; }
  h3 { margin: 0; font-size: 1rem; letter-spacing: -.02em; }
  .lede { max-width: 42rem; color: var(--tint-muted); line-height: 1.65; }
  .controls { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 2rem; padding: 1rem; border: 1px solid var(--tint-border); border-radius: .75rem; background: var(--tint-panel); }
  .control { display: grid; gap: .35rem; min-width: 11rem; font-size: .8rem; font-weight: 600; }
  .control select { min-height: 2.5rem; padding: .4rem .65rem; border: 1px solid var(--tint-border-strong); border-radius: .4rem; background: var(--tint-field); color: var(--tint-ink); }
  .width-control { flex: 1; min-width: 15rem; }
  .width-control label { display: flex; justify-content: space-between; gap: 1rem; }
  .width-control input { width: 100%; accent-color: var(--tint-accent); }
  .width-control output { color: var(--tint-muted); font-variant-numeric: tabular-nums; }
  .hint { max-width: 60rem; color: var(--tint-muted); font-size: .85rem; line-height: 1.6; }
  .preview-wrap { overflow-x: auto; margin-top: 1.5rem; padding: 1rem; border: 1px dashed var(--tint-border-strong); border-radius: .9rem; background: var(--tint-surface); }
  .preview { width: 100%; min-width: 320px; margin: 0 auto; padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--tint-border); border-radius: .75rem; background: var(--tint-panel); box-shadow: 0 12px 40px var(--tint-shadow-color); container-type: inline-size; }
  .preview-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; }
  .preview-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }
  .span-all { grid-column: 1 / -1; }
  .lab-section { min-width: 0; padding: 1rem; border: 1px solid var(--tint-border); border-radius: .55rem; background: var(--tint-surface); }
  .section-title { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; margin-bottom: 1.25rem; }
  .section-title span { color: var(--tint-muted); font-size: .7rem; font-weight: 700; }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: .65rem; }
  .icon-example { display: inline-flex; align-items: center; gap: .3rem; color: var(--tint-muted); font-size: .8rem; }
  .surfaces > :global(*) { flex: 1; min-width: 8rem; }
  .surface-content { display: block; padding: 1rem; font-size: .85rem; }
  .shine-surface { border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); }
  .result, .small-copy { color: var(--tint-muted); font-size: .85rem; line-height: 1.5; }
  .mini-demo { display: grid; gap: .7rem; max-width: 17rem; margin-top: 1rem; }
  .scrolling-preview { width: 11rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); padding: .35rem .5rem; font-size: .8rem; }
  .form-action { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; padding-block: 1rem; color: var(--tint-muted); font-size: .85rem; }
  .status-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
  .status-cell { min-width: 0; min-height: 5rem; padding: .75rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); }
  .reference { display: grid; grid-template-columns: minmax(12rem, 1fr) minmax(0, 2fr); gap: 1.5rem; margin-top: 3rem; padding-top: 3rem; border-top: 1px solid var(--tint-border); }
  .reference pre { overflow-x: auto; margin: 0; padding: 1.5rem; border: 1px solid var(--tint-code-border); border-radius: .6rem; background: var(--tint-code); color: var(--tint-code-ink); font-size: .8rem; line-height: 1.55; }
  .reference .hint { grid-column: 2; margin: 0; }
  @container (max-width: 760px) { .preview-grid, .status-grid { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 680px) { .lab-header { align-items: flex-start; flex-direction: column; } .reference { grid-template-columns: 1fr; } .reference .hint { grid-column: 1; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; transition-duration: .01ms !important; } }
</style>
